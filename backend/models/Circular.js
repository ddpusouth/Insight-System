const mongoose = require('mongoose');

const CircularSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  sender: { type: String },
  category: { type: String, required: true }, // Added category field
  recipients: [{ type: String }], // Array of college usernames
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Circular', CircularSchema); 