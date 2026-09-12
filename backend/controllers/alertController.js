const Alert = require('../models/Alert');
const ForeignCitizen = require('../models/ForeignCitizen');
const AuditLog = require('../models/AuditLog');

/**
 * Get all alerts with filters
 */
exports.getAllAlerts = async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      type,
      assignedTo,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (assignedTo) filter.assignedTo = assignedTo;

    const alerts = await Alert.find(filter)
      .populate('citizenId', 'fullName passportNumber nationality')
      .populate('assignedTo', 'fullName username')
      .populate('createdBy', 'fullName username')
      .populate('resolvedBy', 'fullName username')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Alert.countDocuments(filter);

    res.json({
      success: true,
      alerts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get alert by ID
 */
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('citizenId', 'fullName passportNumber nationality status')
      .populate('assignedTo', 'fullName username email')
      .populate('createdBy', 'fullName username')
      .populate('resolvedBy', 'fullName username')
      .populate('notes.officer', 'fullName username');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new alert
 */
exports.createAlert = async (req, res) => {
  try {
    const alertData = req.body;
    
    // Verify citizen exists
    const citizen = await ForeignCitizen.findById(alertData.citizenId);
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    const alert = new Alert({
      ...alertData,
      createdBy: req.userId
    });

    await alert.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'create',
      entityType: 'alert',
      entityId: alert._id,
      changes: { after: alert },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update alert
 */
exports.updateAlert = async (req, res) => {
  try {
    const { status, assignedTo, resolution, notes } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    const before = alert.toObject();

    if (status) {
      alert.status = status;
      if (status === 'resolved') {
        alert.resolvedAt = new Date();
        alert.resolvedBy = req.userId;
      }
    }
    if (assignedTo) alert.assignedTo = assignedTo;
    if (resolution) alert.resolution = resolution;
    if (notes) {
      alert.notes.push({
        note: notes,
        officer: req.userId,
        date: new Date()
      });
    }

    await alert.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'update',
      entityType: 'alert',
      entityId: alert._id,
      changes: { before, after: alert },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get alerts for a specific citizen
 */
exports.getCitizenAlerts = async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const alerts = await Alert.find({ citizenId })
      .populate('assignedTo', 'fullName username')
      .populate('createdBy', 'fullName username')
      .populate('resolvedBy', 'fullName username')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Alert.countDocuments({ citizenId });

    res.json({
      success: true,
      alerts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get citizen alerts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get alert statistics
 */
exports.getAlertStats = async (req, res) => {
  try {
    const total = await Alert.countDocuments();
    const newAlerts = await Alert.countDocuments({ status: 'new' });
    const acknowledged = await Alert.countDocuments({ status: 'acknowledged' });
    const investigating = await Alert.countDocuments({ status: 'investigating' });
    const resolved = await Alert.countDocuments({ status: 'resolved' });

    const critical = await Alert.countDocuments({ severity: 'critical' });
    const high = await Alert.countDocuments({ severity: 'high' });

    // Group by type
    const typeStats = await Alert.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          new: newAlerts,
          acknowledged,
          investigating,
          resolved
        },
        bySeverity: {
          critical,
          high,
          medium: await Alert.countDocuments({ severity: 'medium' }),
          low: await Alert.countDocuments({ severity: 'low' })
        },
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};