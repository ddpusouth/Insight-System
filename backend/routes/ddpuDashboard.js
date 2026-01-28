const express = require('express');
const router = express.Router();
const DdpuDashboard = require('../models/DdpuDashboard');

const ddpoStatsInitial = {
  privateColleges: 0,
  govtAidedColleges: 0,
  govtColleges: 0,
  bifurcatedColleges: 0,
  corporateColleges: 0,
  totalColleges: 0,
  totalStudents: 0,
  totalTeacher: 0,
  kitturranichennamma:0,
};

// Get dashboard by username (auto-create if not exists)
router.get('/:username', async (req, res) => {
  try {
    let dashboard = await DdpuDashboard.findOne({ username: req.params.username });
    if (!dashboard) {
      dashboard = new DdpuDashboard({ username: req.params.username, stats: ddpoStatsInitial });
      await dashboard.save();
    }
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update dashboard by username
router.post('/:username', async (req, res) => {
  try {
    const { stats } = req.body;
    let dashboard = await DdpuDashboard.findOneAndUpdate(
      { username: req.params.username },
      { stats, lastUpdated: Date.now() },
      { new: true, upsert: true }
    );
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete dashboard by username
router.delete('/:username', async (req, res) => {
  try {
    const result = await DdpuDashboard.deleteOne({ username: req.params.username });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Dashboard not found' });
    res.json({ message: 'Dashboard deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 