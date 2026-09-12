const mongoose = require('mongoose');

const accommodationHistorySchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForeignCitizen',  // ✅ FIXED: Changed from 'Citizen' to 'ForeignCitizen'
    required: [true, 'Citizen ID is required']
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: [true, 'Accommodation ID is required']
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
    default: 'tourism'
  },
  roomNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'checked_out', 'overstayed', 'cancelled', 'transferred'],
    default: 'active'
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  previousCheckInId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccommodationHistory',
    default: null
  },
  transferReason: {
    type: String,
    default: ''
  },
  // Departure fields
  checkOutReason: {
    type: String,
    enum: ['depart', 'transfer', 'regular'],
    default: 'regular'
  },
  flightNumber: {
    type: String,
    default: null
  },
  flightDate: {
    type: Date,
    default: null
  },
  flightTicketUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Indexes
accommodationHistorySchema.index({ citizen: 1, status: 1 });
accommodationHistorySchema.index({ accommodation: 1, status: 1 });
accommodationHistorySchema.index({ checkInDate: -1 });

module.exports = mongoose.model('AccommodationHistory', accommodationHistorySchema);