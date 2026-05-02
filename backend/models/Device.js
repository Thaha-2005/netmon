const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['Laptop', 'PC', 'Router', 'Camera', 'Server', 'Phone', 'Printer', 'Unknown'],
      default: 'Unknown',
    },
    mac: {
      type: String,
      default: '',
    },
    vendor: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Online', 'Offline'],
      default: 'Online',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    latency: {
      type: Number,
      default: null,
    },
    openPorts: {
      type: [Number],
      default: [],
    },
    // Optional history tracking
    history: [
      {
        timestamp: { type: Date, default: Date.now },
        status: String,
        latency: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fast IP lookups
deviceSchema.index({ ip: 1 });
deviceSchema.index({ status: 1 });

module.exports = mongoose.model('Device', deviceSchema);
