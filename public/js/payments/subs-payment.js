document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("paymentForm");
    if (!form) return; // Exit if the form doesn't exist

    const paymentMethodSelect = document.getElementById("paymentMethod");
    const cardFieldsDiv = document.getElementById("card-fields");
    const vodafoneCashFieldsDiv = document.getElementById("vodafone-cash-fields");
    const orangeMoneyFieldsDiv = document.getElementById("orange-money-fields");
    const etisalatCashFieldsDiv = document.getElementById("etisalat-cash-fields");

    const cardNumberInput = document.getElementById("cardNumber");
    const expirationDateInput = document.getElementById("expirationDate"); // Corrected ID
    const cvvInput = document.getElementById("cvv");
    const cardholderNameInput = document.getElementById("cardholderName"); // Added cardholder name input
    
    // Select all mobile number inputs, they have the same ID across different divs.
    // We'll determine which one is relevant based on the selected payment method.
    const mobileNumberInputs = document.querySelectorAll("#vodafone-cash-fields #mobileNumber, #orange-money-fields #mobileNumber, #etisalat-cash-fields #mobileNumber");
    let activeMobileNumberInput = null; // To hold the currently active mobile number input

    const resultMessageDiv = document.getElementById("resultMessage");
    const submitButton = form.querySelector('button[type="submit"]');

    // --- Helper Function to Display Errors ---
    function displayError(element, message) {
        if (!element) return;
        const errorDiv = element.nextElementSibling; // Assumes error-message div is the next sibling
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.textContent = message;
        }
        element.classList.add('is-invalid');
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        resultMessageDiv.style.display = 'none';
        resultMessageDiv.innerHTML = '';
    }

    // --- Input Formatting (for better UX) ---
    // Format credit card number with spaces
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim(); // Add space after every 4 digits
            e.target.value = value;
            if (value.length > 19) { // Max 19 chars (16 digits + 3 spaces)
                e.target.value = value.substring(0, 19);
            }
        });
    }

    // Format expiry date as MM/YY
    if (expirationDateInput) {
        expirationDateInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
            if (value.length > 5) { // Max 5 chars (MM/YY)
                e.target.value = value.substring(0, 5);
            }
        });
    }

    // CVV input: limit to 3 or 4 digits
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            e.target.value = value.substring(0, 4); // Max 4 digits
        });
    }

    // Mobile Number: limit to 11 digits (for Egypt) and allow only digits
    mobileNumberInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            e.target.value = value.substring(0, 11); // Max 11 digits for Egyptian numbers
        });
    });

    // --- Payment Method Selection Handling ---
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener("change", function () {
            const selected = this.value;
            // Hide all conditional fields
            cardFieldsDiv.style.display = "none";
            vodafoneCashFieldsDiv.style.display = "none";
            orangeMoneyFieldsDiv.style.display = "none";
            etisalatCashFieldsDiv.style.display = "none";

            // Remove 'required' attribute from all potentially required inputs
            [cardNumberInput, expirationDateInput, cvvInput, cardholderNameInput].forEach(input => {
                if (input) input.removeAttribute('required');
            });
            mobileNumberInputs.forEach(input => input.removeAttribute('required'));
            activeMobileNumberInput = null; // Reset active mobile number input

            // Show and set 'required' based on selection
            if (selected === "card") {
                cardFieldsDiv.style.display = "block";
                if (cardNumberInput) cardNumberInput.setAttribute('required', 'required');
                if (expirationDateInput) expirationDateInput.setAttribute('required', 'required');
                if (cvvInput) cvvInput.setAttribute('required', 'required');
                if (cardholderNameInput) cardholderNameInput.setAttribute('required', 'required');
            } else if (selected === "vodafone_cash") {
                vodafoneCashFieldsDiv.style.display = "block";
                activeMobileNumberInput = vodafoneCashFieldsDiv.querySelector('#mobileNumber');
                if (activeMobileNumberInput) activeMobileNumberInput.setAttribute('required', 'required');
            } else if (selected === "orange_money") {
                orangeMoneyFieldsDiv.style.display = "block";
                activeMobileNumberInput = orangeMoneyFieldsDiv.querySelector('#mobileNumber');
                if (activeMobileNumberInput) activeMobileNumberInput.setAttribute('required', 'required');
            } else if (selected === "etisalat_cash") {
                etisalatCashFieldsDiv.style.display = "block";
                activeMobileNumberInput = etisalatCashFieldsDiv.querySelector('#mobileNumber');
                if (activeMobileNumberInput) activeMobileNumberInput.setAttribute('required', 'required');
            }
            clearErrors(); // Clear errors when payment method changes
        });

        // Trigger initial visibility on page load
        paymentMethodSelect.dispatchEvent(new Event("change"));
    }

    // --- Form Submission and Validation ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors(); // Clear previous errors on new submission attempt

        let isValid = true; // Flag for overall form validity

        // 1. Validate payment method selection
        if (!paymentMethodSelect.value) {
            displayError(paymentMethodSelect, 'Please select a payment method.');
            isValid = false;
        }

        // 2. Conditional validation based on selected method
        const selectedMethod = paymentMethodSelect.value;
        const data = {
            clientId: form.querySelector('input[name="clientId"]').value,
            planId: form.querySelector('input[name="planId"]').value,
            amount: form.querySelector('input[name="amount"]').value,
            currency: form.querySelector('input[name="currency"]').value,
            sessionLimit: form.querySelector('input[name="sessionLimit"]').value,
            paymentMethod: selectedMethod,
        };

        if (selectedMethod === "card") {
            const cardNumber = cardNumberInput.value.replace(/\s/g, ''); // Remove spaces for validation
            const expirationDate = expirationDateInput.value.trim();
            const cvv = cvvInput.value.trim();
            const cardholderName = cardholderNameInput.value.trim();

            if (!cardNumber) {
                displayError(cardNumberInput, 'Card number is required.');
                isValid = false;
            } else if (!/^\d{13,19}$/.test(cardNumber)) { // Basic check for 13-19 digits
                displayError(cardNumberInput, 'Please enter a valid card number (13-19 digits).');
                isValid = false;
            }

            const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
            if (!expirationDate) {
                displayError(expirationDateInput, 'Expiration date is required.');
                isValid = false;
            } else if (!expiryRegex.test(expirationDate)) {
                displayError(expirationDateInput, 'Invalid format (MM/YY).');
                isValid = false;
            } else {
                const [month, year] = expirationDate.split('/').map(Number);
                const currentYear = new Date().getFullYear() % 100; // Get last two digits of current year
                const currentMonth = new Date().getMonth() + 1; // Month is 0-indexed

                if (year < currentYear || (year === currentYear && month < currentMonth)) {
                    displayError(expirationDateInput, 'Card has expired.');
                    isValid = false;
                }
            }

            if (!cvv) {
                displayError(cvvInput, 'CVV is required.');
                isValid = false;
            } else if (!/^\d{3,4}$/.test(cvv)) { // 3 or 4 digits
                displayError(cvvInput, 'Invalid CVV (3 or 4 digits).');
                isValid = false;
            }

            if (!cardholderName) {
                displayError(cardholderNameInput, 'Cardholder name is required.');
                isValid = false;
            }

            // Add to data if valid
            data.cardNumber = cardNumber;
            data.expirationDate = expirationDate;
            data.cvv = cvv;
            data.cardholderName = cardholderName;

        } else if (['vodafone_cash', 'orange_money', 'etisalat_cash'].includes(selectedMethod)) {
            const mobileNumber = activeMobileNumberInput ? activeMobileNumberInput.value.trim() : '';
            if (!mobileNumber) {
                displayError(activeMobileNumberInput, 'Mobile number is required.');
                isValid = false;
            } else if (!/^01[0-9]{9}$/.test(mobileNumber)) { // Basic Egyptian mobile number regex (01 followed by 9 digits)
                displayError(activeMobileNumberInput, 'Please enter a valid 11-digit Egyptian mobile number.');
                isValid = false;
            }
            data.mobileNumber = mobileNumber; // Add to data if valid
        }

        // Stop submission if any client-side validation failed
        if (!isValid) {
            return;
        }

        // --- If validation passes, proceed with API call ---
        submitButton.disabled = true;
        submitButton.innerHTML = 'Processing... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        resultMessageDiv.style.display = 'none'; // Hide previous messages

        try {
            const res = await fetch("/api/subscriptions/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                let errorMsg = result.message || "Payment failed. Please try again.";
                if (errorMsg === "You are already subscribed to this plan." || errorMsg === "Failed to create subscription and payment") {
                    errorMsg = "You already have an active subscription. Please cancel it before subscribing to another plan.";
                }
                resultMessageDiv.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            } else {
                // Payment success logic
                resultMessageDiv.innerHTML = `<div class="alert alert-success">Payment successful! Redirecting...</div>`;
                // Only redirect on successful payment
                window.location.href = `/api/subscriptions/payment?subscriptionId=${result.data.subscriptionId}`;
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            resultMessageDiv.innerHTML = `<div class="alert alert-danger">An unexpected error occurred. Please try again later.</div>`;
        } finally {
            // Re-enable button and remove spinner after attempt (unless redirected)
            submitButton.disabled = false;
            submitButton.innerHTML = `Pay Now (${form.querySelector('input[name="amount"]').value} ${form.querySelector('input[name="currency"]').value})`;
            resultMessageDiv.style.display = 'block'; // Show result message
        }
    });
});