const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { encrypt, decrypt } = require('../utils/encryption');

// Get io instance
let io;
const setIO = (socketIO) => {
  io = socketIO;
};

// GET /api/notifications/:username - Get notifications for a specific user
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 50 } = req.query;

    const notifications = await Notification.find({ recipient: username })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Decrypt messages before sending to client, robust to errors
    const decryptedNotifications = notifications.map(notification => {
      let decryptedMessage;
      try {
        decryptedMessage = decrypt(notification.message);
      } catch (e) {
        console.error('Failed to decrypt notification:', notification._id, e);
        decryptedMessage = notification.message;
      }
      return {
        ...notification,
        message: decryptedMessage
      };
    });

    res.json(decryptedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req, res) => {
  try {
    const { recipient, type, title, message, link } = req.body;

    if (!recipient || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const encryptedMessage = await encrypt(message);

    const notification = new Notification({
      recipient,
      type,
      title,
      message: encryptedMessage,
      link
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Decrypt message before sending response
    let decryptedMessage;
    try {
      decryptedMessage = decrypt(notification.message);
    } catch (e) {
      console.error('Failed to decrypt notification:', notification._id, e);
      decryptedMessage = notification.message;
    }
    const decryptedNotification = {
      ...notification.toObject(),
      message: decryptedMessage
    };

    res.json(decryptedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/:username/read-all - Delete all unread notifications for a user
router.put('/:username/read-all', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Delete all unread notifications for the user instead of marking them as read
    const result = await Notification.deleteMany(
      { recipient: username, read: false }
    );

    res.json({ message: 'All notifications deleted', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

// DELETE /api/notifications/:id - Delete a specific notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Notification.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// GET /api/notifications/:username/unread-count - Get unread count for a user
router.get('/:username/unread-count', async (req, res) => {
  try {
    const { username } = req.params;
    
    const count = await Notification.countDocuments({ 
      recipient: username, 
      read: false 
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

module.exports = { router, setIO }; 