const express = require('express');
const router = express.Router();
const Project = require('../models/Project'); // Double-check this matches your file name capitalization

// 1. GET ALL PROJECTS
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    return res.status(200).json(projects);
  } catch (err) {
    console.error("Fetch Projects Error:", err);
    return res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// 2. CREATE NEW PROJECT
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const newProject = new Project({ name });
    await newProject.save();

    // MUST return a JSON status response so the frontend knows to unlock!
    return res.status(201).json(newProject);
  } catch (err) {
    console.error("Create Project Error:", err);
    return res.status(500).json({ message: 'Server error building project' });
  }
});

module.exports = router;