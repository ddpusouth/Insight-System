const express = require('express');
const router = express.Router();
const CollegeDashboard = require('../models/CollegeDashboard');

const adminStatsInitial = {
  totalStudents: 0,
  firstPUStudents: 0,
  secondPUStudents: 0,
  totalStaff: 0,
  aidedStaff: 0,
  unaidedStaff: 0,
  nonTeachingStaff: 0,
  boys: 0,
  girls: 0,
  maleTeacher: 0,
  femaleTeacher: 0
};

const informationInitial = {
  principalName: '',
  address: '',
  contact1: '',
  contact2: '',
  email: ''
};

// Get all dashboards
router.get('/all', async (req, res) => {
  try {
    const dashboards = await CollegeDashboard.find();
    res.json(dashboards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get dashboard by username (auto-create if not exists)
router.get('/:username', async (req, res) => {
  try {
    let dashboard = await CollegeDashboard.findOne({ username: req.params.username });
    if (!dashboard) {
      dashboard = new CollegeDashboard({
        username: req.params.username,
        stats: adminStatsInitial,
        information: informationInitial
      });
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
    const { stats, information } = req.body;
    let dashboard = await CollegeDashboard.findOne({ username: req.params.username });

    if (!dashboard) {
      dashboard = new CollegeDashboard({
        username: req.params.username,
        stats: stats || adminStatsInitial,
        information: information || informationInitial
      });
    } else {
      if (stats) dashboard.stats = stats;
      if (information) dashboard.information = information;
      dashboard.lastUpdated = new Date();
    }

    await dashboard.save();
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete dashboard by username
router.delete('/:username', async (req, res) => {
  try {
    const result = await CollegeDashboard.deleteOne({ username: req.params.username });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Dashboard not found' });
    res.json({ message: 'Dashboard deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router; 