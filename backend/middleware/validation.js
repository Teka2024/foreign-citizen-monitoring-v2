const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate middleware - Check validation results
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// ==================== USER VALIDATION ====================

const userValidation = {
  register: [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required'),
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  login: [
    body('username')
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty'),
    body('phoneNumber')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Phone number cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please enter a valid email')
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ]
};

// ==================== CITIZEN VALIDATION ====================

const citizenValidation = {
  create: [
    body('passportNumber')
      .notEmpty()
      .withMessage('Passport number is required')
      .trim(),
    body('fullName')
      .notEmpty()
      .withMessage('Full name is required')
      .trim(),
    body('nationality')
      .notEmpty()
      .withMessage('Nationality is required')
      .trim(),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    body('visaType')
      .isIn(['tourist', 'business', 'student', 'work', 'diplomatic', 'transit', 'resident'])
      .withMessage('Invalid visa type'),
    body('visaNumber')
      .notEmpty()
      .withMessage('Visa number is required')
      .trim(),
    body('entryDate')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('expectedExitDate')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.entryDate)) {
          throw new Error('Expected exit date must be after entry date');
        }
        return true;
      }),
    body('entryPort')
      .notEmpty()
      .withMessage('Entry port is required')
      .trim(),
    body('personalContact.phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .trim()
  ],
  update: [
    body('fullName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty'),
    body('visaType')
      .optional()
      .isIn(['tourist', 'business', 'student', 'work', 'diplomatic', 'transit', 'resident'])
      .withMessage('Invalid visa type'),
    body('status')
      .optional()
      .isIn(['active', 'expired', 'overstayed', 'deported', 'exited', 'pending', 'suspended'])
      .withMessage('Invalid status'),
    body('riskLevel')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid risk level')
  ]
};

// ==================== ACCOMMODATION VALIDATION ====================

const accommodationValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Accommodation name is required')
      .trim(),
    body('type')
      .isIn(['hotel', 'apartment', 'house', 'hostel', 'guest_house', 'private_residence', 'other'])
      .withMessage('Invalid accommodation type'),
    body('address.street')
      .notEmpty()
      .withMessage('Street address is required'),
    body('address.city')
      .notEmpty()
      .withMessage('City is required'),
    body('address.state')
      .notEmpty()
      .withMessage('State/Province is required'),
    body('address.country')
      .notEmpty()
      .withMessage('Country is required')
  ],
  checkIn: [
    body('citizenId')
      .notEmpty()
      .withMessage('Citizen ID is required')
      .isMongoId()
      .withMessage('Invalid citizen ID'),
    body('accommodationId')
      .notEmpty()
      .withMessage('Accommodation ID is required')
      .isMongoId()
      .withMessage('Invalid accommodation ID'),
    body('expectedCheckOutDate')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.checkInDate || Date.now())) {
          throw new Error('Expected check-out date must be after check-in date');
        }
        return true;
      }),
    body('purpose')
      .isIn(['tourism', 'business', 'education', 'medical', 'family_visit', 'other'])
      .withMessage('Invalid purpose')
  ],
  checkOut: [
    body('citizenId')
      .notEmpty()
      .withMessage('Citizen ID is required')
      .isMongoId()
      .withMessage('Invalid citizen ID'),
    body('checkOutDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
  ]
};

// ==================== ID VALIDATION ====================

const idValidation = {
  paramId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],
  citizenId: [
    param('citizenId')
      .isMongoId()
      .withMessage('Invalid citizen ID format')
  ]
};

// ==================== QUERY VALIDATION ====================

const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  validate,
  userValidation,
  citizenValidation,
  accommodationValidation,
  idValidation,
  queryValidation
};