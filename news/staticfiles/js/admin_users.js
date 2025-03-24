// Global variables
let users = [];
let selectedUserId = null;

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Fetch users data
    fetchUsers();
    
    // Set up event listeners
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteUser);
    
    // Reset form when modal is opened for a new user
    const userModal = document.getElementById('userModal');
    userModal.addEventListener('show.bs.modal', function(event) {
        const button = event.relatedTarget;
        if (!button.hasAttribute('data-user-id')) {
            // New user
            resetForm();
            document.getElementById('userModalLabel').textContent = 'Add New User';
            document.getElementById('passwordHelpText').style.display = 'none';
        }
    });
});

// Fetch users from the API
function fetchUsers() {
    fetch('/api/admin/users/')
        .then(response => response.json())
        .then(data => {
            users = data.users;
            renderUsersTable();
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            alert('Failed to load users. Please try again.');
        });
}

// Render the users table
function renderUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>
                <span class="badge ${user.is_staff ? 'bg-success' : 'bg-secondary'}">
                    ${user.is_staff ? 'Yes' : 'No'}
                </span>
            </td>
            <td>
                <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editUser(${user.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                </button>
                <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${user.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Edit user
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Set form values
    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    document.getElementById('password').value = '';
    document.getElementById('firstName').value = user.first_name;
    document.getElementById('lastName').value = user.last_name;
    document.getElementById('isAdmin').checked = user.is_staff;
    
    // Update modal title and show password help text
    document.getElementById('userModalLabel').textContent = 'Edit User';
    document.getElementById('passwordHelpText').style.display = 'block';
    
    // Show the modal
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    userModal.show();
}

// Show delete confirmation modal
function showDeleteModal(userId) {
    selectedUserId = userId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

// Save user (create or update)
function saveUser() {
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        is_staff: document.getElementById('isAdmin').checked
    };
    
    // Validate required fields
    if (!userData.username || !userData.email) {
        alert('Username and Email are required fields');
        return;
    }
    
    // If it's a new user, password is required
    if (!userId && !userData.password) {
        alert('Password is required for new users');
        return;
    }
    
    const method = userId ? 'PUT' : 'POST';
    const url = '/api/admin/users/';
    
    // Add user ID for updates
    if (userId) {
        userData.id = userId;
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close the modal and refresh the users list
            const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            userModal.hide();
            fetchUsers();
        } else {
            alert('Error: ' + (data.error || 'Failed to save user'));
        }
    })
    .catch(error => {
        console.error('Error saving user:', error);
        alert('Failed to save user. Please try again.');
    });
}

// Delete user
function deleteUser() {
    if (!selectedUserId) return;
    
    fetch('/api/admin/users/', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ id: selectedUserId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close the modal and refresh the users list
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            deleteModal.hide();
            fetchUsers();
        } else {
            alert('Error: ' + (data.error || 'Failed to delete user'));
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
    });
}

// Reset form for new user
function resetForm() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
}

// Get CSRF token from cookie
function getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    
    return cookieValue;
}