document.addEventListener('DOMContentLoaded', () => {
    const approveTherapistButtons = document.querySelectorAll('.applications-list .btn-approve');
    const declineTherapistButtons = document.querySelectorAll('.applications-list .btn-decline');

    const handleTherapistApplicationStatus = async (therapistId, status) => {
        try {
            const response = await fetch(`/api/admin/therapist-applications/${therapistId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.reload(); // Reload to reflect changes
            } else {
                alert(`Error: ${data.message || 'Failed to update application status.'}`);
            }
        } catch (error) {
            console.error('Error updating therapist application status:', error);
            alert('An unexpected error occurred.');
        }
    };

    approveTherapistButtons.forEach(button => {
        button.addEventListener('click', () => {
            const therapistId = button.dataset.therapistId;
            if (confirm('Are you sure you want to approve this application?')) {
                handleTherapistApplicationStatus(therapistId, 'Approved');
            }
        });
    });

    declineTherapistButtons.forEach(button => {
        button.addEventListener('click', () => {
            const therapistId = button.dataset.therapistId;
            if (confirm('Are you sure you want to decline this application?')) {
                handleTherapistApplicationStatus(therapistId, 'Rejected'); // Changed to 'Rejected' to match backend
            }
        });
    });

    // --- User Deactivate/Activate Buttons ---
    // These listeners need to be added to elements that exist when the DOM is ready.
    // If you load content dynamically, you might need to use event delegation.
    const handleUserStatus = async (userId, action) => {
        try {
            const endpoint = `/api/admin/users/${userId}/${action}`; // e.g., /users/:userId/deactivate or /users/:userId/activate
            const response = await fetch(endpoint, {
                method: 'PATCH', // Use PATCH as defined in your routes
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
                // No body needed for simple activate/deactivate
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.reload(); // Reload to reflect changes
            } else {
                alert(`Error: ${data.error || `Failed to ${action} user.`}`);
            }
        } catch (error) {
            console.error(`Error ${action} user:`, error);
            alert('An unexpected error occurred.');
        }
    };

    // Use event delegation for buttons that might be added dynamically (e.g., within tables)
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-deactivate')) {
            const userId = event.target.dataset.userId;
            if (confirm('Are you sure you want to deactivate this user?')) {
                handleUserStatus(userId, 'deactivate');
            }
        } else if (event.target.classList.contains('btn-activate')) {
            const userId = event.target.dataset.userId;
            if (confirm('Are you sure you want to activate this user?')) {
                handleUserStatus(userId, 'activate');
            }
        }
    });


    // Optional: Highlight active sidebar link based on current path
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        // Adjust logic for more complex paths if needed, e.g., checking /users/ and /users/inactive
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
        // More robust active link logic (e.g., if /users/:userId is active, highlight /users)
        if (path.startsWith('/api/admin/users/') && link.getAttribute('href') === '/api/admin/users') {
             link.classList.add('active');
        }
        if (path.startsWith('/api/admin/therapist-applications/') && link.getAttribute('href') === '/api/admin/therapist-applications/pending') {
             link.classList.add('active');
        }
    });
});