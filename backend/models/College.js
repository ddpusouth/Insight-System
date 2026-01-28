const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true }
}, { strict: false });  // This allows all fields even if not in schema

module.exports = mongoose.model('College', collegeSchema, 'colleges');

