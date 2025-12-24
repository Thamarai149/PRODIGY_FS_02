const express = require('express');
const database = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateEmployee, validatePagination, validateId } = require('../middleware/validation');
const { upload, handleUploadError, deleteFile } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all employees with pagination and filtering
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department = '',
      status = 'active'
    } = req.query;

    const result = await database.getAllEmployees(
      parseInt(page),
      parseInt(limit),
      search,
      department,
      status
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees'
    });
  }
});

// Get employee by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const employee = await database.getEmployeeById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee'
    });
  }
});

// Create new employee
router.post('/', upload, handleUploadError, validateEmployee, async (req, res) => {
  try {
    const employeeData = { ...req.body };
    
    // Add profile image path if uploaded
    if (req.file) {
      employeeData.profile_image = req.file.filename;
    }

    // Check if employee ID already exists
    const employeeIdExists = await database.checkEmployeeIdExists(employeeData.employee_id);
    if (employeeIdExists) {
      // Delete uploaded file if employee ID exists
      if (req.file) {
        deleteFile(req.file.filename);
      }
      return res.status(409).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Check if email already exists
    const emailExists = await database.checkEmailExists(employeeData.email);
    if (emailExists) {
      // Delete uploaded file if email exists
      if (req.file) {
        deleteFile(req.file.filename);
      }
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const employee = await database.createEmployee(employeeData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee'
    });
  }
});

// Update employee
router.put('/:id', validateId, upload, handleUploadError, validateEmployee, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employeeData = { ...req.body };

    // Check if employee exists
    const existingEmployee = await database.getEmployeeById(employeeId);
    if (!existingEmployee) {
      if (req.file) {
        deleteFile(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee ID already exists (excluding current employee)
    const employeeIdExists = await database.checkEmployeeIdExists(employeeData.employee_id, employeeId);
    if (employeeIdExists) {
      if (req.file) {
        deleteFile(req.file.filename);
      }
      return res.status(409).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Check if email already exists (excluding current employee)
    const emailExists = await database.checkEmailExists(employeeData.email, employeeId);
    if (emailExists) {
      if (req.file) {
        deleteFile(req.file.filename);
      }
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle profile image update
    if (req.file) {
      // Delete old profile image if exists
      if (existingEmployee.profile_image) {
        deleteFile(existingEmployee.profile_image);
      }
      employeeData.profile_image = req.file.filename;
    } else {
      // Keep existing profile image
      employeeData.profile_image = existingEmployee.profile_image;
    }

    const updatedEmployee = await database.updateEmployee(employeeId, employeeData, req.user.id);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee'
    });
  }
});

// Delete employee (soft delete)
router.delete('/:id', validateId, async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Check if employee exists
    const existingEmployee = await database.getEmployeeById(employeeId);
    if (!existingEmployee || existingEmployee.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await database.deleteEmployee(employeeId, req.user.id);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee'
    });
  }
});

// Get departments list
router.get('/meta/departments', async (req, res) => {
  try {
    const departments = await database.getDepartments();
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments'
    });
  }
});

// Get employee statistics
router.get('/meta/statistics', async (req, res) => {
  try {
    const stats = await new Promise((resolve, reject) => {
      database.db.all(`
        SELECT 
          COUNT(*) as total_employees,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
          COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_employees,
          COUNT(DISTINCT department) as total_departments,
          AVG(salary) as average_salary
        FROM employees 
        WHERE status != 'deleted'
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });

    // Get department breakdown
    const departmentStats = await new Promise((resolve, reject) => {
      database.db.all(`
        SELECT 
          department,
          COUNT(*) as employee_count,
          AVG(salary) as avg_salary
        FROM employees 
        WHERE status = 'active'
        GROUP BY department
        ORDER BY employee_count DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        overview: stats,
        departments: departmentStats
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;