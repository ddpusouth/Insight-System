const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  'Nodal Center': { type: String, required: true },
  'College Name': { type: String, required: true },
  'College Code': { type: String, required: true },
  'Username': { type: String, required: false },
  'Password': { type: String, required: false },
});

module.exports = mongoose.models.College || mongoose.model('College', collegeSchema);
