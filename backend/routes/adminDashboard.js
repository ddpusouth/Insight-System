const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  // Fetch data filtered by req.user.collegeId
  res.json({ message: `Welcome, admin for college ${req.user.collegeId}` });
});

module.exports = router;
