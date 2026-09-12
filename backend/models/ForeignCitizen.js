const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
  // ==================== PERSONAL INFORMATION ====================
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  // Passport is a TOP-LEVEL field
  passportNumber: {
    type: String,
    required: [true, 'Passport number is required'],
    unique: true,
    trim: true,
    index: true
  },
  passportIssueDate: {
    type: Date,
    required: [true, 'Passport issue date is required']
  },
  passportExpiryDate: {
    type: Date,
    required: [true, 'Passport expiry date is required']
  },
  nationality: {
    type: String,
    required: [true, 'Nationality is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  placeOfBirth: {
    city: String,
    country: String
  },

  // ==================== ENTRY DOCUMENT TYPE ====================
  entryDocType: {
    type: String,
    enum: ['visa', 'id', 'stamp', 'other'],  // ✅ Added 'stamp'
    required: [true, 'Entry document type is required'],
    default: 'visa'
  },

  // ==================== VISA FIELDS ====================
  visaType: {
    type: String,
    enum: ['tourist', 'business', 'student', 'work', 'diplomatic', 'transit', 'resident']
  },
  visaNumber: {
    type: String,
    trim: true
  },
  visaIssueDate: {
    type: Date
  },
  visaExpiryDate: {
    type: Date
  },

  // ==================== ID FIELDS ====================
  idNumber: {
    type: String,
    trim: true
  },
  idType: {
    type: String,
    enum: ['national_id', 'driving_license', 'residence_permit', 'other']
  },
  idIssueDate: {
    type: Date
  },
  idExpiryDate: {
    type: Date
  },

  // ==================== STAMP FIELDS ====================  ✅ NEW
  stampNumber: {
    type: String,
    trim: true
  },
  stampType: {
    type: String,
    enum: ['entry', 'exit', 'transit', 'other']
  },
  stampIssueDate: {
    type: Date
  },
  stampExpiryDate: {
    type: Date
  },

  // ==================== OTHER DOCUMENT FIELDS ====================
  otherDocName: {
    type: String,
    trim: true
  },
  otherDocNumber: {
    type: String,
    trim: true
  },
  otherIssueDate: {
    type: Date
  },
  otherExpiryDate: {
    type: Date
  },

  // ==================== ENTRY INFORMATION ====================
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required'],
    default: Date.now
  },
  expectedExitDate: {
    type: Date,
    required: [true, 'Expected exit date is required']
  },
  actualExitDate: {
    type: Date
  },
  entryPort: {
    type: String,
    required: [true, 'Entry port is required'],
    trim: true
  },
  exitPort: {
    type: String,
    trim: true
  },

  // ==================== CONTACT INFORMATION ====================
  personalContact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },

  // ==================== EMPLOYMENT ====================
  employment: {
    employer: String,
    position: String,
    address: String,
    phone: String,
    startDate: Date,
    endDate: Date
  },

  // ==================== EDUCATION ====================
  education: {
    institution: String,
    course: String,
    startDate: Date,
    endDate: Date,
    studentId: String
  },

  // ==================== PHOTO ====================
  photo: {
    type: String,
    default: null
  },

  // ==================== ADDITIONAL DOCUMENTS (Visa, ID, Stamp, Other) ====================
  documents: [{
    docType: {
      type: String,
      enum: ['visa', 'id', 'stamp', 'other'],
      required: true
    },
    // For Visa
    visaType: {
      type: String,
      enum: ['tourist', 'business', 'student', 'work', 'diplomatic', 'transit', 'resident']
    },
    visaNumber: {
      type: String
    },
    // For ID
    idNumber: {
      type: String
    },
    idType: {
      type: String,
      enum: ['national_id', 'driving_license', 'residence_permit', 'other']
    },
    // For Stamp
    stampNumber: {
      type: String
    },
    stampType: {
      type: String,
      enum: ['entry', 'exit', 'transit', 'other']
    },
    // For Other
    documentName: {
      type: String
    },
    // Common fields
    documentNumber: {
      type: String,
      trim: true
    },
    issuingAuthority: {
      type: String,
      trim: true
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required for all documents']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required for all documents']
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileType: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Overstay tracking
    isOverstayed: {
      type: Boolean,
      default: false
    },
    daysRemaining: {
      type: Number,
      default: 0
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationDate: {
      type: Date,
      default: null
    }
  }],

  // ==================== ACCOMMODATION ====================
  currentAccommodation: {
    accommodationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accommodation'
    },
    checkInDate: Date,
    expectedCheckOutDate: Date,
    roomNumber: String,
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'pending_checkout'],
      default: 'pending_checkout'
    }
  },

  // ==================== FAMILY ====================
  familyMembers: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      enum: ['spouse', 'child', 'parent', 'sibling', 'other'],
      required: true
    },
    passportNumber: String,
    dateOfBirth: Date,
    isAccompanying: {
      type: Boolean,
      default: false
    }
  }],

  // ==================== BACKGROUND ====================
  background: {
    purpose: String,
    skills: [String],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['basic', 'intermediate', 'fluent', 'native']
      }
    }],
    previousVisits: [{
      year: Number,
      duration: String,
      purpose: String
    }]
  },

  // ==================== STATUS & RISK ====================
  status: {
    type: String,
    enum: ['active', 'expired', 'overstayed', 'deported', 'exited', 'pending', 'suspended'],
    default: 'active'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  riskFactors: [{
    factor: {
      type: String,
      enum: ['overstay', 'visa_expiring_soon', 'high_risk_nationality', 'suspicious_activity', 'criminal_record']
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],

  // ==================== MONITORING ====================
  monitoringOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  monitoringNotes: [{
    date: {
      type: Date,
      default: Date.now
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      required: true
    },
    status: String,
    isPublic: {
      type: Boolean,
      default: true
    }
  }],

  // ==================== AUDIT ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

// ==================== VIRTUALS ====================

citizenSchema.virtual('fullName').get(function() {
  const parts = [this.firstName];
  if (this.middleName) parts.push(this.middleName);
  parts.push(this.lastName);
  return parts.join(' ');
});

citizenSchema.virtual('displayName').get(function() {
  return `${this.fullName} (${this.passportNumber})`;
});

citizenSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.expectedExitDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

citizenSchema.virtual('isOverstayed').get(function() {
  const now = new Date();
  return now > this.expectedExitDate && this.status === 'active';
});

// ==================== INDEXES ====================
citizenSchema.index({ passportNumber: 1 });
citizenSchema.index({ firstName: 1, lastName: 1 });
citizenSchema.index({ nationality: 1 });
citizenSchema.index({ status: 1, riskLevel: 1 });

// ==================== TO JSON ====================
citizenSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.fullName = ret.fullName || `${ret.firstName} ${ret.lastName}`;
    return ret;
  }
});

citizenSchema.set('toObject', {
  virtuals: true
});

module.exports = mongoose.model('ForeignCitizen', citizenSchema);