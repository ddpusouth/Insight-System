const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  college: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  respondedAt: Date,
  file: { type: Boolean, default: false },      // Whether this college uploaded a file
  fileUrl: { type: String, default: '' },       // URL of the college’s response file
});

const QuerySchema = new mongoose.Schema({
  title: String,
  college: String,
  studentName: String,
  category: String,
  priority: String,
  status: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  responses: [ResponseSchema],                  // Nested response schema with empty file info
  dueDate: Date,
  type: String,
  collegeType: String,
  selectedColleges: [String],
  file: Boolean,                                // Root-level file flag
  fileUrl: String,                              // Root-level file URL (original uploaded file)
  googleLink: String
});

module.exports = mongoose.model('Query', QuerySchema);
