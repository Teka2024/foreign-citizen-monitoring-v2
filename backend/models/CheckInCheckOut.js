const mongoose = require('mongoose');

const checkInCheckOutSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Citizen',
    required: [true, 'Citizen reference is required']
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: [true, 'Accommodation reference is required']
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required'],
    default: Date.now
  },
  expectedCheckOutDate: {
    type: Date,
    required: [true, 'Expected check-out date is required']
  },
  actualCheckOutDate: {
    type: Date,
    default: null
  },
  purpose: {
    type: String,
    enum: ['tourism', 'business', 'education', 'medical', 'family_visit', 'other'],
    required: [true, 'Purpose is required']
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out', 'overstayed', 'pending_checkout', 'cancelled', 'transferred'],
    default: 'checked_in'
  },
  roomNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Checked-in by is required']
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 0
  },
  overstayDays: {
    type: Number,
    default: 0
  },
  isOverstayed: {
    type: Boolean,
    default: false
  },
  checkOutReason: {
    type: String,
    enum: ['completed_stay', 'early_checkout', 'transferred', 'deported', 'other'],
    default: 'completed_stay'
  },
  
  // ✅ NEW: Transfer tracking fields
  transferInfo: {
    fromAccommodation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accommodation'
    },
    toAccommodation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accommodation'
    },
    transferDate: Date,
    transferReason: String,
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // ✅ NEW: Check-in/out metadata
  metadata: {
    checkInMethod: {
      type: String,
      enum: ['manual', 'online', 'mobile', 'kiosk'],
      default: 'manual'
    },
    checkOutMethod: {
      type: String,
      enum: ['manual', 'online', 'mobile', 'kiosk'],
      default: 'manual'
    },
    checkInLocation: String,
    checkOutLocation: String
  },
  
  // ✅ NEW: History for tracking transfers
  history: [{
    action: {
      type: String,
      enum: ['checked_in', 'updated', 'checked_out', 'extended_stay', 'cancelled', 'transferred']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      trim: true
    },
    previousStatus: String,
    newStatus: String
  }],
  
  // ✅ NEW: Previous check-in reference (for transfer chain)
  previousCheckIn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CheckInCheckOut'
  },
  nextCheckIn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CheckInCheckOut'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// ==================== INDEXES ====================
checkInCheckOutSchema.index({ citizen: 1 });
checkInCheckOutSchema.index({ accommodation: 1 });
checkInCheckOutSchema.index({ status: 1 });
checkInCheckOutSchema.index({ checkInDate: -1 });
checkInCheckOutSchema.index({ citizen: 1, status: 1 });
checkInCheckOutSchema.index({ 'transferInfo.fromAccommodation': 1 });
checkInCheckOutSchema.index({ 'transferInfo.toAccommodation': 1 });

