const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    publicId: {
      type: String,
      required: true,
    },
    uploadedBy: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    likes: [
      {
        type: String, // store session ID or user ID
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isBlurry: {
      type: Boolean,
      default: false,
    },
    fileSize: {
      type: Number,
    },
    width: Number,
    height: Number,
    format: String,
  },
  { timestamps: true }
);

// Index for fast event-based queries
photoSchema.index({ event: 1, createdAt: -1 });
photoSchema.index({ event: 1, likeCount: -1 });

module.exports = mongoose.model('Photo', photoSchema);
