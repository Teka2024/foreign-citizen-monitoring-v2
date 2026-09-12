const Accommodation = require('../models/Accommodation');
const AccommodationHistory = require('../models/AccommodationHistory');
const ForeignCitizen = require('../models/ForeignCitizen');
const AuditLog = require('../models/AuditLog');
const Alert = require('../models/Alert');

/**
 * Register new accommodation
 */
exports.registerAccommodation = async (req, res) => {
  try {
    const accommodationData = req.body;
    
    // Check if accommodation already exists
    const existing = await Accommodation.findOne({
      'address.street': accommodationData.address.street,
      'address.city': accommodationData.address.city,
      name: accommodationData.name
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Accommodation already registered at this location'
      });
    }

    const accommodation = new Accommodation(accommodationData);
    await accommodation.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'create',
      entityType: 'accommodation',
      entityId: accommodation._id,
      changes: { after: accommodation },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Accommodation registered successfully',
      accommodation
    });
  } catch (error) {
    console.error('Register accommodation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Check-in citizen to accommodation
 */
exports.checkInCitizen = async (req, res) => {
  try {
    const { 
      citizenId, 
      accommodationId, 
      checkInDate, 
      expectedCheckOutDate, 
      roomNumber, 
      purpose,
      notes 
    } = req.body;

    // Validate citizen
    const citizen = await ForeignCitizen.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    // Validate accommodation
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    // Check if accommodation is active
    if (accommodation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Accommodation is ${accommodation.status}. Cannot check in.`
      });
    }

    // Check if citizen already has an active check-in
    if (citizen.currentAccommodation?.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Citizen is already checked in. Please check out first.'
      });
    }

    // Check if accommodation has capacity
    if (accommodation.capacity && accommodation.capacity.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Accommodation is full'
      });
    }

    // Create accommodation history
    const history = new AccommodationHistory({
      citizenId: citizen._id,
      accommodationId: accommodation._id,
      checkInDate: checkInDate || new Date(),
      expectedCheckOutDate,
      roomNumber,
      purpose,
      notes,
      status: 'active',
      verifiedBy: req.userId,
      verificationDate: new Date()
    });

    await history.save();

    // Update citizen's current accommodation
    citizen.currentAccommodation = {
      accommodationId: accommodation._id,
      checkInDate: history.checkInDate,
      expectedCheckOutDate: history.expectedCheckOutDate,
      roomNumber,
      status: 'checked_in'
    };

    await citizen.save();

    // Update accommodation capacity
    if (accommodation.capacity) {
      accommodation.capacity.available = Math.max(0, accommodation.capacity.available - 1);
      await accommodation.save();
    }

    // Check for overstay risk
    const today = new Date();
    const daysUntilCheckOut = Math.ceil((expectedCheckOutDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckOut < 7) {
      await Alert.create({
        citizenId: citizen._id,
        type: 'accommodation',
        severity: 'medium',
        message: `Citizen ${citizen.fullName} has check-out in ${daysUntilCheckOut} days`,
        status: 'new',
        createdBy: req.userId
      });
    }

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'check_in',
      entityType: 'history',
      entityId: history._id,
      changes: { after: { citizenId, accommodationId, checkInDate, expectedCheckOutDate } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Citizen checked in successfully',
      history,
      currentAccommodation: citizen.currentAccommodation
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Check-out citizen from accommodation
 */
exports.checkOutCitizen = async (req, res) => {
  try {
    const { citizenId, checkOutDate, notes } = req.body;

    const citizen = await ForeignCitizen.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found'
      });
    }

    // Find active accommodation history
    const history = await AccommodationHistory.findOne({
      citizenId: citizen._id,
      status: 'active'
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'No active accommodation found for this citizen'
      });
    }

    // Update history
    history.checkOutDate = checkOutDate || new Date();
    history.status = 'checked_out';
    if (notes) history.notes = notes;
    await history.save();

    // Update accommodation capacity
    const accommodation = await Accommodation.findById(history.accommodationId);
    if (accommodation && accommodation.capacity) {
      accommodation.capacity.available = (accommodation.capacity.available || 0) + 1;
      await accommodation.save();
    }

    // Update citizen's current accommodation
    citizen.currentAccommodation = {
      ...citizen.currentAccommodation,
      status: 'checked_out'
    };
    await citizen.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'check_out',
      entityType: 'history',
      entityId: history._id,
      changes: { after: { checkOutDate: history.checkOutDate, status: 'checked_out' } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Citizen checked out successfully',
      history
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all accommodations with filters
 */
exports.getAllAccommodations = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, city, search } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.street': { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const accommodations = await Accommodation.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Accommodation.countDocuments(filter);

    // Get current guest count for each accommodation
    const accommodationsWithGuests = await Promise.all(accommodations.map(async (acc) => {
      const guestCount = await AccommodationHistory.countDocuments({
        accommodationId: acc._id,
        status: 'active'
      });
      return {
        ...acc.toObject(),
        currentGuests: guestCount
      };
    }));

    res.json({
      success: true,
      accommodations: accommodationsWithGuests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get accommodations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get accommodation by ID
 */
exports.getAccommodationById = async (req, res) => {
  try {
    const { id } = req.params;

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    // Get current guests
    const currentGuests = await AccommodationHistory.find({
      accommodationId: id,
      status: 'active'
    }).populate('citizenId', 'fullName passportNumber nationality');

    // Get check-in history
    const history = await AccommodationHistory.find({
      accommodationId: id
    })
      .populate('citizenId', 'fullName passportNumber nationality')
      .sort({ checkInDate: -1 })
      .limit(20);

    res.json({
      success: true,
      accommodation,
      currentGuests,
      guestCount: currentGuests.length,
      recentHistory: history
    });
  } catch (error) {
    console.error('Get accommodation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update accommodation
 */
exports.updateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const accommodation = await Accommodation.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'update',
      entityType: 'accommodation',
      entityId: accommodation._id,
      changes: { after: updates },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Accommodation updated successfully',
      accommodation
    });
  } catch (error) {
    console.error('Update accommodation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// ==================== GET CITIZEN ACCOMMODATION HISTORY ====================

exports.getCitizenAccommodationHistory = async (req, res) => {
  try {
    const { citizenId } = req.params;

    // TODO: Replace this with your actual database query
    // Example: const history = await AccommodationHistory.find({ citizenId });

    res.status(200).json({
      success: true,
      message: 'Citizen accommodation history retrieved successfully',
      data: [] // Placeholder - replace with actual data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching accommodation history',
      error: error.message
    });
  }
};
/**
 * Delete accommodation
 */
exports.deleteAccommodation = async (req, res) => {
  try {
    const { id } = req.params;

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found'
      });
    }

    // Check if there are active guests
    const activeGuests = await AccommodationHistory.countDocuments({
      accommodationId: id,
      status: 'active'
    });

    if (activeGuests > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete accommodation with ${activeGuests} active guests`
      });
    }

    await accommodation.deleteOne();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      username: req.user.username,
      action: 'delete',
      entityType: 'accommodation',
      entityId: id,
      changes: { before: accommodation },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Accommodation deleted successfully'
    });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};