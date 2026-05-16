const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error("\n=== REGISTRATION ERROR ===");
    console.error(err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// 2. LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'super_secret_key_change_this_later', 
      { expiresIn: '1d' }
    );
    
    // FIX: Send the JSON payload back so the frontend can read it and redirect!
    return res.status(200).json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role } 
    });
    
  } catch (err) {
    console.error("\n=== LOGIN ERROR ===");
    console.error(err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

module.exports = router;