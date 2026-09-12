const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize, authorizeOfficer } = require('../middleware/auth');
const ForeignCitizen = require('../models/ForeignCitizen');

// ==================== FILE UPLOAD CONFIGURATION ====================

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== SEARCH CITIZENS (With Officer Filtering) ====================
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const searchRegex = new RegExp(query, 'i');
    let filter = {};
    
    // ✅ Officer: Only see citizens at their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      filter['currentAccommodation.accommodationId'] = accommodationId;
    }
    
    // ✅ Viewer: See all citizens (read-only)
    // ✅ Admin: See all citizens

    const citizens = await ForeignCitizen.find({
      $and: [
        filter,
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { fullName: searchRegex },
            { passportNumber: searchRegex },
            { nationality: searchRegex },
          ]
        }
      ]
    }).limit(20);

    res.status(200).json({ 
      success: true, 
      data: citizens,
      count: citizens.length 
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== GET ALL CITIZENS ====================
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    let query = {};
    
    // ✅ Officer: Only see citizens at their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      query['currentAccommodation.accommodationId'] = accommodationId;
    }
    
    // ✅ Viewer: See all citizens (read-only)
    // ✅ Admin: See all citizens

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        ...query,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { fullName: searchRegex },
          { passportNumber: searchRegex },
          { nationality: searchRegex },
        ]
      };
    }

    const citizens = await ForeignCitizen.find(query)
      .populate('monitoringOfficer', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await ForeignCitizen.countDocuments(query);
    
    res.status(200).json({ 
      success: true, 
      data: citizens,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching citizens:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET CITIZEN BY ID ====================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const citizen = await ForeignCitizen.findById(req.params.id)
      .populate('monitoringOfficer', 'fullName')
      .populate('createdBy', 'fullName');
    
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen not found' });
    }
    
    // ✅ Officer: Can only view citizens at their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      if (citizen.currentAccommodation?.accommodationId?.toString() !== accommodationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this citizen'
        });
      }
    }
    
    res.status(200).json({ success: true, data: citizen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CREATE CITIZEN ====================
router.post('/', 
  authenticate, 
  authorize('admin', 'officer'),
  upload.any(),
  async (req, res) => {
    try {
      console.log('🔵 Creating citizen with data:', req.body);
      console.log('📎 Files received:', req.files ? req.files.length : 0);

      const citizenData = {
        firstName: req.body.firstName || '',
        middleName: req.body.middleName || '',
        lastName: req.body.lastName || '',
        passportNumber: req.body.passportNumber,
        passportIssueDate: req.body.passportIssueDate || null,
        passportExpiryDate: req.body.passportExpiryDate || null,
        nationality: req.body.nationality,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,

        // ✅ Entry Document Type
        entryDocType: req.body.entryDocType || 'visa',

        // ✅ Visa fields
        visaType: req.body.visaType || undefined,
        visaNumber: req.body.visaNumber || undefined,
        visaIssueDate: req.body.visaIssueDate || undefined,
        visaExpiryDate: req.body.visaExpiryDate || undefined,

        // ✅ ID fields
        idNumber: req.body.idNumber || undefined,
        idType: req.body.idType || undefined,
        idIssueDate: req.body.idIssueDate || undefined,
        idExpiryDate: req.body.idExpiryDate || undefined,

        // ✅ Stamp fields
        stampNumber: req.body.stampNumber || undefined,
        stampType: req.body.stampType || undefined,
        stampIssueDate: req.body.stampIssueDate || undefined,
        stampExpiryDate: req.body.stampExpiryDate || undefined,

        // ✅ Other document fields
        otherDocName: req.body.otherDocName || undefined,
        otherDocNumber: req.body.otherDocNumber || undefined,
        otherIssueDate: req.body.otherIssueDate || undefined,
        otherExpiryDate: req.body.otherExpiryDate || undefined,

        entryDate: req.body.entryDate,
        expectedExitDate: req.body.expectedExitDate,
        entryPort: req.body.entryPort,
        riskLevel: req.body.riskLevel || 'low',
        status: req.body.status || 'active',
        createdBy: req.userId,
        personalContact: {
          phone: req.body['personalContact.phone'] || '',
          email: req.body['personalContact.email'] || '',
        }
      };

      // ✅ Officer: Auto-assign citizen to their accommodation
      if (req.user.role === 'officer' && req.user.accommodationId) {
        const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
        citizenData.currentAccommodation = {
          accommodationId: accommodationId,
          status: 'pending_checkout'
        };
      }

      // Add placeOfBirth if provided
      if (req.body['placeOfBirth.city'] || req.body['placeOfBirth.country']) {
        citizenData.placeOfBirth = {
          city: req.body['placeOfBirth.city'] || '',
          country: req.body['placeOfBirth.country'] || ''
        };
      }

      // Add employment if provided
      if (req.body['employment.employer'] || req.body['employment.position']) {
        citizenData.employment = {
          employer: req.body['employment.employer'] || '',
          position: req.body['employment.position'] || '',
          address: req.body['employment.address'] || '',
          phone: req.body['employment.phone'] || '',
          startDate: req.body['employment.startDate'] || null,
          endDate: req.body['employment.endDate'] || null
        };
      }

      // Add education if provided
      if (req.body['education.institution'] || req.body['education.course']) {
        citizenData.education = {
          institution: req.body['education.institution'] || '',
          course: req.body['education.course'] || '',
          startDate: req.body['education.startDate'] || null,
          endDate: req.body['education.endDate'] || null,
          studentId: req.body['education.studentId'] || ''
        };
      }

      if (req.files) {
        const photoFile = req.files.find(f => f.fieldname === 'photo');
        if (photoFile) {
          citizenData.photo = photoFile.path;
          console.log('📸 Photo uploaded:', citizenData.photo);
        }

        const docFiles = req.files.filter(f => f.fieldname === 'documents' || f.fieldname.startsWith('documents['));
        if (docFiles.length > 0) {
          citizenData.documents = [];
          docFiles.forEach((file, index) => {
            const docData = {
              docType: req.body[`documents[${index}].docType`] || 'other',
              issueDate: req.body[`documents[${index}].issueDate`] || null,
              expiryDate: req.body[`documents[${index}].expiryDate`] || null,
              issuingAuthority: req.body[`documents[${index}].issuingAuthority`] || '',
              fileUrl: file.path,
              fileName: file.originalname,
              fileSize: file.size,
              fileType: file.mimetype,
              isVerified: false,
              uploadedAt: new Date(),
              uploadedBy: req.userId
            };

            if (req.body[`documents[${index}].docType`] === 'visa') {
              docData.visaType = req.body[`documents[${index}].visaType`] || '';
              docData.visaNumber = req.body[`documents[${index}].visaNumber`] || '';
            }
            if (req.body[`documents[${index}].docType`] === 'id') {
              docData.idType = req.body[`documents[${index}].idType`] || '';
              docData.idNumber = req.body[`documents[${index}].idNumber`] || '';
            }
            if (req.body[`documents[${index}].docType`] === 'stamp') {
              docData.stampType = req.body[`documents[${index}].stampType`] || '';
              docData.stampNumber = req.body[`documents[${index}].stampNumber`] || '';
            }
            if (req.body[`documents[${index}].docType`] === 'other') {
              docData.documentName = req.body[`documents[${index}].documentName`] || '';
            }

            citizenData.documents.push(docData);
          });
          console.log(`📄 ${citizenData.documents.length} documents uploaded`);
        }
      }

      console.log('📦 Final citizen data:', JSON.stringify(citizenData, null, 2));

      const citizen = new ForeignCitizen(citizenData);
      await citizen.save();

      console.log('✅ Citizen saved successfully:', citizen._id);

      res.status(201).json({ 
        success: true, 
        message: 'Citizen registered successfully',
        data: citizen 
      });
    } catch (error) {
      console.error('❌ Error creating citizen:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// ==================== UPDATE CITIZEN ====================
router.put('/:id', authenticate, authorize('admin', 'officer'), async (req, res) => {
  try {
    const citizen = await ForeignCitizen.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.userId },
      { new: true, runValidators: true }
    );
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen not found' });
    }
    res.status(200).json({ success: true, data: citizen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DELETE CITIZEN ====================
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const citizen = await ForeignCitizen.findByIdAndDelete(req.params.id);
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen not found' });
    }
    res.status(200).json({ success: true, message: 'Citizen deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET CITIZEN BY PASSPORT NUMBER ====================
router.get('/passport/:passportNumber', authenticate, async (req, res) => {
  try {
    const citizen = await ForeignCitizen.findOne({ 
      passportNumber: req.params.passportNumber 
    }).populate('monitoringOfficer', 'fullName');
    
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Citizen not found' });
    }
    res.status(200).json({ success: true, data: citizen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET CITIZENS BY STATUS ====================
router.get('/status/:status', authenticate, async (req, res) => {
  try {
    let query = { status: req.params.status };
    
    // ✅ Officer: Only see citizens at their accommodation
    if (req.user.role === 'officer' && req.user.accommodationId) {
      const accommodationId = req.user.accommodationId._id || req.user.accommodationId;
      query['currentAccommodation.accommodationId'] = accommodationId;
    }
    
    const citizens = await ForeignCitizen.find(query).populate('monitoringOfficer', 'fullName');
    res.status(200).json({ success: true, count: citizens.length, data: citizens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;