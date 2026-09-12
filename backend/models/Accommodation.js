const mongoose = require('mongoose');

const accommodationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Accommodation name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['hotel', 'apartment', 'house', 'hostel', 'guest_house', 'private_residence', 'other'],
    required: [true, 'Accommodation type is required']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State/Province is required']
    },
    postalCode: {
      type: String
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  // ✅ FIXED: capacity as a number, NOT an object
  capacity: {
    type: Number,
    default: 0,
    min: 0
  },
  currentOccupants: {
    type: Number,
    default: 0,
    min: 0
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'parking', 'pool', 'gym', 'restaurant', 'air_conditioning', 'heating', 'laundry', 'security', 'elevator']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance', 'full'],
    default: 'active'
  },
  registrationNumber: {
    type: String,
    unique: true,
    required: [true, 'Registration number is required']
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  images: [{
    url: String,
    caption: String
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate registration number if not provided
accommodationSchema.pre('save', function(next) {
  if (!this.registrationNumber) {
    const year = new Date().getFullYear();
    this.registrationNumber = `ACC-${String(Date.now()).slice(-6)}-${year}`;
  }
  next();
});

// Index for search
accommodationSchema.index({ name: 'text', 'address.city': 'text' });

module.exports = mongoose.model('Accommodation', accommodationSchema);