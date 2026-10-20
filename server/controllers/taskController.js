const TaskModel = require('../models/taskModel');
const ActivityModel = require('../models/activityModel');
const { broadcast } = require('../websocket/wsServer');

class TaskController {
  static async getTasks(req, res, next) {
    try {
      const { status, priority, search, tag, sortBy, sortOrder, scope } = req.query;

      // By default, if scope=me, filter by logged in user id. If not specified or scope=all, show all tasks
      const userId = scope === 'me' && req.user ? req.user.id : null;

      const tasks = TaskModel.findAll({
        userId,
        status,
        priority,
        search,
        tag,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        count: tasks.length,
        tasks
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = TaskModel.findById(Number(id));

      if (!task) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found.`
        });
      }

      res.json({
        success: true,
        task
      });
    } catch (err) {
      next(err);
    }
  }

  static async createTask(req, res, next) {
    try {
      const { title, description, status, priority, due_date, tags, checklist } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title is required.'
        });
      }

      const newTask = TaskModel.create({
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: due_date || null,
        tags: Array.isArray(tags) ? tags : [],
        checklist: Array.isArray(checklist) ? checklist : [],
        userId: req.user.id,
        position: 0
      });

      // Log activity
      ActivityModel.log({
        taskId: newTask.id,
        userId: req.user.id,
        action: 'created',
        details: `${req.user.full_name} created task "${newTask.title}"`
      });

      // Real-time broadcast
      broadcast('TASK_CREATED', {
        task: newTask,
        actor: {
          id: req.user.id,
          name: req.user.full_name,
          avatar: req.user.avatar_color
        }
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully!',
        task: newTask
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const existing = TaskModel.findById(Number(id));

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found.`
        });
      }

      const updatedTask = TaskModel.update(Number(id), req.body);

      // Log activity
      ActivityModel.log({
        taskId: updatedTask.id,
        userId: req.user.id,
        action: 'updated',
        details: `${req.user.full_name} updated task "${updatedTask.title}"`
      });

      // Real-time broadcast
      broadcast('TASK_UPDATED', {
        task: updatedTask,
        actor: {
          id: req.user.id,
          name: req.user.full_name,
          avatar: req.user.avatar_color
        }
      });

      res.json({
        success: true,
        message: 'Task updated successfully!',
        task: updatedTask
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, position } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'New status is required.'
        });
      }

      const existing = TaskModel.findById(Number(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found.`
        });
      }

      const previousStatus = existing.status;
      const updatedTask = TaskModel.updateStatus(Number(id), status, position !== undefined ? Number(position) : 0);

      // Log activity if status changed
      if (previousStatus !== status) {
        ActivityModel.log({
          taskId: updatedTask.id,
          userId: req.user.id,
          action: 'status_changed',
          details: `${req.user.full_name} moved "${updatedTask.title}" from ${previousStatus.replace('_', ' ')} to ${status.replace('_', ' ')}`
        });
      }

      // Real-time broadcast
      broadcast('TASK_STATUS_CHANGED', {
        task: updatedTask,
        previousStatus,
        newStatus: status,
        actor: {
          id: req.user.id,
          name: req.user.full_name,
          avatar: req.user.avatar_color
        }
      });

      res.json({
        success: true,
        message: 'Status updated successfully!',
        task: updatedTask
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const existing = TaskModel.findById(Number(id));

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found.`
        });
      }

      TaskModel.delete(Number(id));

      // Log activity
      ActivityModel.log({
        taskId: null,
        userId: req.user.id,
        action: 'deleted',
        details: `${req.user.full_name} deleted task "${existing.title}"`
      });

      // Real-time broadcast
      broadcast('TASK_DELETED', {
        taskId: Number(id),
        taskTitle: existing.title,
        actor: {
          id: req.user.id,
          name: req.user.full_name,
          avatar: req.user.avatar_color
        }
      });

      res.json({
        success: true,
        message: 'Task deleted successfully!',
        deletedTaskId: Number(id)
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TaskController;
