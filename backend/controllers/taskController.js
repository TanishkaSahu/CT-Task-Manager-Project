const Task = require('../models/Task');
const Notification = require('../models/Notification');

exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      creator: req.user.id
    };

    const task = await Task.create(taskData);

    if (req.body.assignee) {
      await Notification.create({
        user: req.body.assignee,
        message: `You have a new task assigned: ${req.body.title}. Deadline: ${req.body.deadline ? new Date(req.body.deadline).toLocaleString() : 'N/A'}. Category: ${req.body.category}.`
      });
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { creator: req.user.id },
        { assignee: req.user.id }
      ]
    })
      .populate('assignee', 'username email')
      .populate('creator', 'username email');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found' });

    task.status = req.body.status;
    await task.save();
    res.json({ message: 'Status updated', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
