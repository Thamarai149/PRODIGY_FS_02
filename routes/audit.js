const express = require('express');
const database = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get audit logs
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await database.getAuditLogs(parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
});

// Get audit logs for specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const logs = await new Promise((resolve, reject) => {
      database.db.all(`
        SELECT al.*, u.username 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        WHERE al.table_name = 'employees' AND al.record_id = ?
        ORDER BY al.timestamp DESC 
        LIMIT ? OFFSET ?
      `, [employeeId, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get employee audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee audit logs'
    });
  }
});

module.exports = router;