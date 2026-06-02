const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const { protect, optionalAuth } = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');

// POST /api/events — create event (auth required)
router.post('/', protect, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, message: 'Name and date are required' });
    }

    const eventData = {
      name,
      description,
      date: new Date(date),
      organiser: req.user._id,
    };

    if (req.file) {
      eventData.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const event = await Event.create(eventData);

    // Push event ID to user's eventsCreated
    req.user.eventsCreated.push(event._id);
    await req.user.save();

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/my — organiser's events
router.get('/my', protect, async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/join/:code — join by code
router.get('/join/:code', async (req, res) => {
  try {
    const event = await Event.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true,
    }).populate('organiser', 'name');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or expired' });
    }

    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:id — get event details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organiser', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:id/analytics — organiser analytics
router.get('/:id/analytics', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const photos = await Photo.find({ event: req.params.id }).lean();

    // Uploads per hour
    const uploadsPerHour = {};
    photos.forEach((p) => {
      const hour = new Date(p.createdAt).getHours();
      uploadsPerHour[hour] = (uploadsPerHour[hour] || 0) + 1;
    });

    // Top contributors
    const contributorMap = {};
    photos.forEach((p) => {
      const name = p.uploadedBy.name;
      contributorMap[name] = (contributorMap[name] || 0) + 1;
    });
    const topContributors = Object.entries(contributorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Most liked photos
    const mostLiked = photos.sort((a, b) => b.likeCount - a.likeCount).slice(0, 3);

    // Total storage used (bytes)
    const totalStorage = photos.reduce((acc, p) => acc + (p.fileSize || 0), 0);

    res.json({
      success: true,
      analytics: {
        totalPhotos: photos.length,
        totalLikes: photos.reduce((acc, p) => acc + p.likeCount, 0),
        uniqueContributors: Object.keys(contributorMap).length,
        uploadsPerHour,
        topContributors,
        mostLiked,
        totalStorage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/events/:id — delete event
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete all photos from cloudinary
    const photos = await Photo.find({ event: req.params.id });
    for (const photo of photos) {
      await cloudinary.uploader.destroy(photo.publicId);
    }
    await Photo.deleteMany({ event: req.params.id });

    if (event.coverImage?.publicId) {
      await cloudinary.uploader.destroy(event.coverImage.publicId);
    }

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
