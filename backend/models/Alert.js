const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForeignCitizen',
    required: [true, 'Citizen ID is required']
  },
  type: {
    type: String,
    enum: ['overstay', 'risk', 'visa_expiring', 'behavioral', 'security', 'accommodation', 'notification', 'transfer'],
    required: [true, 'Alert type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Severity level is required']
  },
  message: {
    type: String,
    required: [true, 'Alert message is required']
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'investigating', 'resolved'],
    default: 'new'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String
  },
  notes: [{
    date: {
      type: Date,
      default: Date.now
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  metadata: {
    fromAccommodation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accommodation'
    },
    toAccommodation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accommodation'
    },
    transferDate: Date,
    transferReason: String
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ citizenId: 1, status: 1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);