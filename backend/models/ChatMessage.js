const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sender: String, // 'admin' or 'ddpo' or college username
  receiver: String, // 'admin' or 'ddpo' or college username
  content: String, // encrypted
  collegeUsername: String, // maps to the college
  isGroupMessage: { type: Boolean, default: false }, // indicates if this is a group message
  groupCategory: String, // the category for group messages (e.g., 'Government', 'Aided')
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema); 