const mongoose = require('mongoose');

const DdpuDashboardSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  stats: {
    privateColleges: { type: Number, default: 0 },
    govtAidedColleges: { type: Number, default: 0 },
    govtColleges: { type: Number, default: 0 },
    bifurcatedColleges: { type: Number, default: 0 },
    corporateColleges: { type: Number, default: 0 },
    totalColleges: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    totalTeacher: { type: Number, default: 0 },
    kitturranichennamma: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DdpuDashboard', DdpuDashboardSchema); 