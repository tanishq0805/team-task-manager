const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const UserTaskStatus = require('../models/UserTaskStatus');

// GET ALL TASKS (Globally visible, individually tracked)
router.get('/', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token found, authorization denied.' });
    }

    // Decode token to find who is logged in
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_this_later');
    const userId = decoded.id;

    // 1. Fetch EVERY single task currently in the global pool
    const globalTasks = await Task.find().populate('project', 'name');

    // 2. Fetch any personalized column status changes this specific user has made
    const personalStatuses = await UserTaskStatus.find({ user: userId });

    // 3. Merge them: If the user hasn't touched a task, show it in 'Todo' instead of hiding it!
    const individualizedTasks = globalTasks.map(task => {
      const taskObject = task.toObject();
      
      // Look for a custom status row for this specific task and user
      const customStatusEntry = personalStatuses.find(s => s.task.toString() === task._id.toString());
      
      // Fallback Assignment: If found, use it. Otherwise, default to 'Todo' so it's visible.
      taskObject.status = customStatusEntry ? customStatusEntry.status : 'Todo';
      
      return taskObject;
    });

    return res.status(200).json(individualizedTasks);
  } catch (err) {
    console.error("Board rendering error:", err);
    return res.status(500).json({ message: 'Server error organizing task matrices.' });
  }
});

// Keep your POST and PUT endpoints exactly the same as before...