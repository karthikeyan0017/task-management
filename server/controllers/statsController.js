const TaskModel = require('../models/taskModel');
const ActivityModel = require('../models/activityModel');

class StatsController {
  static async getOverview(req, res, next) {
    try {
      const allTasks = TaskModel.findAll();
      const todayStr = new Date().toISOString().split('T')[0];

      let todoCount = 0;
      let inProgressCount = 0;
      let reviewCount = 0;
      let completedCount = 0;

      const priorityCounts = {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      const tagMap = {};
      let overdueCount = 0;

      allTasks.forEach((task) => {
        // Status counts
        if (task.status === 'completed') completedCount++;
        else if (task.status === 'in_progress') inProgressCount++;
        else if (task.status === 'review') reviewCount++;
        else todoCount++;

        // Priority counts
        if (priorityCounts[task.priority] !== undefined) {
          priorityCounts[task.priority]++;
        }

        // Overdue check (only if not completed and has due date before today)
        if (task.status !== 'completed' && task.due_date && task.due_date < todayStr) {
          overdueCount++;
        }

        // Tags
        if (Array.isArray(task.tags)) {
          task.tags.forEach((tag) => {
            tagMap[tag] = (tagMap[tag] || 0) + 1;
          });
        }
      });

      const total = allTasks.length;
      const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const recentActivities = ActivityModel.getRecent(15);

      res.json({
        success: true,
        stats: {
          total,
          todo: todoCount,
          inProgress: inProgressCount,
          review: reviewCount,
          completed: completedCount,
          completionRate,
          overdue: overdueCount,
          priorityBreakdown: priorityCounts,
          tagBreakdown: tagMap,
          recentActivities
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getActivities(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 30;
      const activities = ActivityModel.getRecent(limit);
      res.json({
        success: true,
        count: activities.length,
        activities
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StatsController;
