const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Employee validation rules
const validateEmployee = [
  body('employee_id')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters')
    .matches(/^[A-Za-z0-9-_]+$/)
    .withMessage('Employee ID must contain only letters, numbers, hyphens, and underscores'),
  
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('First name must contain only letters, spaces, hyphens, apostrophes, and periods'),
  
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Last name must contain only letters, spaces, hyphens, apostrophes, and periods'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid phone number format'),
  
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  
  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),
  
  body('salary')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  
  body('hire_date')
    .isISO8601()
    .withMessage('Valid hire date is required (YYYY-MM-DD format)')
    .custom((value) => {
      const hireDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Allow today's date
      if (hireDate > today) {
        throw new Error('Hire date cannot be in the future');
      }
      return true;
    }),
  
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['active', 'inactive', 'terminated'])
    .withMessage('Status must be active, inactive, or terminated'),
  
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('emergency_contact_name')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name must be between 2 and 100 characters'),
  
  body('emergency_contact_phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Invalid emergency contact phone number format'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Registration validation
const validateRegistration = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must contain only letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  
  query('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department filter must not exceed 100 characters'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'terminated', 'deleted'])
    .withMessage('Status must be active, inactive, terminated, or deleted'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

module.exports = {
  validateEmployee,
  validateLogin,
  validateRegistration,
  validatePagination,
  validateId,
  handleValidationErrors
};