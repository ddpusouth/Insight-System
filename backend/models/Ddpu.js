const mongoose = require('mongoose');

const ddpuSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },  // changed to username
  Password: { type: String, required: true }
});

module.exports = mongoose.model('Ddpu', ddpuSchema, 'ddpu_login');

