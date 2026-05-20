const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 

const Task = require('../models/Task');
const UserTaskStatus = require('../models/UserTaskStatus'); 

// =========================================================================
// 1. GET ALL TASKS (Globally visible, individually tracked)
// =========================================================================
router.get('/', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token found, authorization denied.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_this_later');
    const userId = decoded.id;

    // .populate('assignedTo') ensures the frontend can read names and online status
    const globalTasks = await Task.find()
      .populate('project', 'name')
      .populate('assignedTo', 'name lastActive');
      
    const personalStatuses = await UserTaskStatus.find({ user: userId });

    const individualizedTasks = globalTasks.map(task => {
      const taskObject = task.toObject();
      const customStatusEntry = personalStatuses.find(s => s.task.toString() === task._id.toString());
      
      taskObject.status = customStatusEntry ? customStatusEntry.status : 'Todo';
      return taskObject;
    });

    return res.status(200).json(individualizedTasks);
  } catch (err) {
    console.error("Board rendering error:", err);
    return res.status(500).json({ message: 'Server error organizing task matrices.' });
  }
});

// =========================================================================
// 2. CREATE GLOBAL TASK (Admin Only)
// =========================================================================
router.post('/', async (req, res) => {
  try {
    const { title, description, project, priority, dueDate, assignedTo } = req.body;
    const newTask = new Task({ title, description, project, priority, dueDate, assignedTo });
    await newTask.save();
    return res.status(201).json(newTask);
  } catch (err) {
    return res.status(500).json({ message: 'Server error creating global task' });
  }
});

// =========================================================================
// 3. UPDATE INDIVIDUAL STATUS & AUTOMATICALLY ARCHIVE
// =========================================================================
router.put('/:id', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_this_later');
    const userId = decoded.id;
    
    // Accept isArchived flag from the frontend
    const { status, isArchived } = req.body;

    // A. Log the individual user's status placement (if status is provided)
    if (status) {
      await UserTaskStatus.findOneAndUpdate(
        { user: userId, task: req.params.id },
        { status },
        { new: true, upsert: true }
      );
    }

    // B. Time-Tracking & Auto-Archive Injection
    const existingTask = await Task.findById(req.params.id);
    if (existingTask) {
      const taskUpdates = {};
      
      // If moved to In Progress, start timer and ensure it is UN-archived
      if (status === 'In Progress') {
        if (!existingTask.startedAt) taskUpdates.startedAt = new Date();
        taskUpdates.isArchived = false; 
      }
      
      // If marked Done, stamp completion time AND instantly Auto-Archive
      if (status === 'Done') {
        taskUpdates.completedAt = new Date();
        taskUpdates.isArchived = true; 
      }

      // Manual override just in case the frontend sends it explicitly
      if (isArchived !== undefined) taskUpdates.isArchived = isArchived;
      if (status) taskUpdates.status = status; 

      // Save the updates to the database if triggered
      if (Object.keys(taskUpdates).length > 0) {
        await Task.findByIdAndUpdate(req.params.id, taskUpdates);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error saving updates and archiving' });
  }
});

// =========================================================================
// 4. DELETE TASK (Synchronized Purge)
// =========================================================================
router.delete('/:id', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token found, authorization denied.' });
    
    // Verify user session
    jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_this_later');

    // Action 1: Delete the primary task from the global database
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ message: 'Task not found' });

    // Action 2: Instantly scrub the task from ALL users' personal assignment logs
    await UserTaskStatus.deleteMany({ task: req.params.id });

    return res.status(200).json({ message: 'Task removed successfully from all logs' });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ message: 'Server error deleting task' });
  }
});

module.exports = router;