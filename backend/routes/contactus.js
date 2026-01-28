const express = require('express');
const router = express.Router();
const ContactUs = require('../models/contactus');
const College = require('../models/College'); // Assuming the model file name is College.js

// GET: Fetch all contact messages
router.get('/', async (req, res) => {
  try {
    const messages = await ContactUs.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete a specific contact message
router.delete('/:id', async (req, res) => {
  try {
    const message = await ContactUs.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Save a new contact message (only if name exists as Username in College)
router.post('/', async (req, res) => {
  try {
    const { name, subject, message } = req.body;

    // Check if the 'name' exists as 'Username' in the colleges collection
    const collegeExists = await College.findOne({ Username: name });

    if (!collegeExists) {
      return res.status(400).json({ success: false, message: 'College not found!' });
    }

    // Save the message if the college exists
    const newMsg = new ContactUs({ name, subject, message });
    await newMsg.save();

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;