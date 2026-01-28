const express = require('express');
const router = express.Router();
const College = require('../models/College');
const bcrypt = require('bcryptjs');

console.log('Register routes loaded');

// GET /api/colleges/all - get all colleges
router.get('/colleges/all', async (req, res) => {
  console.log('--- /api/colleges/all route hit ---');
  try {
    const colleges = await College.find({});
    console.log('API colleges:', colleges.length);
    if (colleges.length > 0) {
      console.log('First college:', colleges[0]);
    }
    res.json({ count: colleges.length, colleges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get unique Nodal Centers
router.get('/nodal-centers', async (req, res) => {
  try {
    const centers = await College.distinct('Nodal Center');
    res.json(centers.map(name => ({ name })));
  } catch (err) {
    console.error('Error fetching nodal centers:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/colleges/:username - get college details by username
router.get('/colleges/:username', async (req, res) => {
  try {
    const college = await College.findOne({ Username: req.params.username });
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/colleges/:username - update college details by username
router.put('/colleges/:username', async (req, res) => {
  try {
    const updated = await College.findOneAndUpdate(
      { Username: req.params.username },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'College not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/colleges/:username/password - update college password
router.put('/colleges/:username/password', async (req, res) => {
  console.log('Password update route hit:', req.params.username);
  console.log('Request body:', req.body);
  
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      console.log('Missing password fields');
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Find the college
    const college = await College.findOne({ Username: req.params.username });
    if (!college) {
      console.log('College not found:', req.params.username);
      return res.status(404).json({ message: 'College not found' });
    }

    console.log('College found, verifying password...');

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, college.Password);
    if (!isCurrentPasswordValid) {
      console.log('Current password is incorrect');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    console.log('Password verified, hashing new password...');

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    college.Password = hashedNewPassword;
    await college.save();

    console.log('Password updated successfully');
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Colleges by Nodal Center
router.get('/colleges/nodal/:nodalCenter', async (req, res) => {
  try {
    const colleges = await College.find(
      { 'Nodal Center': req.params.nodalCenter },
      { 'College Name': 1 }
    );
    res.json(colleges.map(col => ({ _id: col._id, name: col['College Name'] })));
  } catch (err) {
    console.error('Error fetching colleges:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get College Code by College ID
router.get('/college-code/:collegeId', async (req, res) => {
  try {
    const college = await College.findById(req.params.collegeId);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json({ code: college['College Code'] });
  } catch (err) {
    console.error('Error fetching college code:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ ok: true });
});

router.post('/register', async (req, res) => {
  const { nodalCenter, collegeName, collegeCode, username, password } = req.body;

  if (!nodalCenter || !collegeName || !collegeCode || !username || !password)
    return res.status(400).json({ message: 'All fields are required!' });

  try {
    // Find the college by College Code
    const college = await College.findOne({ 'College Code': collegeCode });

    if (!college) {
      return res.status(404).json({ message: 'College not found!' });
    }

    if (college.Username) {
      return res.status(400).json({ message: 'College is already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the college with username and password
    college.Username = username;
    college.Password = hashedPassword;
    await college.save();

    res.status(200).json({ message: 'Registration successful!!' });

  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
 
module.exports = router;