// ==================== VIRTUALS ====================
checkInCheckOutSchema.virtual('durationDays').get(function() {
  const checkOut = this.actualCheckOutDate || new Date();
  const diffTime = checkOut - this.checkInDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

checkInCheckOutSchema.virtual('isCurrentlyCheckedIn').get(function() {
  return this.status === 'checked_in' && this.isActive === true;
});

checkInCheckOutSchema.virtual('isTransferred').get(function() {
  return this.status === 'transferred';
});

// ==================== PRE-SAVE MIDDLEWARE ====================
checkInCheckOutSchema.pre('save', function(next) {
  if (this.expectedCheckOutDate) {
    const diffTime = this.expectedCheckOutDate - this.checkInDate;
    this.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  if (this.status === 'checked_in' && this.expectedCheckOutDate) {
    const now = new Date();
    if (now > this.expectedCheckOutDate) {
      this.isOverstayed = true;
      this.overstayDays = Math.ceil((now - this.expectedCheckOutDate) / (1000 * 60 * 60 * 24));
    }
  }
  
  next();
});

// ==================== METHODS ====================

// ✅ Check-out method
checkInCheckOutSchema.methods.checkOut = async function(userId, reason, notes) {
  this.status = 'checked_out';
  this.actualCheckOutDate = new Date();
  this.checkedOutBy = userId;
  this.isActive = false;
  this.checkOutReason = reason || 'completed_stay';
  if (notes) this.notes = notes;
  
  this.history.push({
    action: 'checked_out',
    performedBy: userId,
    details: `Checked out with reason: ${this.checkOutReason}`,
    previousStatus: 'checked_in',
    newStatus: 'checked_out'
  });
  
  await this.save();
  return this;
};

// ✅ Transfer to new accommodation
checkInCheckOutSchema.methods.transfer = async function(userId, newAccommodationId, transferReason) {
  // This is the OLD check-in record (mark as transferred)
  this.status = 'transferred';
  this.actualCheckOutDate = new Date();
  this.checkedOutBy = userId;
  this.isActive = false;
  this.checkOutReason = 'transferred';
  
  this.transferInfo = {
    fromAccommodation: this.accommodation,
    toAccommodation: newAccommodationId,
    transferDate: new Date(),
    transferReason: transferReason || 'Moving to new accommodation',
    transferredBy: userId
  };
  
  this.history.push({
    action: 'transferred',
    performedBy: userId,
    details: `Transferred from ${this.accommodation} to ${newAccommodationId}: ${transferReason || 'Moving to new accommodation'}`,
    previousStatus: 'checked_in',
    newStatus: 'transferred'
  });
  
  await this.save();
  
  // Create NEW check-in record for the new accommodation
  const NewCheckIn = this.constructor;
  const newCheckIn = new NewCheckIn({
    citizen: this.citizen,
    accommodation: newAccommodationId,
    checkInDate: new Date(),
    expectedCheckOutDate: this.expectedCheckOutDate, // Keep same expected date
    purpose: this.purpose,
    checkedInBy: userId,
    createdBy: userId,
    roomNumber: this.roomNumber,
    notes: `Transferred from previous accommodation. ${this.notes || ''}`,
    previousCheckIn: this._id, // Link to previous check-in
    metadata: {
      checkInMethod: 'manual',
      checkInLocation: 'Transfer from another accommodation'
    }
  });
  
  await newCheckIn.save();
  
  // Link the previous check-in to the new one
  this.nextCheckIn = newCheckIn._id;
  await this.save();
  
  return newCheckIn;
};

// ✅ Extend stay method
checkInCheckOutSchema.methods.extendStay = async function(userId, newExpectedCheckOutDate, reason) {
  this.expectedCheckOutDate = newExpectedCheckOutDate;
  this.isOverstayed = false;
  this.overstayDays = 0;
  
  this.history.push({
    action: 'extended_stay',
    performedBy: userId,
    details: reason || 'Extended stay',
    previousStatus: this.status,
    newStatus: this.status
  });
  
  await this.save();
  return this;
};

// ✅ Add history entry
checkInCheckOutSchema.methods.addHistory = function(action, userId, details) {
  this.history.push({
    action,
    performedBy: userId,
    details,
    timestamp: new Date(),
    previousStatus: this.status,
    newStatus: this.status
  });
  return this.save();
};

// ✅ Get transfer history for a citizen (static method)
checkInCheckOutSchema.statics.getTransferHistory = async function(citizenId) {
  return this.find({ 
    citizen: citizenId,
    status: 'transferred'
  })
  .populate('accommodation', 'name address')
  .populate('transferInfo.toAccommodation', 'name address')
  .populate('checkedInBy', 'fullName')
  .populate('checkedOutBy', 'fullName')
  .sort({ checkInDate: -1 });
};

// ✅ Get check-in chain for a citizen (static method)
checkInCheckOutSchema.statics.getCheckInChain = async function(checkInId) {
  let checkIn = await this.findById(checkInId)
    .populate('accommodation', 'name address')
    .populate('citizen', 'fullName passportNumber');
  
  if (!checkIn) return null;
  
  const chain = [checkIn];
  
  // Follow previous check-ins
  let current = checkIn;
  while (current.previousCheckIn) {
    current = await this.findById(current.previousCheckIn)
      .populate('accommodation', 'name address');
    if (current) chain.unshift(current);
  }
  
  // Follow next check-ins
  current = checkIn;
  while (current.nextCheckIn) {
    current = await this.findById(current.nextCheckIn)
      .populate('accommodation', 'name address');
    if (current) chain.push(current);
  }
  
  return chain;
};

// ==================== TO JSON ====================
checkInCheckOutSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

checkInCheckOutSchema.set('toObject', {
  virtuals: true
});

module.exports = mongoose.model('CheckInCheckOut', checkInCheckOutSchema);