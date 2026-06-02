const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [100, 'Event name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    coverImage: {
      url: String,
      publicId: String,
    },
    code: {
      type: String,
      unique: true,
      default: () => uuidv4().substring(0, 8).toUpperCase(),
    },
    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    photoCount: {
      type: Number,
      default: 0,
    },
    contributorCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-deactivate expired events
eventSchema.pre('find', function () {
  this.where({ expiresAt: { $gt: new Date() } });
});

module.exports = mongoose.model('Event', eventSchema);
