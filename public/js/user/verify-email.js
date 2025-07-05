// public/js/verify-email.js
document.addEventListener('DOMContentLoaded', async () => {
    const verificationStatus = document.getElementById('verification-status');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        verificationStatus.className = 'message-area error';
        verificationStatus.textContent = 'Verification link is missing or invalid.';
        return;
    }

    try {
        // Send the token to your backend verification endpoint
        const response = await fetch('/api/user/verify-email', {
            method: 'POST', // Match your backend router.post('/verify-email')
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        });

        const data = await response.json();

        if (response.ok) {
            verificationStatus.className = 'message-area success';
            verificationStatus.textContent = data.message || 'Your email has been successfully verified!';
        } else {
            verificationStatus.className = 'message-area error';
            verificationStatus.textContent = data.error || 'Email verification failed. The link might be expired or invalid.';
        }
    } catch (error) {
        console.error('Error during email verification:', error);
        verificationStatus.className = 'message-area error';
        verificationStatus.textContent = 'A network error occurred during verification. Please try again or request a new link.';
    }
});