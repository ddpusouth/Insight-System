const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const College = require('../models/College');
const Ddpu = require('../models/Ddpu');

router.post('/login', async (req, res) => {
  const { username, password, type } = req.body;

  if (!username || !password || !type)
    return res.status(400).json({ message: 'Username, Password, and type are required' });

  try {
    let user = null;

    if (type === 'admin') {
      user = await College.findOne({ Username: username });
    } else if (type === 'ddpo') {
      user = await Ddpu.findOne({ Username: username });
    } else {
      return res.status(400).json({ message: 'Invalid login type' });
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials (User not found)' });

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials (Wrong password)' });

    const token = jwt.sign({ id: user._id, type }, 'yourSecretKey', { expiresIn: '1h' });

    res.json({
      token,
      user: {
        username: user.Username,
        type,
        name: type === 'ddpo' ? 'DDPU office' : user['College Name'] || 'College'
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
