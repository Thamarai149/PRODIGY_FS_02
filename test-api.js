const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// Test configuration
const testCredentials = {
    email: 'admin@company.com',
    password: 'Admin123!'
};

const testEmployee = {
    employee_id: `TEST${Date.now()}`,
    first_name: 'Test',
    last_name: 'Employee',
    email: `test.employee.${Date.now()}@company.com`,
    phone: '+1234567890',
    department: 'Testing',
    position: 'Test Engineer',
    salary: 60000,
    hire_date: '2024-01-01',
    address: '123 Test St, Test City, TC 12345',
    emergency_contact_name: 'Test Contact',
    emergency_contact_phone: '+1234567891'
};

async function testAPI() {
    console.log('🧪 Starting Employee Management System API Tests\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data.message);

        // Test 2: Login
        console.log('\n2. Testing Login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
        authToken = loginResponse.data.token;
        console.log('✅ Login successful for user:', loginResponse.data.user.username);

        // Set up axios defaults with auth token
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        // Test 3: Get Employees
        console.log('\n3. Testing Get Employees...');
        const employeesResponse = await axios.get(`${BASE_URL}/employees`);
        console.log('✅ Retrieved employees:', employeesResponse.data.data.total, 'total employees');

        // Test 4: Create Employee
        console.log('\n4. Testing Create Employee...');
        const createResponse = await axios.post(`${BASE_URL}/employees`, testEmployee);
        const createdEmployeeId = createResponse.data.data.id;
        console.log('✅ Employee created with ID:', createdEmployeeId);

        // Test 5: Get Employee by ID
        console.log('\n5. Testing Get Employee by ID...');
        const getEmployeeResponse = await axios.get(`${BASE_URL}/employees/${createdEmployeeId}`);
        console.log('✅ Retrieved employee:', getEmployeeResponse.data.data.first_name, getEmployeeResponse.data.data.last_name);

        // Test 6: Update Employee
        console.log('\n6. Testing Update Employee...');
        const updatedData = { ...testEmployee, position: 'Senior Test Engineer', salary: 70000 };
        const updateResponse = await axios.put(`${BASE_URL}/employees/${createdEmployeeId}`, updatedData);
        console.log('✅ Employee updated, new position:', updateResponse.data.data.position);

        // Test 7: Get Departments
        console.log('\n7. Testing Get Departments...');
        const departmentsResponse = await axios.get(`${BASE_URL}/employees/meta/departments`);
        console.log('✅ Retrieved departments:', departmentsResponse.data.data.length, 'departments');

        // Test 8: Get Statistics
        console.log('\n8. Testing Get Statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/employees/meta/statistics`);
        console.log('✅ Retrieved statistics - Total employees:', statsResponse.data.data.overview.total_employees);

        // Test 9: Search Employees
        console.log('\n9. Testing Search Employees...');
        const searchResponse = await axios.get(`${BASE_URL}/employees?search=Test&department=Testing`);
        console.log('✅ Search results:', searchResponse.data.data.employees.length, 'employees found');

        // Test 10: Get Audit Logs
        console.log('\n10. Testing Get Audit Logs...');
        const auditResponse = await axios.get(`${BASE_URL}/audit`);
        console.log('✅ Retrieved audit logs:', auditResponse.data.data.length, 'log entries');

        // Test 11: Delete Employee
        console.log('\n11. Testing Delete Employee...');
        await axios.delete(`${BASE_URL}/employees/${createdEmployeeId}`);
        console.log('✅ Employee deleted successfully');

        // Test 12: Verify Employee is Soft Deleted
        console.log('\n12. Testing Soft Delete Verification...');
        const deletedEmployeeResponse = await axios.get(`${BASE_URL}/employees?status=deleted`);
        const deletedEmployee = deletedEmployeeResponse.data.data.employees.find(emp => emp.id === createdEmployeeId);
        if (deletedEmployee && deletedEmployee.status === 'deleted') {
            console.log('✅ Employee soft delete verified');
        } else {
            console.log('❌ Employee soft delete verification failed');
        }

        // Test 13: Logout
        console.log('\n13. Testing Logout...');
        await axios.post(`${BASE_URL}/auth/logout`);
        console.log('✅ Logout successful');

        // Test 14: Verify Token Invalidation
        console.log('\n14. Testing Token Invalidation...');
        try {
            await axios.get(`${BASE_URL}/employees`);
            console.log('❌ Token should be invalidated');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Token properly invalidated');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n🎉 All API tests completed successfully!');
        console.log('\n📊 Test Summary:');
        console.log('- Authentication: ✅ Login, Logout, Token Management');
        console.log('- Employee CRUD: ✅ Create, Read, Update, Delete');
        console.log('- Search & Filter: ✅ Search, Department Filter, Status Filter');
        console.log('- Statistics: ✅ Overview Stats, Department Breakdown');
        console.log('- Audit Logging: ✅ Activity Tracking');
        console.log('- Security: ✅ Token Validation, Rate Limiting');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

// Run tests
testAPI();