document.addEventListener('DOMContentLoaded', function() {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarLinks = document.getElementById('navbarLinks');
    const logoutButton = document.getElementById('logoutButton'); // Get the logout button

    // Mobile Navbar Toggle
    if (navbarToggle && navbarLinks) {
        navbarToggle.addEventListener('click', function() {
            navbarLinks.classList.toggle('active');
            navbarToggle.classList.toggle('open'); // Optional: for animating the hamburger icon
        });
    }

    // Handle Logout (if client-side token clearing is needed)
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) {
            e.preventDefault(); // Prevent default link behavior

            try {
                // Assuming your backend has a /api/auth/logout endpoint
                const response = await fetch('/api/auth/logout', {
                    method: 'POST', // Or GET, depending on your API
                    headers: {
                        'Content-Type': 'application/json',
                        // If you use access tokens for logout, send it here
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.ok) {
                    // Clear local storage or session storage
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user'); // Clear user data too

                    // Redirect to home or login page after successful logout
                    window.location.href = '/login';
                } else {
                    // Handle logout error
                    console.error('Logout failed:', await response.text());
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }
});