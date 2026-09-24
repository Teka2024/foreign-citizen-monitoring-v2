const Accommodation = require('../models/Accommodation');
const AccommodationHistory = require('../models/AccommodationHistory');
const ForeignCitizen = require('../models/ForeignCitizen');
const AuditLog = require('../models/AuditLog');
const Alert = require('../models/Alert');
const TransferRequest = require('../models/TransferRequest');

/**
 * Register new accommodation
 */
exports.registerAccommodation = async (req, res) => {
  try {
    const accommodationData = req.body;

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

    const citizen = await ForeignCitizen.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen not found' });
    }

    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Accommodation is ${accommodation.status}. Cannot check in.`
      });
    }

    if (citizen.currentAccommodation?.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Citizen is already checked in. Please check out first.'
      });
    }

    if (accommodation.capacity && accommodation.capacity.available <= 0) {
      return res.status(400).json({ success: false, message: 'Accommodation is full' });
    }

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

    citizen.currentAccommodation = {
      accommodationId: accommodation._id,
      checkInDate: history.checkInDate,
      expectedCheckOutDate: history.expectedCheckOutDate,
      roomNumber,
      status: 'checked_in'
    };

    await citizen.save();

    if (accommodation.capacity) {
      accommodation.capacity.available = Math.max(0, accommodation.capacity.available - 1);
      await accommodation.save();
    }

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
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: 'Citizen not found' });
    }

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

    history.checkOutDate = checkOutDate || new Date();
    history.status = 'checked_out';
    if (notes) history.notes = notes;
    await history.save();

    // ✅ Cancel any pending transfer requests for this citizen
    await TransferRequest.updateMany(
      { citizen: citizenId, status: 'pending' },
      { status: 'cancelled', rejectionReason: 'Citizen checked out' }
    );

    const accommodation = await Accommodation.findById(history.accommodationId);
    if (accommodation && accommodation.capacity) {
      accommodation.capacity.available = (accommodation.capacity.available || 0) + 1;
      await accommodation.save();
    }

    citizen.currentAccommodation = {
      ...citizen.currentAccommodation,
      status: 'checked_out'
    };
    await citizen.save();

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
    res.status(500).json({ success: false, message: error.message });
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

    const accommodationsWithGuests = await Promise.all(accommodations.map(async (acc) => {
      const guestCount = await AccommodationHistory.countDocuments({
        accommodationId: acc._id,
        status: 'active'
      });
      return { ...acc.toObject(), currentGuests: guestCount };
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
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    const currentGuests = await AccommodationHistory.find({
      accommodationId: id,
      status: 'active'
    }).populate('citizenId', 'fullName passportNumber nationality');

    const history = await AccommodationHistory.find({ accommodationId: id })
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
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET CITIZEN ACCOMMODATION HISTORY ====================
exports.getCitizenAccommodationHistory = async (req, res) => {
  try {
    const { citizenId } = req.params;
    res.status(200).json({
      success: true,
      message: 'Citizen accommodation history retrieved successfully',
      data: []
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
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

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

    res.json({ success: true, message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================================================
// ==================== TRANSFER REQUEST FUNCTIONS ================
// ================================================================

/**
 * Create a transfer request (pending until accepted)
 */
exports.createTransferRequest = async (req, res) => {
  try {
    const {
      citizenId,
      toAccommodationId,
      expectedCheckOutDate,
      reason,
      notes,
      roomNumber,
      purpose
    } = req.body;

    console.log('🔄 Creating transfer request:', { citizenId, toAccommodationId });

    if (!citizenId || !toAccommodationId || !expectedCheckOutDate) {
      return res.status(400).json({
        success: false,
        message: 'citizenId, toAccommodationId, and expectedCheckOutDate are required'
      });
    }

    const activeCheckIn = await AccommodationHistory.findOne({
      citizen: citizenId,
      status: 'active'
    }).populate('accommodation', 'name');

    if (!activeCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'Citizen has no active check-in'
      });
    }

    if (req.user.role === 'officer' && req.user.accommodationId) {
      const myAccId = (req.user.accommodationId._id || req.user.accommodationId).toString();
      if (activeCheckIn.accommodation._id.toString() !== myAccId) {
        return res.status(403).json({
          success: false,
          message: 'You can only transfer citizens from your own accommodation'
        });
      }
    }

    if (activeCheckIn.accommodation._id.toString() === toAccommodationId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to the same accommodation'
      });
    }

    const existing = await TransferRequest.findOne({
      citizen: citizenId,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A transfer request is already pending for this citizen'
      });
    }

    const toAccommodation = await Accommodation.findById(toAccommodationId);
    if (!toAccommodation) {
      return res.status(404).json({ success: false, message: 'Target accommodation not found' });
    }

    const transferRequest = await TransferRequest.create({
      citizen: citizenId,
      fromAccommodation: activeCheckIn.accommodation._id,
      toAccommodation: toAccommodationId,
      requestedBy: req.userId,
      status: 'pending',
      reason: reason || '',
      notes: notes || '',
      expectedCheckOutDate,
      roomNumber: roomNumber || '',
      purpose: purpose || 'tourism'
    });

    const citizen = await ForeignCitizen.findById(citizenId);
    await Alert.create({
      citizenId,
      type: 'transfer',
      severity: 'medium',
      message: `Transfer request: ${citizen?.fullName || 'Citizen'} requested from ${activeCheckIn.accommodation.name} to ${toAccommodation.name}`,
      status: 'new',
      createdBy: req.userId,
      metadata: {
        fromAccommodation: activeCheckIn.accommodation._id,
        toAccommodation: toAccommodationId,
        transferReason: reason || ''
      }
    });

    await transferRequest.populate([
      { path: 'citizen', select: 'firstName middleName lastName fullName passportNumber nationality photo' },
      { path: 'fromAccommodation', select: 'name' },
      { path: 'toAccommodation', select: 'name' }
    ]);

    console.log('✅ Transfer request created:', transferRequest._id);

    res.status(201).json({
      success: true,
      message: 'Transfer request sent. Waiting for the receiving accommodation to respond.',
      data: transferRequest
    });
  } catch (error) {
    console.error('❌ Create transfer request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ List transfer requests (scoped by role) — WITH FULL NAME FIX
 */
exports.getTransferRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'officer' && req.user.accommodationId) {
      const myAccId = req.user.accommodationId._id || req.user.accommodationId;
      filter.$or = [
        { fromAccommodation: myAccId },
        { toAccommodation: myAccId }
      ];
    }

    const requests = await TransferRequest.find(filter)
      .populate('citizen', 'firstName middleName lastName fullName passportNumber nationality photo')
      .populate('fromAccommodation', 'name address')
      .populate('toAccommodation', 'name address')
      .populate('requestedBy', 'fullName')
      .populate('respondedBy', 'fullName')
      .sort({ createdAt: -1 });

    // ✅ Build fullName for each citizen (virtuals aren't populated by default)
    const requestsWithFullName = requests.map((req) => {
      const obj = req.toObject();
      if (obj.citizen && !obj.citizen.fullName) {
        const parts = [obj.citizen.firstName, obj.citizen.middleName, obj.citizen.lastName]
          .filter(Boolean);
        obj.citizen.fullName = parts.join(' ') || 'N/A';
      }
      return obj;
    });

    res.json({ success: true, data: requestsWithFullName });
  } catch (error) {
    console.error('❌ List transfer requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Accept a transfer request
 */
exports.acceptTransferRequest = async (req, res) => {
  try {
    const request = await TransferRequest.findById(req.params.id)
      .populate('citizen')
      .populate('fromAccommodation')
      .populate('toAccommodation');

    if (!request || request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer request not found or already handled'
      });
    }

    if (req.user.role === 'officer' && req.user.accommodationId) {
      const myAccId = (req.user.accommodationId._id || req.user.accommodationId).toString();
      if (request.toAccommodation._id.toString() !== myAccId) {
        return res.status(403).json({
          success: false,
          message: 'Only the target accommodation can accept this transfer'
        });
      }
    }

    const currentCheckIn = await AccommodationHistory.findOne({
      citizen: request.citizen._id,
      accommodation: request.fromAccommodation._id,
      status: 'active'
    });

    if (!currentCheckIn) {
      request.status = 'cancelled';
      request.respondedBy = req.userId;
      request.respondedAt = new Date();
      request.rejectionReason = 'Citizen is no longer checked in at the origin accommodation';
      await request.save();
      return res.status(400).json({
        success: false,
        message: 'Citizen is no longer checked in at the origin accommodation'
      });
    }

    const targetAcc = await Accommodation.findById(request.toAccommodation._id);
    if (targetAcc.capacity > 0 && targetAcc.currentOccupants >= targetAcc.capacity) {
      request.status = 'rejected';
      request.respondedBy = req.userId;
      request.respondedAt = new Date();
      request.rejectionReason = 'Target accommodation is at full capacity';
      await request.save();
      return res.status(400).json({
        success: false,
        message: 'Target accommodation is at full capacity'
      });
    }

    currentCheckIn.status = 'transferred';
    currentCheckIn.actualCheckOutDate = new Date();
    currentCheckIn.checkOutReason = 'transfer';
    currentCheckIn.checkedOutBy = req.userId;
    currentCheckIn.notes = currentCheckIn.notes
      ? `${currentCheckIn.notes} | Transferred to ${targetAcc.name}`
      : `Transferred to ${targetAcc.name}`;
    await currentCheckIn.save();

    const newCheckIn = new AccommodationHistory({
      citizen: request.citizen._id,
      accommodation: targetAcc._id,
      checkInDate: new Date(),
      expectedCheckOutDate: request.expectedCheckOutDate,
      purpose: request.purpose,
      roomNumber: request.roomNumber,
      notes: request.notes || `Transferred from ${request.fromAccommodation.name}`,
      checkedInBy: req.userId,
      status: 'active',
      previousCheckInId: currentCheckIn._id,
      transferReason: request.reason || 'Transferred to new accommodation'
    });
    await newCheckIn.save();

    await Accommodation.findByIdAndUpdate(request.fromAccommodation._id, {
      $inc: { currentOccupants: -1 }
    });
    await Accommodation.findByIdAndUpdate(request.toAccommodation._id, {
      $inc: { currentOccupants: 1 }
    });

    await ForeignCitizen.findByIdAndUpdate(request.citizen._id, {
      currentAccommodation: {
        accommodationId: targetAcc._id,
        checkInDate: new Date(),
        expectedCheckOutDate: request.expectedCheckOutDate,
        roomNumber: request.roomNumber,
        status: 'checked_in'
      }
    });

    request.status = 'accepted';
    request.respondedBy = req.userId;
    request.respondedAt = new Date();
    await request.save();

    await Alert.create({
      citizenId: request.citizen._id,
      type: 'transfer',
      severity: 'low',
      message: `Transfer accepted: ${request.citizen.fullName} is now at ${targetAcc.name}`,
      status: 'resolved',
      createdBy: req.userId,
      resolution: 'Transfer completed successfully'
    });

    console.log(`✅ Transfer accepted: ${request.citizen.fullName} → ${targetAcc.name}`);

    res.json({
      success: true,
      message: 'Transfer accepted successfully',
      data: { newCheckIn }
    });
  } catch (error) {
    console.error('❌ Accept transfer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject a transfer request
 */
exports.rejectTransferRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await TransferRequest.findById(req.params.id)
      .populate('citizen')
      .populate('fromAccommodation')
      .populate('toAccommodation');

    if (!request || request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer request not found or already handled'
      });
    }

    if (req.user.role === 'officer' && req.user.accommodationId) {
      const myAccId = (req.user.accommodationId._id || req.user.accommodationId).toString();
      if (request.toAccommodation._id.toString() !== myAccId) {
        return res.status(403).json({
          success: false,
          message: 'Only the target accommodation can reject this transfer'
        });
      }
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason || 'No reason provided';
    request.respondedBy = req.userId;
    request.respondedAt = new Date();
    await request.save();

    await Alert.create({
      citizenId: request.citizen._id,
      type: 'transfer',
      severity: 'medium',
      message: `Transfer rejected by ${request.toAccommodation.name}: ${request.rejectionReason}`,
      status: 'new',
      createdBy: req.userId
    });

    console.log(`❌ Transfer rejected: ${request.citizen.fullName}`);

    res.json({
      success: true,
      message: 'Transfer rejected',
      data: request
    });
  } catch (error) {
    console.error('❌ Reject transfer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel a pending transfer request (by the requester)
 */
exports.cancelTransferRequest = async (req, res) => {
  try {
    const request = await TransferRequest.findById(req.params.id);

    if (!request || request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer request not found or already handled'
      });
    }

    if (request.requestedBy.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can cancel this transfer'
      });
    }

    request.status = 'cancelled';
    request.respondedBy = req.userId;
    request.respondedAt = new Date();
    request.rejectionReason = 'Cancelled by requester';
    await request.save();

    res.json({ success: true, message: 'Transfer cancelled', data: request });
  } catch (error) {
    console.error('❌ Cancel transfer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};