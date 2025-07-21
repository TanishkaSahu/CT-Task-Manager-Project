const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  deadline: Date,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'complete'],
    default: 'pending'
  },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: {
    type: String,
    enum: ['Assignment', 'Minor Project', 'Major Project'],
    default: 'Assignment'
  }
});

module.exports = mongoose.model('Task', taskSchema);
