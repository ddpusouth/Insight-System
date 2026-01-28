const mongoose = require('mongoose');

const CollegeDashboardSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  stats: {
    totalStudents: { type: Number, default: 0 },
    firstPUStudents: { type: Number, default: 0 },
    secondPUStudents: { type: Number, default: 0 },
    totalStaff: { type: Number, default: 0 },
    aidedStaff: { type: Number, default: 0 },
    unaidedStaff: { type: Number, default: 0 },
    nonTeachingStaff: { type: Number, default: 0 },
    boys: { type: Number, default: 0 },
    girls: { type: Number, default: 0 },
    maleTeacher: { type: Number, default: 0 },
    femaleTeacher: { type: Number, default: 0 }
  },
  information: {
    principalName: { type: String, default: '' },
    address: { type: String, default: '' },
    contact1: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CollegeDashboard', CollegeDashboardSchema); 