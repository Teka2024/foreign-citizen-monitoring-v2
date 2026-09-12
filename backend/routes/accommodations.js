const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const Accommodation = require('../models/Accommodation');
const AccommodationHistory = require('../models/AccommodationHistory');
const ForeignCitizen = require('../models/ForeignCitizen');
const Alert = require('../models/Alert');

// ==================== FILE UPLOAD CONFIGURATION (FLIGHT TICKET) ====================

const ticketUploadDir = 'uploads/tickets';
if (!fs.existsSync(ticketUploadDir)) {
  fs.mkdirSync(ticketUploadDir, { recursive: true });
}

const ticketStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ticketUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'ticket-' + uniqueSuffix + ext);
  }
});

const ticketUpload = multer({
  storage: ticketStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// ==================== GET ALL ACCOMMODATIONS ====================
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    
    // ✅ Officer: Only see their own accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      query._id = accommodationId;
    }
    // ✅ Admin: See all accommodations
    // ✅ Viewer: See all accommodations (read-only)
    
    const accommodations = await Accommodation.find(query)
      .populate('currentOccupants', 'fullName passportNumber');
    
    res.status(200).json({ 
      success: true, 
      count: accommodations.length, 
      data: accommodations 
    });
  } catch (error) {
    console.error('❌ Get accommodations error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== GET ACCOMMODATION BY ID ====================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id)
      .populate('currentOccupants', 'fullName passportNumber nationality');

    if (!accommodation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Accommodation not found' 
      });
    }
    
    // ✅ Officer: Can only view their own accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      if (accommodation._id.toString() !== accommodationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this accommodation'
        });
      }
    }
    
    res.status(200).json({ 
      success: true, 
      data: accommodation 
    });
  } catch (error) {
    console.error('❌ Get accommodation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== CREATE ACCOMMODATION ====================
// ✅ Only Admin can create accommodations
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const count = await Accommodation.countDocuments();
    const year = new Date().getFullYear();
    const registrationNumber = `ACC-${String(count + 1).padStart(4, '0')}-${year}`;

    const accommodationData = {
      name: req.body.name,
      registrationNumber: registrationNumber,
      type: req.body.type,
      address: {
        street: req.body.address?.street || '',
        city: req.body.address?.city || '',
        state: req.body.address?.state || '',
        country: req.body.address?.country || 'Ethiopia',
      },
      capacity: parseInt(req.body.capacity) || 0,
      status: req.body.status || 'active',
      createdBy: req.userId
    };

    const accommodation = new Accommodation(accommodationData);
    await accommodation.save();

    res.status(201).json({ 
      success: true, 
      message: 'Accommodation registered successfully',
      data: accommodation 
    });
  } catch (error) {
    console.error('❌ Error creating accommodation:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== UPDATE ACCOMMODATION ====================
// ✅ Only Admin can update accommodations
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    delete req.body.registrationNumber;
    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!accommodation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Accommodation not found' 
      });
    }
    res.status(200).json({ 
      success: true, 
      data: accommodation 
    });
  } catch (error) {
    console.error('❌ Update accommodation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== DELETE ACCOMMODATION ====================
// ✅ Only Admin can delete accommodations
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndDelete(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Accommodation not found' 
      });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Accommodation deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete accommodation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== CHECK-IN CITIZEN ====================
router.post('/check-in', authenticate, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { citizenId, accommodationId, checkInDate, expectedCheckOutDate, purpose, notes, roomNumber } = req.body;

    if (!citizenId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Citizen ID is required' 
      });
    }
    if (!accommodationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Accommodation ID is required' 
      });
    }

    // ✅ Officer: Can only check-in to their own accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const officerAccommodationId = req.user.accommodationId._id || req.user.accommodationId;
      if (accommodationId.toString() !== officerAccommodationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only check-in citizens to your assigned accommodation'
        });
      }
    }

    const citizen = await ForeignCitizen.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({ 
        success: false, 
        message: 'Citizen not found' 
      });
    }

    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Accommodation not found' 
      });
    }

    const existingCheckIn = await AccommodationHistory.findOne({
      citizen: citizenId,
      status: 'active'
    });
    if (existingCheckIn) {
      return res.status(400).json({ 
        success: false, 
        message: 'Citizen is already checked in' 
      });
    }

    const checkIn = new AccommodationHistory({
      citizen: citizenId,
      accommodation: accommodationId,
      checkInDate: checkInDate || new Date(),
      expectedCheckOutDate: expectedCheckOutDate,
      purpose: purpose || 'tourism',
      notes: notes || '',
      roomNumber: roomNumber || '',
      checkedInBy: req.userId
    });

    await checkIn.save();

    accommodation.currentOccupants = (accommodation.currentOccupants || 0) + 1;
    await accommodation.save();

    citizen.currentAccommodation = {
      accommodationId: accommodationId,
      checkInDate: checkInDate || new Date(),
      expectedCheckOutDate: expectedCheckOutDate,
      roomNumber: roomNumber || '',
      status: 'checked_in'
    };
    await citizen.save();

    res.status(201).json({ 
      success: true, 
      message: 'Citizen checked in successfully',
      data: checkIn 
    });
  } catch (error) {
    console.error('❌ Check-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== DEPARTURE CHECK-OUT WITH FLIGHT TICKET ====================
router.post('/check-out/depart', 
  authenticate, 
  authorize('admin', 'officer'),
  ticketUpload.single('flightTicket'),
  async (req, res) => {
    try {
      const { citizenId, checkOutDate, flightNumber, flightDate, notes } = req.body;

      console.log('🛫 Departure check-out:', { citizenId, flightNumber, flightDate });

      if (!citizenId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Citizen ID is required' 
        });
      }
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Flight ticket is required' 
        });
      }

      const citizen = await ForeignCitizen.findById(citizenId);
      if (!citizen) {
        return res.status(404).json({ 
          success: false, 
          message: 'Citizen not found' 
        });
      }

      const checkIn = await AccommodationHistory.findOne({
        citizen: citizenId,
        status: 'active'
      });

      if (!checkIn) {
        return res.status(404).json({ 
          success: false, 
          message: 'No active check-in found' 
        });
      }

      // ✅ Officer: Can only check-out citizens from their accommodation
      if (req.user.role === 'officer' && req.user.accommodationId) {
        const officerAccommodationId = req.user.accommodationId._id || req.user.accommodationId;
        if (checkIn.accommodation.toString() !== officerAccommodationId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only check-out citizens from your assigned accommodation'
          });
        }
      }

      checkIn.status = 'checked_out';
      checkIn.actualCheckOutDate = checkOutDate || new Date();
      checkIn.checkOutReason = 'depart';
      checkIn.checkedOutBy = req.userId;
      checkIn.notes = notes || checkIn.notes;
      checkIn.flightNumber = flightNumber;
      checkIn.flightDate = flightDate;
      checkIn.flightTicketUrl = req.file.path;
      await checkIn.save();

      const accommodation = await Accommodation.findById(checkIn.accommodation);
      if (accommodation) {
        accommodation.currentOccupants = Math.max(0, (accommodation.currentOccupants || 0) - 1);
        await accommodation.save();
      }

      citizen.status = 'exited';
      citizen.actualExitDate = checkOutDate || new Date();
      citizen.currentAccommodation = {
        ...citizen.currentAccommodation,
        status: 'checked_out',
        checkOutDate: checkOutDate || new Date()
      };
      await citizen.save();

      try {
        const alert = new Alert({
          citizenId: citizenId,
          type: 'notification',
          severity: 'low',
          message: `${citizen.fullName} has departed the country. Flight: ${flightNumber}`,
          status: 'new',
          createdBy: req.userId,
          metadata: {
            flightNumber,
            flightDate,
            checkOutDate: checkOutDate || new Date()
          }
        });
        await alert.save();
        console.log('✅ Alert created for departure');
      } catch (alertError) {
        console.warn('⚠️ Alert creation failed but departure succeeded:', alertError.message);
      }

      console.log(`✅ Citizen ${citizen.fullName} departed on flight ${flightNumber}`);

      res.status(200).json({
        success: true,
        message: 'Citizen checked out successfully',
        data: checkIn
      });
    } catch (error) {
      console.error('❌ Departure check-out error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

// ==================== REGULAR CHECK-OUT ====================
router.post('/check-out', authenticate, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { citizenId, checkOutDate, notes } = req.body;

    const checkIn = await AccommodationHistory.findOne({
      citizen: citizenId,
      status: 'active'
    });

    if (!checkIn) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active check-in found' 
      });
    }

    // ✅ Officer: Can only check-out from their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const officerAccommodationId = req.user.accommodationId._id || req.user.accommodationId;
      if (checkIn.accommodation.toString() !== officerAccommodationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only check-out citizens from your assigned accommodation'
        });
      }
    }

    checkIn.status = 'checked_out';
    checkIn.actualCheckOutDate = checkOutDate || new Date();
    checkIn.notes = notes || checkIn.notes;
    checkIn.checkedOutBy = req.userId;
    await checkIn.save();

    const accommodation = await Accommodation.findById(checkIn.accommodation);
    if (accommodation) {
      accommodation.currentOccupants = Math.max(0, (accommodation.currentOccupants || 0) - 1);
      await accommodation.save();
    }

    await ForeignCitizen.findByIdAndUpdate(citizenId, {
      'currentAccommodation.status': 'checked_out',
      'currentAccommodation.checkOutDate': checkOutDate || new Date()
    });

    res.status(200).json({ 
      success: true, 
      data: checkIn 
    });
  } catch (error) {
    console.error('❌ Check-out error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== GET ALL CHECK-IN HISTORY ====================
router.get('/history/all', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching all check-in history...');
    
    let filter = {};
    
    // ✅ Officer: Only see history for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      filter.accommodation = accommodationId;
    }
    
    const history = await AccommodationHistory.find(filter)
      .populate('citizen', 'fullName passportNumber nationality')
      .populate('accommodation', 'name address')
      .populate('checkedInBy', 'fullName')
      .populate('checkedOutBy', 'fullName')
      .sort({ checkInDate: -1 });
    
    console.log(`✅ Found ${history.length} records`);
    
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET CITIZEN ACCOMMODATION HISTORY ====================
router.get('/history/:citizenId', authenticate, async (req, res) => {
  try {
    let filter = { citizen: req.params.citizenId };
    
    // ✅ Officer: Only see history for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      filter.accommodation = accommodationId;
    }
    
    const history = await AccommodationHistory.find(filter)
      .populate('accommodation', 'name address')
      .populate('checkedInBy', 'fullName')
      .populate('checkedOutBy', 'fullName')
      .sort({ checkInDate: -1 });
    res.status(200).json({ 
      success: true, 
      data: history 
    });
  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== GET RECENT CHECK-INS FOR DASHBOARD ====================
router.get('/recent', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching recent check-ins...');
    const limit = parseInt(req.query.limit) || 5;
    
    let filter = {};
    
    // ✅ Officer: Only see check-ins for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      filter.accommodation = accommodationId;
    }
    
    const checkIns = await AccommodationHistory.find(filter)
      .sort({ checkInDate: -1 })
      .limit(limit)
      .lean();
    
    console.log(`✅ Found ${checkIns.length} recent check-ins`);
    
    res.status(200).json({
      success: true,
      data: checkIns,
    });
  } catch (error) {
    console.error('❌ Recent check-ins error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET ACTIVE CHECK-IN BY CITIZEN ====================
router.get('/active/:citizenId', authenticate, async (req, res) => {
  try {
    console.log(`🔍 Fetching active check-in for citizen: ${req.params.citizenId}`);
    
    let filter = {
      citizen: req.params.citizenId,
      status: 'active'
    };
    
    const checkIn = await AccommodationHistory.findOne(filter);
    
    if (!checkIn) {
      console.log('ℹ️ No active check-in found');
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active check-in found'
      });
    }
    
    // ✅ Officer: Can only view active check-ins for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      if (checkIn.accommodation.toString() !== accommodationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this check-in'
        });
      }
    }
    
    await checkIn.populate('accommodation', 'name address type capacity');
    await checkIn.populate('citizen', 'fullName passportNumber');
    
    console.log('✅ Active check-in found');
    
    res.status(200).json({
      success: true,
      data: checkIn,
    });
  } catch (error) {
    console.error('❌ Active check-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== TRANSFER CITIZEN ====================
router.post('/transfer', authenticate, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { 
      citizenId, 
      fromAccommodationId, 
      toAccommodationId, 
      expectedCheckOutDate,
      purpose,
      roomNumber,
      notes,
      transferReason 
    } = req.body;

    console.log('🔄 Transfer request:', { citizenId, fromAccommodationId, toAccommodationId });

    if (!citizenId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Citizen ID is required' 
      });
    }
    if (!fromAccommodationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current accommodation ID is required' 
      });
    }
    if (!toAccommodationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'New accommodation ID is required' 
      });
    }

    // ✅ Officer: Can only transfer from their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const officerAccommodationId = req.user.accommodationId._id || req.user.accommodationId;
      if (fromAccommodationId.toString() !== officerAccommodationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only transfer citizens from your assigned accommodation'
        });
      }
    }

    const citizen = await ForeignCitizen.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({ 
        success: false, 
        message: 'Citizen not found' 
      });
    }

    const fromAccommodation = await Accommodation.findById(fromAccommodationId);
    if (!fromAccommodation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Current accommodation not found' 
      });
    }

    const toAccommodation = await Accommodation.findById(toAccommodationId);
    if (!toAccommodation) {
      return res.status(404).json({ 
        success: false, 
        message: 'New accommodation not found' 
      });
    }

    const activeCheckIn = await AccommodationHistory.findOne({
      citizen: citizenId,
      accommodation: fromAccommodationId,
      status: 'active'
    });

    if (!activeCheckIn) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active check-in found for this citizen at the specified accommodation' 
      });
    }

    const existingAtNew = await AccommodationHistory.findOne({
      citizen: citizenId,
      accommodation: toAccommodationId,
      status: 'active'
    });

    if (existingAtNew) {
      return res.status(400).json({ 
        success: false, 
        message: 'Citizen is already checked in at the new accommodation' 
      });
    }

    // 1. Close the current check-in
    activeCheckIn.status = 'transferred';
    activeCheckIn.actualCheckOutDate = new Date();
    activeCheckIn.checkedOutBy = req.userId;
    activeCheckIn.notes = activeCheckIn.notes 
      ? `${activeCheckIn.notes} | Transferred to ${toAccommodation.name} on ${new Date().toLocaleDateString()}` 
      : `Transferred to ${toAccommodation.name} on ${new Date().toLocaleDateString()}`;
    await activeCheckIn.save();

    fromAccommodation.currentOccupants = Math.max(0, (fromAccommodation.currentOccupants || 0) - 1);
    await fromAccommodation.save();

    const newCheckIn = new AccommodationHistory({
      citizen: citizenId,
      accommodation: toAccommodationId,
      checkInDate: new Date(),
      expectedCheckOutDate: expectedCheckOutDate || activeCheckIn.expectedCheckOutDate,
      purpose: purpose || activeCheckIn.purpose || 'tourism',
      roomNumber: roomNumber || '',
      notes: notes || `Transferred from ${fromAccommodation.name}`,
      checkedInBy: req.userId,
      status: 'active',
      previousCheckInId: activeCheckIn._id,
      transferReason: transferReason || 'Transferred to new accommodation'
    });
    await newCheckIn.save();

    toAccommodation.currentOccupants = (toAccommodation.currentOccupants || 0) + 1;
    await toAccommodation.save();

    citizen.currentAccommodation = {
      accommodationId: toAccommodationId,
      checkInDate: new Date(),
      expectedCheckOutDate: expectedCheckOutDate || activeCheckIn.expectedCheckOutDate,
      roomNumber: roomNumber || '',
      status: 'checked_in'
    };
    await citizen.save();

    try {
      const alert = new Alert({
        citizenId: citizenId,
        type: 'accommodation',
        severity: 'medium',
        message: `${citizen.fullName} (${citizen.passportNumber}) has been transferred from ${fromAccommodation.name} to ${toAccommodation.name}`,
        status: 'new',
        createdBy: req.userId,
        notes: [{
          date: new Date(),
          officer: req.userId,
          note: `Transferred from ${fromAccommodation.name} to ${toAccommodation.name}`
        }]
      });
      await alert.save();
      console.log('✅ Alert created for transfer');
    } catch (alertError) {
      console.warn('⚠️ Alert creation failed but transfer succeeded:', alertError.message);
    }

    console.log(`✅ Citizen ${citizen.fullName} transferred from ${fromAccommodation.name} to ${toAccommodation.name}`);

    res.status(200).json({
      success: true,
      message: 'Citizen transferred successfully',
      data: {
        previousCheckIn: activeCheckIn,
        newCheckIn: newCheckIn,
      }
    });

  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== GET CITIZEN TRANSFER HISTORY ====================
router.get('/transfer-history/:citizenId', authenticate, async (req, res) => {
  try {
    let filter = { 
      citizen: req.params.citizenId,
      status: { $in: ['transferred', 'checked_out'] }
    };
    
    // ✅ Officer: Only see history for their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      filter.accommodation = accommodationId;
    }
    
    const history = await AccommodationHistory.find(filter)
      .populate('accommodation', 'name address')
      .populate('checkedInBy', 'fullName')
      .populate('checkedOutBy', 'fullName')
      .sort({ checkInDate: -1 });
    
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('❌ Transfer history error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;