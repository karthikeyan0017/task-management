const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, TaskController.getTasks);
router.get('/:id', optionalAuth, TaskController.getTaskById);
router.post('/', authenticateToken, TaskController.createTask);
router.put('/:id', authenticateToken, TaskController.updateTask);
router.patch('/:id/status', authenticateToken, TaskController.updateStatus);
router.delete('/:id', authenticateToken, TaskController.deleteTask);

module.exports = router;
