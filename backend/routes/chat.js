const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const College = require('../models/College');
const Notification = require('../models/Notification');
const { encrypt, decrypt } = require('../utils/encryption');

// Get io instance
let io;
const setIO = (socketIO) => {
  io = socketIO;
};

// Send a message (individual or group)
router.post('/', async (req, res) => {
  const { sender, receiver, content, collegeUsername, isGroupMessage, groupCategory } = req.body;

  if (!sender || !content) return res.status(400).json({ error: 'Missing required fields' });

  try {
    if (isGroupMessage && groupCategory) {
      // Group message - send to all colleges in the category
      let collegesInCategory;

      if (groupCategory === 'All Colleges') {
        // Fetch all colleges for "All Colleges" category
        collegesInCategory = await College.find({}, { Username: 1 });
      } else {
        // Fetch colleges based on the selected category
        collegesInCategory = await College.find({ Category: groupCategory }, { Username: 1 });
      }

      if (collegesInCategory.length === 0) {
        return res.status(404).json({ error: 'No colleges found in this category' });
      }

      // Create only ONE group message for the category
      const groupMessage = new ChatMessage({
        sender,
        receiver: groupCategory, // Use category as receiver
        content: encrypt(content),
        collegeUsername: groupCategory, // Use category as collegeUsername for group messages
        isGroupMessage: true,
        groupCategory,
        timestamp: new Date()
      });
      await groupMessage.save();

      res.status(201).json({
        message: 'Group message sent',
        sentTo: collegesInCategory.length,
        category: groupCategory,
        groupMessageId: groupMessage._id
      });

      // Save notifications to database and emit to all colleges in the category
      if (sender === 'ddpo') {
        for (const college of collegesInCategory) {
          // Save notification to database
          const notification = new Notification({
            recipient: college.Username,
            type: 'chat',
            title: 'New Message from DDPO',
            message: encrypt(content),
            link: '/chat'
          });
          await notification.save();

          // Emit real-time notification
          if (io) {
            console.log('🔔 Emitting ddpo_chat_message event for college:', college.Username);
            io.emit('ddpo_chat_message', {
              message: content,
              college: college.Username
            });
            console.log('✅ Event emitted successfully');
          }
        }
      }
    } else {
      // Individual message
      if (!receiver || !collegeUsername) {
        return res.status(400).json({ error: 'Missing receiver or collegeUsername for individual message' });
      }

      const encryptedContent = encrypt(content);
      const msg = new ChatMessage({
        sender,
        receiver,
        content: encryptedContent,
        collegeUsername,
        isGroupMessage: false
      });
      await msg.save();
      res.status(201).json({ message: 'Sent' });

      // Save notification to database and emit for individual message from DDPO
      if (sender === 'ddpo') {
        // Save notification to database
        const notification = new Notification({
          recipient: receiver,
          type: 'chat',
          title: 'New Message from DDPO',
          message: encrypt(content),
          link: '/chat'
        });
        await notification.save();

        // Emit real-time notification
        if (io) {
          console.log('🔔 Emitting ddpo_chat_message event for college:', receiver);
          io.emit('ddpo_chat_message', {
            message: content,
            college: receiver
          });
          console.log('✅ Event emitted successfully');
        } else {
          console.log('❌ Socket.IO not available');
        }
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all messages for a specific college
router.get('/:collegeUsername', async (req, res) => {
  const { collegeUsername } = req.params;

  try {
    // Get individual messages for this college
    const individualMessages = await ChatMessage.find({
      collegeUsername: collegeUsername,
      isGroupMessage: false
    }).sort({ timestamp: 1 });

    // Get group messages for this college's category
    const college = await College.findOne({ Username: collegeUsername });
    let groupMessages = [];

    if (college && college.Category) {
      // Get category-specific group messages
      const categoryGroupMessages = await ChatMessage.find({
        collegeUsername: college.Category,
        isGroupMessage: true
      }).sort({ timestamp: 1 });

      // Get "All Colleges" group messages
      const allCollegesGroupMessages = await ChatMessage.find({
        collegeUsername: 'All Colleges',
        isGroupMessage: true
      }).sort({ timestamp: 1 });

      groupMessages = [...categoryGroupMessages, ...allCollegesGroupMessages];
    }

    // Combine and sort all messages
    const allMessages = [...individualMessages, ...groupMessages].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Decrypt messages
    const decrypted = allMessages.map(m => ({
      ...m.toObject(),
      content: decrypt(m.content)
    }));

    res.json(decrypted);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get group messages for DDPO (messages sent to groups)
router.get('/groups/:category', async (req, res) => {
  const { category } = req.params;

  try {
    const messages = await ChatMessage.find({
      collegeUsername: category,
      isGroupMessage: true,
      sender: 'ddpo'
    }).sort({ timestamp: 1 });

    // Decrypt messages
    const decrypted = messages.map(m => ({
      ...m.toObject(),
      content: decrypt(m.content)
    }));
    res.json(decrypted);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

module.exports = { router, setIO };
