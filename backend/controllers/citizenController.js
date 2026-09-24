const ForeignCitizen = require('../models/ForeignCitizen');
const AccommodationHistory = require('../models/AccommodationHistory');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Create a new citizen
 */
exports.createCitizen = async (req, res) => {
  try {
    // ✅ BACKEND VALIDATION: Mandatory file uploads
    if (!req.files || !req.files.photo || req.files.photo.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Passport photo is required. Please upload a photo.'
      });
    }

    if (!req.files.passportFile || req.files.passportFile.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Passport document file is required. Please upload the passport.'
      });
    }

    if (!req.files.entryDocumentFile || req.files.entryDocumentFile.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entry document file is required. Please upload the entry document.'
      });
    }

    const citizenData = req.body;

    // Check for duplicate passport or visa
    const existing = await ForeignCitizen.findOne({
      $or: [
        { passportNumber: citizenData.passportNumber },
        { visaNumber: citizenData.visaNumber }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Citizen with this passport or visa already exists'
      });
    }

    // ✅ Attach file paths to citizenData before saving
    // Adjust these field names if your multer middleware saves to different paths
    citizenData.photo = req.files.photo[0].path;
    citizenData.passportFile = req.files.passportFile[0].path;
    citizenData.entryDocumentFile = req.files.entryDocumentFile[0].path;

    const citizen = new ForeignCitizen(citizenData);
    await citizen.save();

    // Check risk factors
    await checkRiskFactors(citizen);

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'create',
      entityType: 'citizen',
      entityId: citizen._id,
      changes: { after: citizen },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      citizen
    });
  } catch (error) {
    console.error('Create citizen error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all citizens with pagination and filters
 */
exports.getAllCitizens = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      nationality,
      visaType,
      riskLevel,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (nationality) filter.nationality = nationality;
    if (visaType) filter.visaType = visaType;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (search) {
      filter.$text = { $search: search };
    }
    if (dateFrom || dateTo) {
      filter.entryDate = {};
      if (dateFrom) filter.entryDate.$gte = new Date(dateFrom);
      if (dateTo) filter.entryDate.$lte = new Date(dateTo);
    }

    const citizens = await ForeignCitizen.find(filter)
      .populate('currentAccommodation.accommodationId', 'name address type')
      .populate('monitoringOfficer', 'fullName username')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ForeignCitizen.countDocuments(filter);

    // Get accommodation status for each citizen
    const citizensWithAccommodation = await Promise.all(citizens.map(async (citizen) => {
      const activeAccommodation = await AccommodationHistory.findOne({
        citizenId: citizen._id,
        status: 'active'
      }).populate('accommodationId', 'name address type');

      return {
        ...citizen.toObject(),
        activeAccommodation
      };
    }));

    res.json({
      success: true,
      citizens: citizensWithAccommodation,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get citizens error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get citizen by ID
 */
exports.getCitizenById = async (req, res) => {
  try {
    const citizen = await ForeignCitizen.findById(req.params.id)
      .populate('currentAccommodation.accommodationId', 'name address type contactPerson')
      .populate('monitoringNotes.officer', 'fullName username')
      .populate('monitoringOfficer', 'fullName username');

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    // Get accommodation history
    const accommodationHistory = await AccommodationHistory.find({
      citizenId: citizen._id
    })
      .populate('accommodationId', 'name address type')
      .populate('verifiedBy', 'fullName username')
      .sort({ checkInDate: -1 });

    // Get alerts
    const alerts = await Alert.find({ citizenId: citizen._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      citizen,
      accommodationHistory,
      alerts
    });
  } catch (error) {
    console.error('Get citizen error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update citizen
 */
exports.updateCitizen = async (req, res) => {
  try {
    const updates = req.body;
    const citizen = await ForeignCitizen.findById(req.params.id);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    const before = citizen.toObject();

    // Update citizen
    Object.assign(citizen, updates);
    citizen.updatedAt = Date.now();

    // Recalculate risk factors
    await checkRiskFactors(citizen);

    await citizen.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'update',
      entityType: 'citizen',
      entityId: citizen._id,
      changes: { before, after: citizen },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Citizen updated successfully',
      citizen
    });
  } catch (error) {
    console.error('Update citizen error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete citizen (soft delete)
 */
exports.deleteCitizen = async (req, res) => {
  try {
    const citizen = await ForeignCitizen.findById(req.params.id);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    // Check if citizen has active accommodation
    const activeAccommodation = await AccommodationHistory.findOne({
      citizenId: citizen._id,
      status: 'active'
    });

    if (activeAccommodation) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete citizen with active accommodation. Check out first.'
      });
    }

    // Soft delete
    citizen.deletedAt = new Date();
    citizen.status = 'deleted';
    await citizen.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'delete',
      entityType: 'citizen',
      entityId: citizen._id,
      changes: { before: citizen },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Citizen deleted successfully'
    });
  } catch (error) {
    console.error('Delete citizen error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add monitoring note
 */
exports.addMonitoringNote = async (req, res) => {
  try {
    const { note, status } = req.body;
    const citizen = await ForeignCitizen.findById(req.params.id);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    citizen.monitoringNotes.push({
      note,
      status: status || citizen.status,
      officer: req.userId,
      date: new Date()
    });

    if (status) {
      citizen.status = status;
    }

    await citizen.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'update',
      entityType: 'citizen',
      entityId: citizen._id,
      changes: { after: 'Added monitoring note' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Monitoring note added',
      citizen
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Search citizens
 */
exports.searchCitizens = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        citizens: []
      });
    }

    const citizens = await ForeignCitizen.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { passportNumber: { $regex: query, $options: 'i' } },
        { nationality: { $regex: query, $options: 'i' } },
        { visaNumber: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('currentAccommodation.accommodationId', 'name address type')
    .limit(20);

    res.json({
      success: true,
      citizens
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get dashboard stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const total = await ForeignCitizen.countDocuments();
    const active = await ForeignCitizen.countDocuments({ status: 'active' });
    const overstayed = await ForeignCitizen.countDocuments({ status: 'overstayed' });
    const highRisk = await ForeignCitizen.countDocuments({
      riskLevel: { $in: ['high', 'critical'] }
    });

    // Get checked-in count
    const checkedIn = await ForeignCitizen.countDocuments({
      'currentAccommodation.status': 'checked_in'
    });

    // Get exited count
    const exited = await ForeignCitizen.countDocuments({ status: 'exited' });

    // Get recent entries
    const recentEntries = await ForeignCitizen.find()
      .populate('currentAccommodation.accommodationId', 'name')
      .sort({ entryDate: -1 })
      .limit(5);

    // Get alerts count
    const pendingAlerts = await Alert.countDocuments({
      status: { $in: ['new', 'acknowledged', 'investigating'] }
    });

    res.json({
      success: true,
      stats: {
        total,
        active,
        overstayed,
        highRisk,
        checkedIn,
        exited,
        pendingAlerts
      },
      recentEntries
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get citizen accommodation history
 */
exports.getCitizenAccommodationHistory = async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const histories = await AccommodationHistory.find({ citizenId })
      .populate('accommodationId', 'name address type')
      .populate('verifiedBy', 'fullName username')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ checkInDate: -1 });

    const total = await AccommodationHistory.countDocuments({ citizenId });

    res.json({
      success: true,
      histories,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get accommodation history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Helper: Check risk factors
 */
async function checkRiskFactors(citizen) {
  const riskFactors = [];
  const today = new Date();

  const { expiryDate, docType } = getDocumentExpiry(citizen);

  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      riskFactors.push({
        factor: 'overstay',
        description: `${docType} expired ${Math.abs(daysRemaining)} day(s) ago`
      });
      citizen.status = 'overstayed';
    } else if (daysRemaining <= 7) {
      riskFactors.push({
        factor: 'visa_expiring_soon',
        description: `${docType} expires in ${daysRemaining} day(s)`
      });
    }
  }

  const highRiskCountries = ['country1', 'country2', 'country3'];
  if (citizen.nationality && highRiskCountries.includes(citizen.nationality.toLowerCase())) {
    riskFactors.push({
      factor: 'high_risk_nationality',
      description: 'Citizen from high-risk country'
    });
  }

  if (riskFactors.length > 0) {
    citizen.riskFactors = riskFactors;

    const hasCriticalRisk = riskFactors.some(r => r.factor === 'overstay');
    if (hasCriticalRisk) {
      citizen.riskLevel = 'critical';

      const existingAlert = await Alert.findOne({
        citizenId: citizen._id,
        type: 'overstay',
        status: { $in: ['new', 'acknowledged', 'investigating'] }
      });

      if (!existingAlert) {
        await Alert.create({
          citizenId: citizen._id,
          type: 'overstay',
          severity: 'critical',
          message: `Citizen ${citizen.fullName} has overstayed their ${docType || 'document'}`,
          status: 'new',
          createdBy: citizen.monitoringOfficer || citizen._id
        });
      }
    } else if (riskFactors.length >= 2) {
      citizen.riskLevel = 'high';
    } else {
      citizen.riskLevel = 'medium';
    }
  }

  await citizen.save();
}

/**
 * Shared helper: same as in routes/dashboard.js
 */
function getDocumentExpiry(citizen) {
  const map = {
    visa:  { date: citizen.visaExpiryDate,  label: 'Visa' },
    id:    { date: citizen.idExpiryDate,    label: 'ID' },
    stamp: { date: citizen.stampExpiryDate, label: 'Stamp' },
    other: { date: citizen.otherExpiryDate, label: 'Other Document' },
  };

  if (citizen.entryDocType && map[citizen.entryDocType]?.date) {
    return {
      expiryDate: map[citizen.entryDocType].date,
      docType:    map[citizen.entryDocType].label,
    };
  }

  for (const key of ['visa', 'id', 'stamp', 'other']) {
    if (map[key].date) {
      return { expiryDate: map[key].date, docType: map[key].label };
    }
  }

  return { expiryDate: null, docType: '' };
}