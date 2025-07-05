document.addEventListener('DOMContentLoaded', function () {
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Handle cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const appointmentId = btn.getAttribute('data-appointment-id');
            const viewType = btn.getAttribute('data-view-type');
            const appointmentDateTime = btn.getAttribute('data-datetime');
            const paymentAmount = btn.getAttribute('data-payment-amount');
            const isSubscription = btn.getAttribute('data-is-subscription') === 'true';

            if (!appointmentId || !viewType) {
                console.warn('Missing appointment ID or view type');
                return;
            }

            // Calculate time remaining and refund amount based on refundService.js logic
            const appointmentTime = new Date(appointmentDateTime);
            const now = new Date();
            const hoursLeft = (appointmentTime - now) / (1000 * 60 * 60);
            const isEarlyCancellation = hoursLeft > 12;

            // Calculate refund amount based on backend logic
            let refundAmount = null;
            let refundMessage = '';

            if (viewType === 'therapist') {
                refundMessage = 'The appointment will be cancelled';
            } else {
                if (isSubscription) {
                    if (hoursLeft > 12) {
                        refundAmount = paymentAmount;
                        refundMessage = 'Session credit will be returned to your subscription';
                    } else {
                        refundAmount = (paymentAmount * 0.75).toFixed(2);
                        refundMessage = '75% refund will be processed';
                    }
                } else {
                    if (hoursLeft > 12) {
                        refundAmount = paymentAmount;
                        refundMessage = 'Full refund will be processed';
                    } else {
                        refundAmount = (paymentAmount * 0.75).toFixed(2);
                        refundMessage = '75% refund will be processed';
                    }
                }
            }

            // Create and show the refund policy modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${viewType === 'therapist' ? 'Cancel Appointment' : 'Cancellation Policy'}</h3>
                    <button class="close-modal text-gray-400 hover:text-gray-500">
                        <i data-feather="x" class="h-5 w-5"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i data-feather="info" class="h-5 w-5 text-blue-400"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-700">
                                    ${viewType === 'therapist' ? 'Please provide a reason for cancelling this appointment.' : 'Please review our cancellation policy before proceeding.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    ${viewType !== 'therapist' ? `
                    <div class="bg-${isEarlyCancellation ? 'green' : 'yellow'}-50 border-l-4 border-${isEarlyCancellation ? 'green' : 'yellow'}-400 p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i data-feather="clock" class="h-5 w-5 text-${isEarlyCancellation ? 'green' : 'yellow'}-400"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-${isEarlyCancellation ? 'green' : 'yellow'}-700">
                                    <strong>${Math.round(hoursLeft)} hours until appointment</strong><br>
                                    ${isEarlyCancellation ? 'You are eligible for a full refund.' : 'A 25% cancellation fee will apply.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    ${refundAmount ? `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-900">Estimated Refund:</span>
                            <span class="text-lg font-semibold text-primary">$${refundAmount}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            ${refundMessage}
                        </p>
                    </div>
                    ` : ''}

                    <div class="space-y-3">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <i data-feather="clock" class="h-5 w-5 text-primary mt-0.5"></i>
                            </div>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-gray-900">Time-based Refund Policy</h4>
                                <ul class="mt-2 text-sm text-gray-600 space-y-2">
                                    <li class="flex items-start">
                                        <span class="text-green-600 mr-2">•</span>
                                        <span>More than 12 hours before appointment: Full refund</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-yellow-600 mr-2">•</span>
                                        <span>Less than 12 hours before appointment: 75% refund</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <i data-feather="credit-card" class="h-5 w-5 text-primary mt-0.5"></i>
                            </div>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-gray-900">Payment Type</h4>
                                <ul class="mt-2 text-sm text-gray-600 space-y-2">
                                    <li class="flex items-start">
                                        <span class="text-primary mr-2">•</span>
                                        <span>Pay-per-session: Refund to original payment method</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-primary mr-2">•</span>
                                        <span>Subscription: Session credit returned to your account</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="mt-4">
                        <label for="cancellation-reason" class="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Cancellation
                        </label>
                        <textarea
                            id="cancellation-reason"
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="Please provide a reason for cancellation (optional)"
                        ></textarea>
                    </div>

                    <div class="mt-6 flex justify-end gap-6">
                        <button class="close-modal px-4 py-2 text-sm font-medium text-white bg-brandpurple border border-transparent rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandpurple">
                            Cancel
                        </button>
                        <button class="confirm-cancel px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" data-appointment-id="${appointmentId}" data-view-type="${viewType}">
                            Proceed with Cancellation
                        </button>
                    </div>
                </div>
            </div>
        `;

            document.body.appendChild(modal);

            // --- IMPORTANT CHANGE: Move feather.replace() here ---
            if (typeof feather !== 'undefined') {
                feather.replace(); // Re-render icons after modal HTML is in DOM
            }

            // Handle modal close
            modal.querySelectorAll('.close-modal').forEach(closeBtn => {
                closeBtn.addEventListener('click', () => {
                    modal.remove();
                });
            });

            // Handle cancellation confirmation
            modal.querySelector('.confirm-cancel').addEventListener('click', () => {
                console.log('Proceed with Cancellation button clicked!'); // Your test log

                const reason = modal.querySelector('#cancellation-reason').value.trim();
                const url = viewType === 'therapist'
                    ? `/appointments/management/${appointmentId}/therapist/cancel`
                    : `/appointments/management/${appointmentId}/cancel`;

                fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        reason: reason || 'No reason was provided',
                        initiator: viewType
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => {
                                throw new Error(err.message || 'Failed to cancel appointment');
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success === false) {
                            throw new Error(data.message || 'Failed to cancel appointment');
                        }

                        // Find the appointment card and update its status
                        const appointmentCard = document.querySelector(`[data-appointment-id="${appointmentId}"]`).closest('.appointment-card');
                        if (appointmentCard) {
                            // Update status badge
                            const statusBadge = appointmentCard.querySelector('.status-badge');
                            if (statusBadge) {
                                statusBadge.className = 'status-badge status-cancelled';
                                statusBadge.innerHTML = `
                                    <i data-feather="x-circle" class="h-4 w-4"></i>
                                    Cancelled
                                `;
                                feather.replace();
                            }

                            // Add cancellation reason if provided
                            if (reason) {
                                const detailsDiv = appointmentCard.querySelector('.appointment-details');
                                if (detailsDiv) {
                                    const reasonDiv = document.createElement('div');
                                    reasonDiv.className = 'cancellation-reason';
                                    reasonDiv.innerHTML = `
                                        <strong>Cancellation Reason:</strong>
                                        ${reason}
                                        <span class="ml-2">(by ${viewType === 'therapist' ? 'Therapist' : 'Client'})</span>
                                    `;
                                    detailsDiv.appendChild(reasonDiv);
                                }
                            }

                            // Remove action buttons
                            const actionsDiv = appointmentCard.querySelector('.appointment-actions');
                            if (actionsDiv) {
                                actionsDiv.remove();
                            }
                        }

                        // Show success message
                        const successMessage = document.createElement('div');
                        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                        successMessage.textContent = 'Appointment cancelled successfully';
                        document.body.appendChild(successMessage);

                        // Remove success message after 3 seconds
                        setTimeout(() => {
                            successMessage.remove();
                            // Reload the page to ensure all data is in sync
                            window.location.reload();
                        }, 3000);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Show error message
                        const errorMessage = document.createElement('div');
                        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                        errorMessage.textContent = error.message || 'An error occurred while canceling the appointment';
                        document.body.appendChild(errorMessage);

                        // Remove error message after 5 seconds
                        setTimeout(() => {
                            errorMessage.remove();
                        }, 5000);
                    })
                    .finally(() => {
                        modal.remove();
                    });
            });
        });
    });

    // Accept reschedule
    document.querySelectorAll('.accept-reschedule-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-appointment-id');
            if (!id) {
                console.warn('Missing appointment ID');
                return;
            }

            fetch(`/appointments/management/${id}/reschedule/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        showSuccessMessage(
                            'Reschedule request has been accepted.',
                            'success'
                        );
                    } else {
                        alert(data.message || 'Failed to accept reschedule.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    // alert('An error occurred while accepting the reschedule request');
                });
        });
    });

    // Decline reschedule
    document.querySelectorAll('.decline-reschedule-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-appointment-id');
            if (!id) {
                console.warn('Missing appointment ID');
                return;
            }

            const reason = prompt('Please provide a reason for declining the reschedule request:');
            if (!reason) return;

            fetch(`/appointments/management/${id}/reschedule/decline`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ userProvidedReason: reason })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        showSuccessMessage(
                            'Reschedule request has been declined.',
                            'declined',
                            `Reason: ${reason}`
                        );
                    } else {
                        alert(data.message || 'Failed to decline reschedule.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while declining the reschedule request');
                });
        });
    });
});

function showSuccessMessage(message, type = 'success', details = '') {
    try {
        // Create a modal or toast
        const modal = document.createElement('div');
        const icon = type === 'success' ? 'check-circle' : 'x-circle';
        const color = type === 'success' ? '#16a34a' : '#dc2626';

        modal.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2)">
                <div style="background:white;padding:2rem 3rem;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,0.15);text-align:center;">
                    <h2 style="color:${color};font-size:1.5rem;font-weight:bold;margin-bottom:1rem;">
                        <i data-feather="${icon}" style="width:24px;height:24px;display:inline-block;vertical-align:middle;margin-right:0.5rem;"></i>
                        ${type === 'success' ? 'Success!' : 'Request Processed'}
                    </h2>
                    <p style="color:#333;font-size:1rem;margin-bottom:1rem;">${message}</p>
                    ${details ? `<p style="color:#666;font-size:0.9rem;margin-bottom:1.5rem;">${details}</p>` : ''}
                    <div style="color:#888;font-size:0.9rem;">You will be redirected shortly...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Safely initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        setTimeout(() => {
            modal.remove();
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error('Error showing success message:', error);
        // Fallback to simple alert if modal creation fails
        alert(message);
        window.location.reload();
    }
} 