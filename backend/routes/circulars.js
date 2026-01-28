const express = require('express');
const router = express.Router();
const multer = require('multer');
const Circular = require('../models/Circular');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');
const College = require('../models/College');

// Get io instance
let io;
const setIO = (socketIO) => {
  io = socketIO;
};

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/circulars/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// POST /api/circulars - upload a new circular
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, sender, sendToAllColleges, category, selectedColleges } = req.body;
    const fileUrl = `/uploads/circulars/${req.file.filename}`;
    const fileName = req.file.originalname;
    let recipients = [];

    if (sendToAllColleges === 'true' || sendToAllColleges === true) {
      // Fetch colleges based on the selected category
      if (category && category !== 'All Colleges') {
        const colleges = await College.find({
          $or: [
            { Category: category },
            { type: category }
          ]
        }, { Username: 1 });
        recipients = colleges.map(col => col.Username).filter(Boolean);
      } else {
        // If "All Colleges" is selected or no category selected, fetch all colleges
        const colleges = await College.find({}, { Username: 1 });
        recipients = colleges.map(col => col.Username).filter(Boolean);
      }
    } else if (selectedColleges) {
      // Parse selected colleges if provided
      let colleges = selectedColleges;
      if (typeof colleges === 'string') {
        try {
          colleges = JSON.parse(colleges);
        } catch {
          colleges = [colleges];
        }
      }
      if (Array.isArray(colleges)) {
        recipients = colleges;
      }
    }

    const circular = new Circular({
      title,
      fileUrl,
      fileName,
      sender,
      category,
      recipients
    });
    await circular.save();
    res.status(201).json(circular);

    const { sendNewCircularNotification } = require('../utils/emailService');
    const { getCollegeEmail } = require('../utils/collegeHelper');

    // Save notifications to database and emit to all recipients
    for (const recipient of recipients) {
      // Save notification to database
      const notification = new Notification({
        recipient: recipient,
        type: 'circular',
        title: 'New Circular from DDPO',
        message: `New circular: ${title}`,
        link: '/circular'
      });
      await notification.save();

      // Emit real-time notification
      if (io) {
        io.emit('ddpo_circular_message', {
          message: `New circular: ${title}`,
          college: recipient
        });
      }

      // Send email notification
      try {
        const collegeInfo = await getCollegeEmail(recipient);
        if (collegeInfo && collegeInfo.email) {
          await sendNewCircularNotification(
            collegeInfo.email,
            collegeInfo.collegeName,
            title,
            sender
          );
          console.log(`[Circulars] Notification sent to ${collegeInfo.email}`);
        } else if (process.env.EMAIL_USER) {
          // Fallback
          await sendNewCircularNotification(
            process.env.EMAIL_USER,
            collegeInfo?.collegeName || recipient,
            title,
            sender
          );
        }
      } catch (emailErr) {
        console.error(`[Circulars] Error sending email to ${recipient}:`, emailErr.message);
        // Abort on invalid_grant
        if (emailErr.message && (emailErr.message.includes('invalid_grant') || emailErr.message.includes('invalid_client'))) {
          console.error('[Circulars] CRITICAL: Email credentials invalid (invalid_grant). Aborting email notifications.');
          break;
        }
      }
    }
  } catch (err) {
    fs.writeFileSync(path.join(__dirname, '../error.log'), err.stack || err.message);
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/circulars - get recent circulars with filtering
router.get('/', async (req, res) => {
  try {
    const { category, username, page = 1, limit = 10 } = req.query;
    let filter = {};

    // Filter by category if provided
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Filter by username (for colleges to see only their circulars)
    if (username) {
      filter.recipients = username;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Circular.countDocuments(filter);

    // Get paginated results
    const circulars = await Circular.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      circulars,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/circulars/categories - get all available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Circular.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/circulars/colleges - get colleges for DDPO to select from
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find({}, {
      'College Name': 1,
      'College Code': 1,
      'Username': 1,
      'Nodal Center': 1,
      'Category': 1,
      'type': 1
    });
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/circulars/:id - delete a circular
router.delete('/:id', async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: 'Circular not found' });
    }

    // Delete the file from the uploads folder
    if (circular.fileUrl) {
      const filePath = path.join(__dirname, '..', circular.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await Circular.findByIdAndDelete(req.params.id);
    res.json({ message: 'Circular deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, setIO }; 