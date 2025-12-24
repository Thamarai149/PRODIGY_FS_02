require('dotenv').config();
const bcrypt = require('bcryptjs');
const database = require('./database');

async function setupDatabase() {
    console.log('🚀 Setting up Employee Management System...');
    
    try {
        // Wait for database initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if admin user already exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
        const existingAdmin = await database.findUserByEmail(adminEmail);
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log(`📧 Email: ${adminEmail}`);
        } else {
            // Create default admin user
            const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            
            const admin = await database.createUser({
                username: 'admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });
            
            console.log('✅ Default admin user created successfully!');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log('⚠️  Please change the default password after first login');
        }
        
        // Create sample employees (optional)
        const sampleEmployees = [
            {
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@company.com',
                phone: '+1234567890',
                department: 'Engineering',
                position: 'Software Developer',
                salary: 75000,
                hire_date: '2023-01-15',
                address: '123 Main St, City, State 12345',
                emergency_contact_name: 'Jane Doe',
                emergency_contact_phone: '+1234567891'
            },
            {
                employee_id: 'EMP002',
                first_name: 'Sarah',
                last_name: 'Johnson',
                email: 'sarah.johnson@company.com',
                phone: '+1234567892',
                department: 'Marketing',
                position: 'Marketing Manager',
                salary: 65000,
                hire_date: '2023-02-01',
                address: '456 Oak Ave, City, State 12345',
                emergency_contact_name: 'Mike Johnson',
                emergency_contact_phone: '+1234567893'
            },
            {
                employee_id: 'EMP003',
                first_name: 'Michael',
                last_name: 'Brown',
                email: 'michael.brown@company.com',
                phone: '+1234567894',
                department: 'Human Resources',
                position: 'HR Specialist',
                salary: 55000,
                hire_date: '2023-03-10',
                address: '789 Pine St, City, State 12345',
                emergency_contact_name: 'Lisa Brown',
                emergency_contact_phone: '+1234567895'
            }
        ];
        
        console.log('📊 Creating sample employees...');
        
        for (const employeeData of sampleEmployees) {
            try {
                // Check if employee already exists
                const existing = await new Promise((resolve, reject) => {
                    database.db.get(
                        'SELECT id FROM employees WHERE employee_id = ?',
                        [employeeData.employee_id],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        }
                    );
                });
                
                if (!existing) {
                    await database.createEmployee(employeeData, 1); // Created by admin (ID: 1)
                    console.log(`✅ Created employee: ${employeeData.first_name} ${employeeData.last_name}`);
                } else {
                    console.log(`⏭️  Employee ${employeeData.employee_id} already exists`);
                }
            } catch (error) {
                console.log(`❌ Error creating employee ${employeeData.employee_id}:`, error.message);
            }
        }
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Open: http://localhost:3001');
        console.log('3. Login with the admin credentials shown above');
        console.log('4. Start managing your employees!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        database.close();
        process.exit(0);
    }
}

// Run setup
setupDatabase();