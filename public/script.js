// Global variables
let currentUser = null;
let currentPage = 1;
let currentLimit = 10;
let currentSearch = '';
let currentDepartment = '';
let currentStatus = 'active';
let editingEmployeeId = null;

// API Base URL
const API_BASE = '/api';

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    loginContainer: document.getElementById('loginContainer'),
    registerContainer: document.getElementById('registerContainer'),
    mainApp: document.getElementById('mainApp'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    logoutBtn: document.getElementById('logoutBtn'),
    userInfo: document.getElementById('userInfo'),
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    employeeModal: document.getElementById('employeeModal'),
    employeeForm: document.getElementById('employeeForm'),
    addEmployeeBtn: document.getElementById('addEmployeeBtn'),
    searchInput: document.getElementById('searchInput'),
    departmentFilter: document.getElementById('departmentFilter'),
    statusFilter: document.getElementById('statusFilter'),
    employeeTableBody: document.getElementById('employeeTableBody'),
    pagination: document.getElementById('pagination'),
    toastContainer: document.getElementById('toastContainer')
};

// Utility Functions
function showLoading() {
    elements.loading.style.display = 'flex';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function showToast(message, type = 'info', title = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header';
    
    const toastTitle = document.createElement('div');
    toastTitle.className = 'toast-title';
    toastTitle.textContent = title || type.charAt(0).toUpperCase() + type.slice(1);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => toast.remove());
    
    toastHeader.appendChild(toastTitle);
    toastHeader.appendChild(closeBtn);
    
    const toastMessage = document.createElement('div');
    toastMessage.className = 'toast-message';
    toastMessage.textContent = message;
    
    toast.appendChild(toastHeader);
    toast.appendChild(toastMessage);
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

async function apiRequest(url, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}${url}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            // Handle validation errors specifically
            if (data.errors && Array.isArray(data.errors)) {
                const errorMessages = data.errors.map(err => err.msg).join(', ');
                throw new Error(`${data.message}: ${errorMessages}`);
            }
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Authentication Functions
async function login(email, password) {
    try {
        showLoading();
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        setToken(response.token);
        currentUser = response.user;
        showMainApp();
        showToast('Login successful!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function register(username, email, password) {
    try {
        showLoading();
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        showToast('Registration successful! Please login.', 'success');
        showLoginForm();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function logout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeToken();
        currentUser = null;
        showLoginForm();
        showToast('Logged out successfully', 'info');
    }
}

async function verifyToken() {
    const token = getToken();
    if (!token) return false;
    
    try {
        const response = await apiRequest('/auth/verify');
        currentUser = response.user;
        return true;
    } catch (error) {
        removeToken();
        return false;
    }
}

// UI Functions
function showLoginForm() {
    elements.loginContainer.style.display = 'flex';
    elements.registerContainer.style.display = 'none';
    elements.mainApp.style.display = 'none';
}

function showRegisterForm() {
    elements.loginContainer.style.display = 'none';
    elements.registerContainer.style.display = 'flex';
    elements.mainApp.style.display = 'none';
}

function showMainApp() {
    elements.loginContainer.style.display = 'none';
    elements.registerContainer.style.display = 'none';
    elements.mainApp.style.display = 'block';
    
    if (currentUser) {
        elements.userInfo.textContent = `Welcome, ${currentUser.username}`;
    }
    
    loadEmployees();
    loadDepartments();
}

function switchTab(tabName) {
    // Update nav tabs
    elements.navTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}Tab`) {
            content.classList.add('active');
        }
    });
    
    // Load tab-specific data
    switch (tabName) {
        case 'employees':
            loadEmployees();
            break;
        case 'statistics':
            loadStatistics();
            break;
        case 'audit':
            loadAuditLogs();
            break;
    }
}

// Employee Functions
async function loadEmployees() {
    try {
        showLoading();
        const response = await apiRequest(`/employees?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}&department=${currentDepartment}&status=${currentStatus}`);
        
        displayEmployees(response.data.employees);
        displayPagination(response.data);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayEmployees(employees) {
    const tbody = elements.employeeTableBody;
    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No employees found</td></tr>';
        return;
    }
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${employee.profile_image 
                    ? `<img src="/uploads/${employee.profile_image}" alt="${employee.first_name}" class="employee-photo">` 
                    : `<div class="employee-photo" style="background: #e9ecef; display: flex; align-items: center; justify-content: center; color: #6c757d; font-weight: bold;">${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}</div>`
                }
            </td>
            <td>${employee.employee_id}</td>
            <td>${employee.first_name} ${employee.last_name}</td>
            <td>${employee.email}</td>
            <td>${employee.department}</td>
            <td>${employee.position}</td>
            <td><span class="status-badge status-${employee.status}">${employee.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary edit-employee-btn" data-employee-id="${employee.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-employee-btn" data-employee-id="${employee.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayPagination(data) {
    const pagination = elements.pagination;
    pagination.innerHTML = '';
    
    const { page, totalPages, total } = data;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = page === 1;
    prevBtn.className = 'pagination-btn prev-btn';
    prevBtn.dataset.page = page - 1;
    pagination.appendChild(prevBtn);
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${page} of ${totalPages} (${total} total)`;
    pagination.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = page === totalPages;
    nextBtn.className = 'pagination-btn next-btn';
    nextBtn.dataset.page = page + 1;
    pagination.appendChild(nextBtn);
}

async function loadDepartments() {
    try {
        const response = await apiRequest('/employees/meta/departments');
        const select = elements.departmentFilter;
        
        // Clear existing options except "All Departments"
        select.innerHTML = '<option value="">All Departments</option>';
        
        response.data.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

function showEmployeeModal(employee = null) {
    editingEmployeeId = employee ? employee.id : null;
    const modal = elements.employeeModal;
    const form = elements.employeeForm;
    const title = document.getElementById('modalTitle');
    
    title.textContent = employee ? 'Edit Employee' : 'Add Employee';
    
    if (employee) {
        // Populate form with employee data
        document.getElementById('employeeId').value = employee.employee_id;
        document.getElementById('firstName').value = employee.first_name;
        document.getElementById('lastName').value = employee.last_name;
        document.getElementById('email').value = employee.email;
        document.getElementById('phone').value = employee.phone || '';
        document.getElementById('department').value = employee.department;
        document.getElementById('position').value = employee.position;
        document.getElementById('salary').value = employee.salary || '';
        document.getElementById('hireDate').value = employee.hire_date;
        document.getElementById('status').value = employee.status;
        document.getElementById('address').value = employee.address || '';
        document.getElementById('emergencyContactName').value = employee.emergency_contact_name || '';
        document.getElementById('emergencyContactPhone').value = employee.emergency_contact_phone || '';
        
        // Show current profile image if exists
        const imagePreview = document.getElementById('imagePreview');
        if (employee.profile_image) {
            imagePreview.innerHTML = `<img src="/uploads/${employee.profile_image}" alt="Current photo">`;
        } else {
            imagePreview.innerHTML = '';
        }
    } else {
        // Clear form
        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
    }
    
    modal.style.display = 'block';
}

function hideEmployeeModal() {
    elements.employeeModal.style.display = 'none';
    editingEmployeeId = null;
}

async function saveEmployee(formData) {
    try {
        showLoading();
        
        const url = editingEmployeeId ? `/employees/${editingEmployeeId}` : '/employees';
        const method = editingEmployeeId ? 'PUT' : 'POST';
        
        await apiRequest(url, {
            method,
            body: formData
        });
        
        hideEmployeeModal();
        loadEmployees();
        showToast(`Employee ${editingEmployeeId ? 'updated' : 'created'} successfully!`, 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function editEmployee(id) {
    try {
        showLoading();
        const response = await apiRequest(`/employees/${id}`);
        showEmployeeModal(response.data);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }
    
    try {
        showLoading();
        await apiRequest(`/employees/${id}`, { method: 'DELETE' });
        loadEmployees();
        showToast('Employee deleted successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Statistics Functions
async function loadStatistics() {
    try {
        showLoading();
        const response = await apiRequest('/employees/meta/statistics');
        const { overview, departments } = response.data;
        
        // Update overview stats
        document.getElementById('totalEmployees').textContent = overview.total_employees || 0;
        document.getElementById('activeEmployees').textContent = overview.active_employees || 0;
        document.getElementById('totalDepartments').textContent = overview.total_departments || 0;
        document.getElementById('averageSalary').textContent = overview.average_salary 
            ? `$${parseFloat(overview.average_salary).toLocaleString()}` 
            : '$0';
        
        // Display department stats
        displayDepartmentStats(departments);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayDepartmentStats(departments) {
    const container = document.getElementById('departmentStatsTable');
    
    if (departments.length === 0) {
        container.innerHTML = '<p>No department data available</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Average Salary</th>
            </tr>
        </thead>
        <tbody>
            ${departments.map(dept => `
                <tr>
                    <td>${dept.department}</td>
                    <td>${dept.employee_count}</td>
                    <td>${dept.avg_salary ? `$${parseFloat(dept.avg_salary).toLocaleString()}` : 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
}

// Audit Log Functions
async function loadAuditLogs() {
    try {
        showLoading();
        const response = await apiRequest('/audit');
        displayAuditLogs(response.data);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayAuditLogs(logs) {
    const tbody = document.getElementById('auditTableBody');
    tbody.innerHTML = '';
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No audit logs found</td></tr>';
        return;
    }
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.username || 'System'}</td>
            <td><span class="status-badge status-${log.action.toLowerCase()}">${log.action}</span></td>
            <td>${log.table_name}</td>
            <td>${log.record_id}</td>
            <td>
                ${log.old_values || log.new_values 
                    ? `<button class="btn btn-sm btn-secondary audit-details-btn" data-log-id="${log.id}" data-old-values="${encodeURIComponent(log.old_values || '')}" data-new-values="${encodeURIComponent(log.new_values || '')}">View</button>`
                    : 'N/A'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAuditDetails(id, oldValues, newValues) {
    let content = '<h4>Audit Log Details</h4>';
    
    if (oldValues) {
        content += '<h5>Old Values:</h5>';
        content += `<pre>${JSON.stringify(JSON.parse(oldValues), null, 2)}</pre>`;
    }
    
    if (newValues) {
        content += '<h5>New Values:</h5>';
        content += `<pre>${JSON.stringify(JSON.parse(newValues), null, 2)}</pre>`;
    }
    
    // Create a simple modal for audit details
    const modal = document.createElement('div');
    modal.className = 'modal audit-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Audit Details</h2>
                <button class="modal-close audit-modal-close">&times;</button>
            </div>
            <div style="padding: 20px;">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners instead of inline handlers
    modal.querySelector('.audit-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    hideLoading();
    
    // Check if user is already logged in
    const isLoggedIn = await verifyToken();
    if (isLoggedIn) {
        showMainApp();
    } else {
        showLoginForm();
    }
    
    // Auth form handlers
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });
    
    elements.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        register(username, email, password);
    });
    
    elements.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    
    elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    elements.logoutBtn.addEventListener('click', logout);
    
    // Navigation tabs
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // Employee modal handlers
    elements.addEmployeeBtn.addEventListener('click', () => {
        showEmployeeModal();
    });
    
    elements.employeeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        saveEmployee(formData);
    });
    
    // Modal close handlers
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', hideEmployeeModal);
    });
    
    elements.employeeModal.addEventListener('click', (e) => {
        if (e.target === elements.employeeModal) {
            hideEmployeeModal();
        }
    });
    
    // Search and filter handlers
    elements.searchInput.addEventListener('input', debounce(() => {
        currentSearch = elements.searchInput.value;
        currentPage = 1;
        loadEmployees();
    }, 500));
    
    elements.departmentFilter.addEventListener('change', () => {
        currentDepartment = elements.departmentFilter.value;
        currentPage = 1;
        loadEmployees();
    });
    
    elements.statusFilter.addEventListener('change', () => {
        currentStatus = elements.statusFilter.value;
        currentPage = 1;
        loadEmployees();
    });
    
    // Profile image preview
    document.getElementById('profileImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    });
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', (e) => {
        // Edit employee button
        if (e.target.closest('.edit-employee-btn')) {
            const employeeId = e.target.closest('.edit-employee-btn').dataset.employeeId;
            editEmployee(employeeId);
        }
        
        // Delete employee button
        if (e.target.closest('.delete-employee-btn')) {
            const employeeId = e.target.closest('.delete-employee-btn').dataset.employeeId;
            deleteEmployee(employeeId);
        }
        
        // Pagination buttons
        if (e.target.closest('.pagination-btn')) {
            const btn = e.target.closest('.pagination-btn');
            if (!btn.disabled) {
                currentPage = parseInt(btn.dataset.page);
                loadEmployees();
            }
        }
        
        // Audit details button
        if (e.target.closest('.audit-details-btn')) {
            const btn = e.target.closest('.audit-details-btn');
            const logId = btn.dataset.logId;
            const oldValues = decodeURIComponent(btn.dataset.oldValues);
            const newValues = decodeURIComponent(btn.dataset.newValues);
            showAuditDetails(logId, oldValues, newValues);
        }
    });
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}