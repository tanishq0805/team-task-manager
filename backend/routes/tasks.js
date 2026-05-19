const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Added for decoding the user session payload
const Task = require('../models/Task');

// =========================================================================
// 1. GET ALL TASKS (DYNAMICALLY SCOPED PER USER CREDENTIALS)
// =========================================================================
router.get('/', async (req, res) => {
  try {
    // Extract token from headers to identify who is making the request
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token found, authorization denied.' });
    }

    // Decode token securely to extract the user's ID and assigned Role
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_this_later');
    const userId = decoded.id;
    const userRole = decoded.role;

    let tasks;

    // ROLE-BASED ACCESS CONTROL FILTERING:
    // If the account is an Admin, load the entire global workspace framework.
    // If it's a standard user/member, strictly limit the array query to their assigned tasks.
    if (userRole === 'Admin') {
      tasks = await Task.find().populate('project assignedTo', 'name email');
    } else {
      tasks = await Task.find({ assignedTo: userId }).populate('project assignedTo', 'name email');
    }

    return res.status(200).json(tasks);
  } catch (err) {
    console.error("Fetch Scoped Tasks Error:", err);
    return res.status(500).json({ message: 'Server error filtering dashboard task arrays', error: err.message });
  }
});

// =========================================================================
// 2. CREATE TASK WITH ASSIGNMENT PARAMETERS
// =========================================================================
router.post('/', async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } = req.body;
    
    if (!title || !project) {
      return res.status(400).json({ message: 'Title and Project references are mandatory fields.' });
    }

    const newTask = new Task({
      title,
      description,
      project,
      assignedTo: assignedTo || null, // Maps seamlessly to specific team members
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    await newTask.save();
    return res.status(201).json(newTask);
  } catch (err) {
    console.error("Create Task Error:", err);
    return res.status(500).json({ message: 'Server error creating task object configuration' });
  }
});

// =========================================================================
// 3. UPDATE TASK STATUS / ATTRIBUTES
// =========================================================================
router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } // Returns the newly modified document to update frontend state immediately
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Target task element not found' });
    }

    return res.status(200).json(updatedTask);
  } catch (err) {
    console.error("Update Task Error:", err);
    return res.status(500).json({ message: 'Server error updating task structural states' });
  }
});

module.exports = router;