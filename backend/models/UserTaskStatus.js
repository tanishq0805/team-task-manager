const mongoose = require('mongoose');

const UserTaskStatusSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  task: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Todo', 'In Progress', 'Done'], 
    default: 'Todo' 
  }
}, { timestamps: true });

// Strict unique constraint index prevents duplicate tracking entries
UserTaskStatusSchema.index({ user: 1, task: 1 }, { unique: true });

module.exports = mongoose.model('UserTaskStatus', UserTaskStatusSchema);