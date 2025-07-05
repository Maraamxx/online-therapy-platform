// views/user/profile.js (This would be located at /public/js/user/profile.js)

document.addEventListener('DOMContentLoaded', () => {
    // Helper function to show messages
    function showMessage(elementId, message, type = 'success') {
        const messageArea = document.getElementById(elementId);
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.style.display = 'block';
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }

    // --- Profile Section Edit/Save Logic ---
    document.querySelectorAll('.info-group-card').forEach(card => {
        const form = card.querySelector('form');
        if (!form) return;

        const editButtons = form.querySelectorAll('.toggle-edit-mode');
        const saveButton = form.querySelector('.save-btn');
        const cancelButton = form.querySelector('.cancel-btn');
        const messageArea = card.querySelector('.message-area');

        let originalValues = {}; // Store original values for cancel

        // Function to toggle edit mode for a specific field or the whole form
        const toggleEditMode = (field, isEditing) => {
            const displayModeElements = card.querySelectorAll(`.info-group .display-mode`);
            const editModeElements = card.querySelectorAll(`.info-group .edit-mode`);
            const toggleEditModeButtons = card.querySelectorAll(`.info-group .toggle-edit-mode`);

            if (isEditing) {
                // If a specific field is targeted
                if (field) {
                    const displayElement = card.querySelector(`#display-${field}`);
                    const editElement = card.querySelector(`#edit-${field}`);
                    const toggleButton = card.querySelector(`.toggle-edit-mode[data-field="${field}"]`);

                    if (displayElement && editElement && toggleButton) {
                        originalValues[field] = editElement.value; // Store original value
                        displayElement.style.display = 'none';
                        editElement.style.display = 'block';
                        toggleButton.querySelector('.edit-icon').style.display = 'none';
                        toggleButton.querySelector('.cancel-text').style.display = 'inline';
                    }
                } else { // Enable all editable fields in the form
                    displayModeElements.forEach(el => el.style.display = 'none');
                    editModeElements.forEach(el => el.style.display = 'block');
                    toggleEditModeButtons.forEach(btn => {
                        btn.querySelector('.edit-icon').style.display = 'none';
                        btn.querySelector('.cancel-text').style.display = 'inline';
                    });

                    // Store all current display values for cancellation
                    editModeElements.forEach(input => {
                        originalValues[input.name] = input.value;
                    });
                }
                saveButton.style.display = 'inline-block';
                cancelButton.style.display = 'inline-block';
            } else {
                // If a specific field is targeted
                if (field) {
                    const displayElement = card.querySelector(`#display-${field}`);
                    const editElement = card.querySelector(`#edit-${field}`);
                    const toggleButton = card.querySelector(`.toggle-edit-mode[data-field="${field}"]`);

                    if (displayElement && editElement && toggleButton) {
                        displayElement.style.display = 'inline';
                        editElement.style.display = 'none';
                        editElement.value = originalValues[field] !== undefined ? originalValues[field] : editElement.value; // Revert
                        toggleButton.querySelector('.edit-icon').style.display = 'inline';
                        toggleButton.querySelector('.cancel-text').style.display = 'none';
                    }
                } else { // Disable all editable fields in the form
                    displayModeElements.forEach(el => el.style.display = 'inline');
                    editModeElements.forEach(el => {
                        el.style.display = 'none';
                        // Revert values to original on cancel
                        if (originalValues[el.name] !== undefined) {
                            el.value = originalValues[el.name];
                        }
                    });
                    toggleEditModeButtons.forEach(btn => {
                        btn.querySelector('.edit-icon').style.display = 'inline';
                        btn.querySelector('.cancel-text').style.display = 'none';
                    });
                }

                const anyFieldStillEditing = Array.from(editModeElements).some(el => el.style.display === 'block');
                if (!anyFieldStillEditing) {
                    saveButton.style.display = 'none';
                    cancelButton.style.display = 'none';
                }
                messageArea.style.display = 'none'; // Clear messages on cancel
            }
        };

        // Event listener for individual edit buttons
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const field = button.dataset.field;
                const isCurrentlyEditing = button.querySelector('.cancel-text').style.display === 'inline';

                // If clicking edit and no other field is editing, store all original values
                if (!isCurrentlyEditing && !Array.from(card.querySelectorAll('.edit-mode')).some(el => el.style.display === 'block')) {
                    originalValues = {}; // Reset
                    card.querySelectorAll('.info-group .edit-mode').forEach(input => {
                        originalValues[input.name] = input.value;
                    });
                }
                toggleEditMode(field, !isCurrentlyEditing);
            });
        });

        // Event listener for the form's cancel button
        cancelButton.addEventListener('click', () => {
            originalValues = {}; // Clear stored values
            toggleEditMode(null, false); // Cancel all edits
            messageArea.textContent = ''; // Clear messages
            messageArea.className = 'message-area';
        });

        // Event listener for form submission
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageArea.style.display = 'none'; // Clear previous messages

            const formData = new FormData(form);
            const updateData = {};
            let endpoint = '';

            if (form.id === 'update-basic-info-form') {
                updateData.name = formData.get('name');
                updateData.date_of_birth = formData.get('date_of_birth');
                endpoint = '/api/users/profile/basic';
            } else if (form.id === 'update-client-info-form') {
                updateData.clientData = {
                    therapy_goals: formData.get('therapy_goals'),
                    preferred_therapy_type: formData.get('preferred_therapy_type')
                };
                endpoint = '/api/users/profile/client';
            } else if (form.id === 'update-therapist-info-form') {
                updateData.therapistData = {
                    specialization: formData.get('specialization'),
                    experience_years: parseInt(formData.get('experience_years'), 10),
                    bio: formData.get('bio')
                };
                endpoint = '/api/users/profile/therapist';
            }

            try {
                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(messageArea.id, data.message || 'Profile updated successfully!', 'success');
                    // Update display-mode spans with new values
                    for (const key in updateData) {
                        if (key === 'clientData' || key === 'therapistData') {
                            for (const subKey in updateData[key]) {
                                const displayElement = card.querySelector(`#display-${subKey}`);
                                if (displayElement) {
                                    displayElement.textContent = updateData[key][subKey] || 'N/A';
                                }
                            }
                        } else {
                            const displayElement = card.querySelector(`#display-${key}`);
                            if (displayElement) {
                                if (key === 'date_of_birth' && updateData[key]) {
                                    displayElement.textContent = new Date(updateData[key]).toLocaleDateString();
                                } else {
                                    displayElement.textContent = updateData[key] || 'N/A';
                                }
                            }
                            // Also update the main display name if it's the basic info form
                            if (key === 'name' && form.id === 'update-basic-info-form') {
                                document.getElementById('display-name').textContent = updateData.name;
                            }
                        }
                    }
                    originalValues = {}; // Clear original values after successful save
                    toggleEditMode(null, false); // Exit edit mode
                } else {
                    showMessage(messageArea.id, data.message || 'Failed to update profile.', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showMessage(messageArea.id, 'An unexpected error occurred. Please try again.', 'error');
            }
        });
    });

    // --- Modals Logic ---
    const emailModal = document.getElementById('email-modal');
    const passwordModal = document.getElementById('password-modal');
    const pfpModal = document.getElementById('pfp-modal');

    const openEmailModalBtn = document.getElementById('open-email-modal');
    const openPasswordModalBtn = document.getElementById('open-password-modal');
    const openPFPModalBtn = document.getElementById('open-pfp-modal');

    const closeButtons = document.querySelectorAll('.modal .close-button');

    function openModal(modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open'); // To prevent scrolling body
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        // Clear messages when closing modal
        modal.querySelectorAll('.message-area').forEach(msgArea => {
            msgArea.textContent = '';
            msgArea.className = 'message-area';
        });
    }

    openEmailModalBtn.addEventListener('click', () => openModal(emailModal));
    openPasswordModalBtn.addEventListener('click', () => openModal(passwordModal));
    openPFPModalBtn.addEventListener('click', () => openModal(pfpModal));

    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });
    });

    // Close modal if clicked outside of content
    window.addEventListener('click', (event) => {
        if (event.target === emailModal) closeModal(emailModal);
        if (event.target === passwordModal) closeModal(passwordModal);
        if (event.target === pfpModal) closeModal(pfpModal);
    });

    // --- Update Email Form (Modal) ---
    const updateEmailForm = document.getElementById('update-email-form-modal');
    const modalEmailMessage = document.getElementById('modal-email-message');
    if (updateEmailForm) {
        updateEmailForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            modalEmailMessage.style.display = 'none';

            const newEmail = document.getElementById('modal_new_email').value;

            try {
                const response = await fetch('/api/users/update-email', {
                    method: 'POST', // Backend expects POST
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newEmail })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(modalEmailMessage.id, data.message || 'Email updated. Please check your new email for a verification link.', 'success');
                    document.getElementById('display-email').innerHTML = `${newEmail} <span class="email-verification-status not-verified">Not yet verified ❗</span>`;
                    document.querySelector('.modal-current-info strong').textContent = newEmail;
                    updateEmailForm.reset();
                    // Optionally, close modal after a delay or show a persistent message
                    // setTimeout(() => closeModal(emailModal), 3000);
                } else {
                    showMessage(modalEmailMessage.id, data.message || 'Failed to update email.', 'error');
                }
            } catch (error) {
                console.error('Error updating email:', error);
                showMessage(modalEmailMessage.id, 'An unexpected error occurred. Please try again.', 'error');
            }
        });
    }

    // --- Update Password Form (Modal) ---
    const updatePasswordForm = document.getElementById('update-password-form-modal');
    const modalPasswordMessage = document.getElementById('modal-password-message');
    const newPasswordField = document.getElementById('modal_new_password');
    const confirmNewPasswordField = document.getElementById('modal_confirm_new_password');
    const passwordMatchHint = document.getElementById('password-match-hint');

    if (updatePasswordForm) {
        // Real-time password match check
        [newPasswordField, confirmNewPasswordField].forEach(input => {
            input.addEventListener('input', () => {
                if (newPasswordField.value === confirmNewPasswordField.value) {
                    passwordMatchHint.textContent = 'Passwords match!';
                    passwordMatchHint.style.color = 'green';
                } else {
                    passwordMatchHint.textContent = 'Passwords do not match.';
                    passwordMatchHint.style.color = 'red';
                }
                if (newPasswordField.value === '' && confirmNewPasswordField.value === '') {
                    passwordMatchHint.textContent = '';
                }
            });
        });

        updatePasswordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            modalPasswordMessage.style.display = 'none';

            const currentPassword = document.getElementById('modal_current_password').value;
            const newPassword = newPasswordField.value;
            const confirmNewPassword = confirmNewPasswordField.value;

            if (newPassword !== confirmNewPassword) {
                showMessage(modalPasswordMessage.id, 'New password and confirmation do not match.', 'error');
                return;
            }
            if (newPassword.length < 8) {
                showMessage(modalPasswordMessage.id, 'New password must be at least 8 characters long.', 'error');
                return;
            }
            if (currentPassword === newPassword) {
                showMessage(modalPasswordMessage.id, 'New password cannot be the same as the current password.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/users/change-password', {
                    method: 'POST', // Backend expects POST
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(modalPasswordMessage.id, data.message || 'Password updated successfully!', 'success');
                    updatePasswordForm.reset();
                    passwordMatchHint.textContent = ''; // Clear hint
                    // Optionally, close modal after a delay
                    // setTimeout(() => closeModal(passwordModal), 3000);
                } else {
                    showMessage(modalPasswordMessage.id, data.message || 'Failed to change password.', 'error');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showMessage(modalPasswordMessage.id, 'An unexpected error occurred. Please try again.', 'error');
            }
        });
    }

    // --- Upload Profile Picture Form (Modal) ---
    const uploadPFPForm = document.getElementById('upload-pfp-form-modal');
    const modalPFPMessage = document.getElementById('modal-pfp-message');
    const pfpInput = document.getElementById('modal_profile_picture_input');
    const pfpPreview = document.getElementById('modal_pfp_preview');
    const mainPfpDisplay = document.getElementById('profile-picture-display'); // The large PFP on the main page

    if (uploadPFPForm) {
        pfpInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    pfpPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        uploadPFPForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            modalPFPMessage.style.display = 'none';

            const formData = new FormData();
            const file = pfpInput.files[0];

            if (!file) {
                showMessage(modalPFPMessage.id, 'Please select an image to upload.', 'error');
                return;
            }

            formData.append('profile_picture', file); // 'profile_picture' matches multer field name

            try {
                const response = await fetch('/api/users/profile-picture', {
                    method: 'POST',
                    body: formData // FormData sets Content-Type to multipart/form-data automatically
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(modalPFPMessage.id, data.message || 'Profile picture updated successfully!', 'success');
                    // Update both preview and main display images
                    if (data.filePath) {
                        pfpPreview.src = data.filePath;
                        mainPfpDisplay.src = data.filePath;
                    }
                    uploadPFPForm.reset(); // Clear file input
                    // Optionally close modal after a short delay
                    setTimeout(() => closeModal(pfpModal), 1500);
                } else {
                    showMessage(modalPFPMessage.id, data.message || 'Failed to upload profile picture.', 'error');
                }
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                showMessage(modalPFPMessage.id, 'An unexpected error occurred during upload. Please try again.', 'error');
            }
        });
    }

    // --- Email Verification Link handling (if accessed directly) ---
    // This part runs if the user clicks a verification link that lands on /verify-email
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    const currentPath = window.location.pathname;

    if (currentPath === '/api/users/verify-email' && verificationToken) {
        // Immediately attempt to verify email upon page load if token is present
        verifyEmail(verificationToken);
    }

    async function verifyEmail(token) {
        const emailVerificationStatusSpan = document.querySelector('.email-verification-status');
        if (emailVerificationStatusSpan) {
            emailVerificationStatusSpan.textContent = 'Verifying...';
            emailVerificationStatusSpan.classList.remove('verified', 'not-verified');
        }

        try {
            const response = await fetch(`/api/users/verify-email?token=${token}`, {
                method: 'GET', // Or POST if your backend expects it for security
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (emailVerificationStatusSpan) {
                    emailVerificationStatusSpan.textContent = 'Verified ✅';
                    emailVerificationStatusSpan.classList.add('verified');
                }
                // Update the main display email to show verified status
                const displayEmail = document.getElementById('display-email');
                if (displayEmail) {
                    displayEmail.innerHTML = `${displayEmail.textContent.split(' ')[0]} <span class="email-verification-status verified">Verified ✅</span>`;
                }
                showMessage('basic-info-message', 'Your email has been successfully verified!', 'success');
                // Remove token from URL to clean it up
                history.replaceState({}, document.title, window.location.pathname);
            } else {
                if (emailVerificationStatusSpan) {
                    emailVerificationStatusSpan.textContent = 'Verification Failed ❗';
                    emailVerificationStatusSpan.classList.add('not-verified');
                }
                showMessage('basic-info-message', data.message || 'Email verification failed. The link might be expired or invalid.', 'error');
            }
        } catch (error) {
            console.error('Error during email verification:', error);
            if (emailVerificationStatusSpan) {
                emailVerificationStatusSpan.textContent = 'Verification Error ❗';
                emailVerificationStatusSpan.classList.add('not-verified');
            }
            showMessage('basic-info-message', 'An error occurred during email verification. Please try again later.', 'error');
        }
    }
});