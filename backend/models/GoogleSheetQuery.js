const mongoose = require('mongoose');

const GoogleSheetQuerySchema = new mongoose.Schema({
  type: String,
  dueDate: Date,
  collegeType: String,
  selectedColleges: [String],
  googleLink: String,
  description: String,
  responses: [
    {
      college: String,
      status: { type: String, default: 'Pending' },
      respondedAt: Date
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GoogleSheetQuery', GoogleSheetQuerySchema); 