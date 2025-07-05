document.addEventListener("DOMContentLoaded", function () {
  // Show/hide card fields based on payment method selection
  const paymentMethod = document.getElementById("payment-method");
  const cardFields = document.getElementById("card-fields");
  const vodafoneFields = document.getElementById("vodafone-cash-fields");
  const orangeFields = document.getElementById("orange-money-fields");
  const etisalatFields = document.getElementById("etisalat-cash-fields");

  const cardNumberInput = document.getElementById("cardNumber");
  const expiryDateInput = document.getElementById("expirationDate");
  const cvvInput = document.getElementById("cvv");
  const mobileNumberInput = document.getElementById("mobileNumber");
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim(); // Add space after every 4 digits
      e.target.value = value;
      // Limit to max 19 chars (16 digits + 3 spaces)
      if (value.length > 19) {
        e.target.value = value.substring(0, 19);
      }
    });
  }

  // Format expiry date as MM/YY
  if (expiryDateInput) {
    expiryDateInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
      if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
      // Limit to max 5 chars (MM/YY)
      if (value.length > 5) {
        e.target.value = value.substring(0, 5);
      }
    });
  }

  // CVV input: limit to 3 or 4 digits
  if (cvvInput) {
    cvvInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
      e.target.value = value.substring(0, 4); // Max 4 digits
    });
  }

  // Mobile Number: limit to 11 digits (for Egypt) and allow only digits
  if (mobileNumberInput) {
    mobileNumberInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
      e.target.value = value.substring(0, 11); // Max 11 digits for Egyptian numbers
    });
  }

  paymentMethod.addEventListener("change", function () {
    // Hide all by default
    cardFields.style.display = "none";
    vodafoneFields.style.display = "none";
    orangeFields.style.display = "none";
    etisalatFields.style.display = "none";

    // Clear required attributes
    [cardFields, vodafoneFields, orangeFields, etisalatFields].forEach(
      (fieldSet) => {
        const inputs = fieldSet.querySelectorAll("input");
        inputs.forEach((input) => (input.required = false));
      }
    );

    // Show the selected one
    if (paymentMethod.value === "card") {
      cardFields.style.display = "block";
      cardFields
        .querySelectorAll("input")
        .forEach((input) => (input.required = true));
    } else if (paymentMethod.value === "vodafone_cash") {
      vodafoneFields.style.display = "block";
      vodafoneFields
        .querySelectorAll("input")
        .forEach((input) => (input.required = true));
    } else if (paymentMethod.value === "orange_money") {
      orangeFields.style.display = "block";
      orangeFields
        .querySelectorAll("input")
        .forEach((input) => (input.required = true));
    } else if (paymentMethod.value === "etisalat_cash") {
      etisalatFields.style.display = "block";
      etisalatFields
        .querySelectorAll("input")
        .forEach((input) => (input.required = true));
    }
  });

  // Format card number input
  document
    .querySelector('input[name="cardNumber"]')
    ?.addEventListener("input", function (e) {
      this.value = this.value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim();
    });

  // Format expiration date input
  document
    .querySelector('input[name="expirationDate"]')
    ?.addEventListener("input", function (e) {
      this.value = this.value
        .replace(/\D/g, "")
        .replace(/^(\d{2})/, "$1/")
        .substring(0, 5);
    });

  document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Add confirmation prompt
    const confirmed = confirm("Are you sure you want to proceed with the payment?");
    if (!confirmed) {
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span> Processing...";

    const formData = new FormData(e.target);
    const paymentData = {
      client_id: formData.get("client_id"),
      therapist_id: formData.get("therapist_id"),
      appointment_id: formData.get("appointment_id"),
      amount: formData.get("amount"),
      payment_method: formData.get("payment_method"),
      payment_details: {}
    };

    // Add payment method specific details
    switch (paymentData.payment_method) {
      case "card":
        paymentData.payment_details = {
          card_number: document.getElementById("cardNumber").value,
          expiration_date: document.getElementById("expirationDate").value,
          cvv: document.getElementById("cvv").value,
          cardholder_name: document.getElementById("cardholderName").value
        };
        break;
      case "vodafone_cash":
      case "orange_money":
      case "etisalat_cash":
        paymentData.payment_details = {
          mobile_number: document.getElementById("mobileNumber").value
        };
        break;
    }

    try {
      const response = await fetch("/api/appointment/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      // Check if the response is HTML (redirect to login)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        window.location.href = "/api/auth/login";
        return;
      }

      const result = await response.json();

      if (result.success) {
        showToast("Payment processed successfully!");
        setTimeout(() => {
          window.location.href = result.redirect || "/appointments/management/client";
        }, 2000);
      } else {
        showToast(result.message || "Payment failed. Please try again.", true);
        submitBtn.disabled = false;
        submitBtn.textContent = "Pay Now";
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast("An error occurred. Please try again.", true);
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay Now";
    }
  });

  function validateCardDetails(data) {
    // Simple validation - you might want to use a library like credit-card-validator
    const cardNumber = data.card_number.replace(/\s/g, "");
    const expiry = data.card_expiry.split("/");

    if (cardNumber.length < 13 || cardNumber.length > 19) return false;
    if (
      expiry.length !== 2 ||
      expiry[0] > 12 ||
      expiry[1] < new Date().getFullYear() % 100
    )
      return false;
    if (data.card_cvv.length < 3 || data.card_cvv.length > 4) return false;
    if (!data.card_name.trim()) return false;

    return true;
  }

  // Toast function (only called when needed)
  function showToast(message, isError = false) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) {
      console.error("Toast element not found");
      return;
    }

    const toastBody = toastEl.querySelector('.toast-body');
    toastEl.classList.remove('bg-success', 'bg-danger');
    toastEl.classList.add(isError ? 'bg-danger' : 'bg-success');
    toastEl.classList.toggle('text-white', isError);
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }
});