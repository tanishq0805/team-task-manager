const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Updated Middleware: Allows your live frontend URL to communicate securely
// Open CORS completely for deployment debugging
app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json()); // Allows parsing JSON data

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// ==========================================
// API ROUTES (Fully Unlocked & Mounted)
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects')); // Activated!
app.use('/api/tasks', require('./routes/tasks'));       // Added the tasks pipeline!

const PORT = process.env.PORT || 5000;

// Force binding to 0.0.0.0 allows Railway's gateway to pass traffic through
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));