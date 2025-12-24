# Employee Management System

A comprehensive web application for managing employee records with full CRUD operations, authentication, and audit logging.

## Features

### 🔐 Security & Authentication
- JWT-based authentication system
- Role-based access control (Admin only)
- Password hashing with bcrypt
- Token blacklisting for secure logout
- Rate limiting protection
- Input validation and sanitization

### 👥 Employee Management
- **Create**: Add new employees with comprehensive details
- **Read**: View employee list with search and filtering
- **Update**: Edit employee information
- **Delete**: Soft delete employees (maintains audit trail)
- Profile image upload support
- Pagination for large datasets

### 📊 Advanced Features
- **Statistics Dashboard**: Employee counts, department breakdown, salary analytics
- **Audit Logging**: Complete activity tracking for compliance
- **Department Management**: Automatic department categorization
- **Search & Filter**: Real-time search across multiple fields
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🛡️ Data Validation
- Employee ID format validation
- Email uniqueness checking
- Phone number format validation
- Date validation (hire date cannot be future)
- File upload restrictions (images only, 5MB limit)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy and edit the .env file
   cp .env.example .env
   ```
   
   Update the following variables in `.env`:
   ```env
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ADMIN_EMAIL=admin@company.com
   ADMIN_PASSWORD=Admin123!
   ```

3. **Initialize Database**
   ```bash
   npm run setup
   ```
   
   This will:
   - Create the SQLite database
   - Set up all required tables
   - Create a default admin user
   - Add sample employee data

4. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open your browser to `http://localhost:3001`
   - Login with the admin credentials from the setup step

## Usage

### First Login
1. Use the admin credentials created during setup
2. Change the default password immediately
3. Start adding your employees

### Managing Employees

#### Adding Employees
1. Click "Add Employee" button
2. Fill in required fields (marked with *)
3. Optionally upload a profile image
4. Click "Save Employee"

#### Searching & Filtering
- Use the search box to find employees by name, email, or ID
- Filter by department using the dropdown
- Filter by status (Active, Inactive, Terminated)

#### Editing Employees
1. Click the edit (pencil) icon in the Actions column
2. Modify the information
3. Click "Save Employee"

#### Employee Status Management
- **Active**: Currently employed
- **Inactive**: Temporarily not working (leave, suspension)
- **Terminated**: No longer employed (soft delete)

### Statistics Dashboard
- View total employee counts
- See department breakdown
- Monitor average salaries
- Track employee distribution

### Audit Logging
- All employee changes are logged
- View who made changes and when
- See before/after values for updates
- Maintain compliance records

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/profile` - Get user profile

### Employee Management
- `GET /api/employees` - List employees (with pagination/filtering)
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (soft delete)
- `GET /api/employees/meta/departments` - Get departments list
- `GET /api/employees/meta/statistics` - Get statistics

### Audit Logs
- `GET /api/audit` - Get audit logs
- `GET /api/audit/employee/:id` - Get logs for specific employee

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (admin)
- `created_at` - Registration timestamp
- `last_login` - Last login timestamp
- `is_active` - Account status

### Employees Table
- `id` - Primary key
- `employee_id` - Unique employee identifier
- `first_name` - Employee first name
- `last_name` - Employee last name
- `email` - Unique email address
- `phone` - Phone number
- `department` - Department name
- `position` - Job position
- `salary` - Salary amount
- `hire_date` - Date of hire
- `status` - Employment status
- `address` - Home address
- `emergency_contact_name` - Emergency contact
- `emergency_contact_phone` - Emergency phone
- `profile_image` - Profile image filename
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - User who created the record

### Audit Logs Table
- `id` - Primary key
- `user_id` - User who performed action
- `action` - Type of action (CREATE, UPDATE, DELETE)
- `table_name` - Affected table
- `record_id` - Affected record ID
- `old_values` - Previous values (JSON)
- `new_values` - New values (JSON)
- `timestamp` - Action timestamp

## Security Features

### Input Validation
- Server-side validation using express-validator
- Client-side validation for better UX
- File upload restrictions and validation
- SQL injection prevention

### Authentication Security
- JWT tokens with expiration
- Token blacklisting on logout
- Password strength requirements
- Rate limiting on auth endpoints

### Data Protection
- Sensitive data hashing
- Secure file upload handling
- CORS configuration
- Helmet.js security headers

## File Structure

```
FS/EMPLOYEE/
├── middleware/
│   ├── auth.js          # Authentication middleware
│   ├── validation.js    # Input validation rules
│   └── upload.js        # File upload handling
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── employees.js     # Employee CRUD routes
│   └── audit.js         # Audit log routes
├── public/
│   ├── index.html       # Frontend HTML
│   ├── styles.css       # CSS styles
│   └── script.js        # Frontend JavaScript
├── uploads/             # Profile image storage
├── database.js          # Database operations
├── server.js            # Express server setup
├── setup.js             # Database initialization
├── package.json         # Dependencies
├── .env                 # Environment variables
└── README.md           # This file
```

## Development

### Adding New Features
1. Create new routes in the `routes/` directory
2. Add validation rules in `middleware/validation.js`
3. Update the frontend in `public/`
4. Test thoroughly with various inputs

### Database Migrations
- Modify the `init()` method in `database.js`
- Add migration logic for existing data
- Test with sample data

### Security Considerations
- Always validate input on both client and server
- Use parameterized queries to prevent SQL injection
- Implement proper error handling
- Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check if the database file exists
   - Verify file permissions
   - Run the setup script again

2. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser localStorage

3. **File Upload Problems**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure proper file types

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on the port

### Logs
- Check console output for errors
- Enable debug mode in development
- Review audit logs for user actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository