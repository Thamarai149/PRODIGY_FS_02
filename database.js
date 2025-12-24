const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

class EmployeeDatabase {
  constructor() {
    this.db = new sqlite3.Database(process.env.DB_PATH || './employee_database.sqlite');
    this.init();
  }

  init() {
    // Create users table for authentication
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Create employees table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        salary DECIMAL(10,2),
        hire_date DATE NOT NULL,
        status TEXT DEFAULT 'active',
        address TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);

    // Create blacklisted tokens table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit log table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log('Employee database initialized successfully');
  }

  // User operations
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const { username, email, password, role = 'admin' } = userData;
      this.db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, email, role });
        }
      );
    });
  }

  async findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async findUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ? AND is_active = 1',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Employee CRUD operations
  async createEmployee(employeeData, userId) {
    const database = this;
    return new Promise((resolve, reject) => {
      const {
        employee_id, first_name, last_name, email, phone, department,
        position, salary, hire_date, address, emergency_contact_name,
        emergency_contact_phone, profile_image
      } = employeeData;

      database.db.run(
        `INSERT INTO employees (
          employee_id, first_name, last_name, email, phone, department,
          position, salary, hire_date, address, emergency_contact_name,
          emergency_contact_phone, profile_image, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id, first_name, last_name, email, phone, department,
          position, salary, hire_date, address, emergency_contact_name,
          emergency_contact_phone, profile_image, userId
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            const employeeId = this.lastID;
            // Log the action
            database.logAction(userId, 'CREATE', 'employees', employeeId, null, JSON.stringify(employeeData));
            resolve({ id: employeeId, ...employeeData });
          }
        }
      );
    });
  }

  async getAllEmployees(page = 1, limit = 10, search = '', department = '', status = 'active') {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE status = ?';
      let params = [status];

      if (search) {
        whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (department) {
        whereClause += ' AND department = ?';
        params.push(department);
      }

      // Get total count
      this.db.get(
        `SELECT COUNT(*) as total FROM employees ${whereClause}`,
        params,
        (err, countResult) => {
          if (err) {
            reject(err);
            return;
          }

          // Get paginated results
          this.db.all(
            `SELECT * FROM employees ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, rows) => {
              if (err) reject(err);
              else resolve({
                employees: rows,
                total: countResult.total,
                page,
                limit,
                totalPages: Math.ceil(countResult.total / limit)
              });
            }
          );
        }
      );
    });
  }

  async getEmployeeById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM employees WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async updateEmployee(id, employeeData, userId) {
    const database = this;
    return new Promise((resolve, reject) => {
      // First get the old values for audit log
      database.getEmployeeById(id).then(oldEmployee => {
        const {
          employee_id, first_name, last_name, email, phone, department,
          position, salary, hire_date, address, emergency_contact_name,
          emergency_contact_phone, profile_image, status
        } = employeeData;

        database.db.run(
          `UPDATE employees SET 
            employee_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
            department = ?, position = ?, salary = ?, hire_date = ?, address = ?,
            emergency_contact_name = ?, emergency_contact_phone = ?, profile_image = ?,
            status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            employee_id, first_name, last_name, email, phone, department,
            position, salary, hire_date, address, emergency_contact_name,
            emergency_contact_phone, profile_image, status, id
          ],
          function(err) {
            if (err) {
              reject(err);
            } else {
              // Log the action
              database.logAction(userId, 'UPDATE', 'employees', id, JSON.stringify(oldEmployee), JSON.stringify(employeeData));
              resolve({ id, ...employeeData });
            }
          }
        );
      }).catch(reject);
    });
  }

  async deleteEmployee(id, userId) {
    const database = this;
    return new Promise((resolve, reject) => {
      // Get employee data before deletion for audit log
      database.getEmployeeById(id).then(employee => {
        database.db.run(
          'UPDATE employees SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['deleted', id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              // Log the action
              database.logAction(userId, 'DELETE', 'employees', id, JSON.stringify(employee), null);
              resolve({ success: true });
            }
          }
        );
      }).catch(reject);
    });
  }

  async getDepartments() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT DISTINCT department FROM employees WHERE status = ? ORDER BY department',
        ['active'],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.department));
        }
      );
    });
  }

  async checkEmployeeIdExists(employeeId, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id FROM employees WHERE employee_id = ? AND status != ?';
      let params = [employeeId, 'deleted'];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }

  async checkEmailExists(email, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id FROM employees WHERE email = ? AND status != ?';
      let params = [email, 'deleted'];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }

  // Token blacklisting
  async blacklistToken(token) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO blacklisted_tokens (token) VALUES (?)',
        [token],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async isTokenBlacklisted(token) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT token FROM blacklisted_tokens WHERE token = ?',
        [token],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  // Audit logging
  logAction(userId, action, tableName, recordId, oldValues, newValues) {
    this.db.run(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, tableName, recordId, oldValues, newValues],
      (err) => {
        if (err) console.error('Audit log error:', err);
      }
    );
  }

  async getAuditLogs(page = 1, limit = 50) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      this.db.all(
        `SELECT al.*, u.username 
         FROM audit_logs al 
         LEFT JOIN users u ON al.user_id = u.id 
         ORDER BY al.timestamp DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = new EmployeeDatabase();