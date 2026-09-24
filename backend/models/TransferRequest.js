const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForeignCitizen',
    required: true
  },
  fromAccommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true
  },
  toAccommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  reason: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  expectedCheckOutDate: {
    type: Date,
    required: true
  },
  roomNumber: {
    type: String,
    default: ''
  },
  purpose: {
    type: String,
    enum: ['tourism', 'business', 'education', 'medical', 'family_visit', 'other'],
    default: 'tourism'
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

transferRequestSchema.index({ citizen: 1, status: 1 });
transferRequestSchema.index({ toAccommodation: 1, status: 1 });
transferRequestSchema.index({ fromAccommodation: 1, status: 1 });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);