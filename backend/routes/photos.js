const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const Event = require('../models/Event');
const { protect, optionalAuth } = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');

// POST /api/photos/upload — upload photos (guest or auth)
router.post('/upload', optionalAuth, upload.array('photos', 20), async (req, res) => {
  try {
    const { eventId, uploaderName } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: 'Event ID required' });

    const name = req.user ? req.user.name : uploaderName;
    if (!name) return res.status(400).json({ success: false, message: 'Uploader name required' });

    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found or inactive' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const savedPhotos = [];
    const newContributors = new Set();

    for (const file of req.files) {
      // Get cloudinary resource info for dimensions
      let width, height, format, fileSize;
      try {
        const info = await cloudinary.api.resource(file.filename);
        width = info.width;
        height = info.height;
        format = info.format;
        fileSize = info.bytes;
      } catch (e) {
        // Not critical if this fails
      }

      // Generate thumbnail URL using cloudinary transforms
      const thumbnailUrl = cloudinary.url(file.filename, {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      });

      const photo = await Photo.create({
        event: eventId,
        url: file.path,
        thumbnailUrl,
        publicId: file.filename,
        uploadedBy: {
          name,
          userId: req.user ? req.user._id : null,
        },
        width,
        height,
        format,
        fileSize,
      });

      savedPhotos.push(photo);
      newContributors.add(name);
    }

    // Update event stats
    await Event.findByIdAndUpdate(eventId, {
      $inc: { photoCount: savedPhotos.length },
    });

    // Emit real-time event via socket.io (attached to req.app)
    const io = req.app.get('io');
    if (io) {
      savedPhotos.forEach((photo) => {
        io.to(eventId).emit('new_photo', photo);
      });
    }

    res.status(201).json({
      success: true,
      photos: savedPhotos,
      message: `${savedPhotos.length} photo${savedPhotos.length > 1 ? 's' : ''} uploaded successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/photos/event/:eventId — get all photos for event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { sort = 'newest', page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    const sortOption =
      sort === 'popular' ? { likeCount: -1 } : { createdAt: -1 };

    const photos = await Photo.find({
      event: req.params.eventId,
      isFlagged: false,
    })
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Photo.countDocuments({
      event: req.params.eventId,
      isFlagged: false,
    });

    res.json({
      success: true,
      photos,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/photos/event/:eventId/highlights — top liked photos (MUST be before /:id routes)
router.get('/event/:eventId/highlights', async (req, res) => {
  try {
    const photos = await Photo.find({ event: req.params.eventId, isFlagged: false })
      .sort({ likeCount: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/photos/:id/like — toggle like
router.post('/:id/like', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID required' });

    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const alreadyLiked = photo.likes.includes(sessionId);

    if (alreadyLiked) {
      photo.likes = photo.likes.filter((id) => id !== sessionId);
      photo.likeCount = Math.max(0, photo.likeCount - 1);
    } else {
      photo.likes.push(sessionId);
      photo.likeCount += 1;
    }

    await photo.save();

    // Emit real-time like update
    const io = req.app.get('io');
    if (io) {
      io.to(photo.event.toString()).emit('photo_liked', {
        photoId: photo._id,
        likeCount: photo.likeCount,
        liked: !alreadyLiked,
      });
    }

    res.json({
      success: true,
      likeCount: photo.likeCount,
      liked: !alreadyLiked,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/photos/:id/flag — flag a photo
router.post('/:id/flag', async (req, res) => {
  try {
    await Photo.findByIdAndUpdate(req.params.id, { isFlagged: true });
    res.json({ success: true, message: 'Photo flagged for review' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/photos/:id — organiser delete photo
router.delete('/:id', protect, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).populate('event');
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const event = photo.event;
    if (event.organiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await cloudinary.uploader.destroy(photo.publicId);
    await photo.deleteOne();
    await Event.findByIdAndUpdate(event._id, { $inc: { photoCount: -1 } });

    // Emit real-time delete
    const io = req.app.get('io');
    if (io) {
      io.to(event._id.toString()).emit('photo_deleted', { photoId: req.params.id });
    }

    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
