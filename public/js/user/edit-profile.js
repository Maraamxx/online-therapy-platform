// public/js/user/edit-profile.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Helper function to show messages ---
    function showMessage(messageElement, message, type) {
        messageElement.textContent = message;
        messageElement.className = `message-area ${type}`; // 'success' or 'error'
        messageElement.style.display = 'block';
        setTimeout(() => {
            messageElement.style.display = 'none';
            messageElement.textContent = '';
        }, 5000);
    }

    // --- Profile Picture Upload Form ---
    const pfpForm = document.getElementById('upload-pfp-form');
    const pfpInput = document.getElementById('profile_picture_input');
    const pfpPreview = document.getElementById('pfp_preview');
    const pfpMessage = document.getElementById('pfp-message');

    if (pfpInput && pfpPreview) {
        pfpInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    pfpPreview.src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    if (pfpForm) {
        pfpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(pfpForm);

            try {
                const response = await fetch('/api/profile-picture', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                if (response.ok) {
                    showMessage(pfpMessage, data.message, 'success');
                    if (data.filePath) { // Use 'filePath' as per your controller
                        pfpPreview.src = data.filePath;
                    }
                } else {
                    showMessage(pfpMessage, data.error || 'Error uploading profile picture.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(pfpMessage, 'An unexpected error occurred.', 'error');
            }
        });
    }

    // --- Basic Information Form ---
    const basicInfoForm = document.getElementById('update-basic-info-form');
    const basicInfoMessage = document.getElementById('basic-info-message');

    if (basicInfoForm) {
        basicInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(basicInfoForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/profile/basic', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(basicInfoMessage, result.message, 'success');
                } else {
                    showMessage(basicInfoMessage, result.error || 'Error updating basic information.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(basicInfoMessage, 'An unexpected error occurred.', 'error');
            }
        });
    }

    // --- Client Information Form (if present) ---
    const clientInfoForm = document.getElementById('update-client-info-form');
    const clientInfoMessage = document.getElementById('client-info-message');

    if (clientInfoForm) {
        clientInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(clientInfoForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/profile/client', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(clientInfoMessage, result.message, 'success');
                } else {
                    showMessage(clientInfoMessage, result.error || 'Error updating client information.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(clientInfoMessage, 'An unexpected error occurred.', 'error');
            }
        });
    }

    // --- Therapist Information Form (if present) ---
    const therapistInfoForm = document.getElementById('update-therapist-info-form');
    const therapistInfoMessage = document.getElementById('therapist-info-message');

    if (therapistInfoForm) {
        therapistInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(therapistInfoForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/profile/therapist', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(therapistInfoMessage, result.message, 'success');
                } else {
                    showMessage(therapistInfoMessage, result.error || 'Error updating therapist information.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(therapistInfoMessage, 'An unexpected error occurred.', 'error');
            }
        });
    }

    // --- Email Update Form ---
    const emailForm = document.getElementById('update-email-form');
    const emailMessage = document.getElementById('email-message');

    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(emailForm);
            const newEmail = formData.get('email');

            try {
                const response = await fetch('/api/update-email', { // Corrected endpoint for email update
                    method: 'POST', // Or PATCH, as per your backend design
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: newEmail })
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(emailMessage, result.message, 'success');
                    // Optionally update the displayed email on the page without reload
                    document.getElementById('email').value = newEmail;
                } else {
                    showMessage(emailMessage, result.error || 'Error updating email.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(emailMessage, 'An unexpected error occurred.', 'error');
            }
        });
    }

    // --- Password Update Form ---
    const passwordForm = document.getElementById('update-password-form');
    const passwordMessage = document.getElementById('password-message');

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                showMessage(passwordMessage, 'New password and confirm password do not match.', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showMessage(passwordMessage, 'New password must be at least 8 characters long.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/update-password', { // Corrected endpoint for password update
                    method: 'POST', // Or PATCH, as per your backend design
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(passwordMessage, result.message, 'success');
                    passwordForm.reset(); // Clear the form on success
                } else {
                    showMessage(passwordMessage, result.error || 'Error updating password.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage(passwordMessage, 'An unexpected error occurred.', 'error');
            }
        });
    }
});