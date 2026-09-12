const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Alert = require('../models/Alert');

// ==================== GET ALL ALERTS ====================
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, limit } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }
    if (type) query.type = type;
    
    // ✅ Officer: Only see alerts related to their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      query['metadata.toAccommodation'] = accommodationId;
      // Also show alerts where citizen is at their accommodation
      query.$or = [
        { 'metadata.toAccommodation': accommodationId },
        { 'metadata.fromAccommodation': accommodationId }
      ];
    }
    
    const alerts = await Alert.find(query)
      .populate('citizenId', 'fullName passportNumber')
      .populate('createdBy', 'fullName')
      .populate('assignedTo', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50);
    
    res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== GET ALERT STATISTICS ====================
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    let query = {};
    
    // ✅ Officer: Only see alerts related to their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      query = {
        $or: [
          { 'metadata.toAccommodation': accommodationId },
          { 'metadata.fromAccommodation': accommodationId }
        ]
      };
    }
    
    const [total, newAlerts, acknowledged, investigating, resolved] = await Promise.all([
      Alert.countDocuments(query),
      Alert.countDocuments({ ...query, status: 'new' }),
      Alert.countDocuments({ ...query, status: 'acknowledged' }),
      Alert.countDocuments({ ...query, status: 'investigating' }),
      Alert.countDocuments({ ...query, status: 'resolved' })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total: total || 0,
        new: newAlerts || 0,
        acknowledged: acknowledged || 0,
        investigating: investigating || 0,
        resolved: resolved || 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== GET ALERT BY ID ====================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('citizenId', 'fullName passportNumber')
      .populate('createdBy', 'fullName')
      .populate('assignedTo', 'fullName');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    // ✅ Officer: Can only view alerts for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      const isRelated = alert.metadata?.toAccommodation === accommodationId.toString() ||
                        alert.metadata?.fromAccommodation === accommodationId.toString();
      if (!isRelated) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this alert'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('❌ Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== CREATE ALERT ====================
router.post('/', authenticate, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { citizenId, type, severity, message, status, assignedTo, metadata } = req.body;
    
    const alert = new Alert({
      citizenId: citizenId || null,
      type: type || 'notification',
      severity: severity || 'medium',
      message: message || 'Alert created',
      status: status || 'new',
      assignedTo: assignedTo || null,
      createdBy: req.userId,
      metadata: metadata || {}
    });
    
    await alert.save();
    
    const populatedAlert = await Alert.findById(alert._id)
      .populate('citizenId', 'fullName passportNumber')
      .populate('createdBy', 'fullName');
    
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: populatedAlert
    });
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== UPDATE ALERT STATUS ====================
router.put('/:id', authenticate, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { status, assignedTo, resolution, note } = req.body;
    
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    if (status) {
      alert.status = status;
      if (status === 'resolved') {
        alert.resolvedAt = new Date();
        alert.resolvedBy = req.userId;
      }
    }
    if (assignedTo) alert.assignedTo = assignedTo;
    if (resolution) {
      alert.resolution = resolution;
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.userId;
    }
    if (note) {
      alert.notes.push({
        date: new Date(),
        officer: req.userId,
        note: note
      });
    }
    
    await alert.save();
    
    const populatedAlert = await Alert.findById(alert._id)
      .populate('citizenId', 'fullName passportNumber')
      .populate('createdBy', 'fullName')
      .populate('assignedTo', 'fullName');
    
    res.status(200).json({
      success: true,
      message: 'Alert updated successfully',
      data: populatedAlert
    });
  } catch (error) {
    console.error('❌ Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== DELETE ALERT ====================
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;