const mongoose = require('mongoose');

const ContactUsSchema = new mongoose.Schema({
  name: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactUs', ContactUsSchema, 'contactus'); 