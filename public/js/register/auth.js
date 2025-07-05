document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");
  const clientSection = document.getElementById("clientSection");
  const therapistSection = document.getElementById("therapistSection");
  const roleRadios = document.querySelectorAll('input[name="role"]');
  const submitBtn = document.getElementById("submitBtn");
  const successMessage = document.getElementById("successMessage");

  // Toggle between client and therapist sections
  roleRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "client") {
        clientSection.classList.add("active");
        therapistSection.classList.remove("active");
        // Clear file input value when switching to client
        if (form.applicationFile) {
          form.applicationFile.value = "";
          displayError("applicationFileError", ""); // Clear file error
        }
      } else {
        clientSection.classList.remove("active");
        therapistSection.classList.add("active");
      }
    });
  });

  const applicationFileInput = document.getElementById("applicationFile");
  const customFileUploadLabel = document.getElementById(
    "customFileUploadLabel"
  );
  const fileUploadText = document.getElementById("fileUploadText");
  const clientRoleRadio = document.getElementById("clientRole");
  const therapistRoleRadio = document.getElementById("therapistRole");

  applicationFileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
      fileUploadText.textContent = this.files[0].name;
      customFileUploadLabel.classList.add("has-file");
    } else {
      fileUploadText.textContent = "Choose File";
      customFileUploadLabel.classList.remove("has-file");
    }
  });

  // Ensure the file input label resets when switching to client role
  clientRoleRadio.addEventListener("change", function () {
    if (this.checked) {
      applicationFileInput.value = ""; // Clear the file input
      fileUploadText.textContent = "Choose File"; // Reset the label text
      customFileUploadLabel.classList.remove("has-file"); // Remove the has-file class
    }
  });

  // This makes sure the correct label state is applied on initial load if therapist role is active
  therapistRoleRadio.addEventListener("change", function () {
    if (this.checked && applicationFileInput.files.length > 0) {
      fileUploadText.textContent = applicationFileInput.files[0].name;
      customFileUploadLabel.classList.add("has-file");
    } else if (this.checked) {
      fileUploadText.textContent = "Choose File"; // Ensure it's reset if no file on therapist switch
      customFileUploadLabel.classList.remove("has-file");
    }
  });

  // Initialize label text if a file was previously selected (e.g., on server-side re-render with errors)
  if (applicationFileInput.files.length > 0) {
    fileUploadText.textContent = applicationFileInput.files[0].name;
    customFileUploadLabel.classList.add("has-file");
  }

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // --- IMPORTANT CHANGE: Use FormData for file uploads ---
    const formData = new FormData(form); // Automatically collects all form fields including files

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";

    try {
      const response = await registerUser(formData); // Send FormData directly

      // Show success message
      successMessage.style.display = "block";
      form.style.display = "none";

      // Store tokens and user data if needed for client-side routing
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Let's adjust assuming the controller *will* send a redirect URL in JSON for client-side handling:
      if (response.redirectUrl) {
        setTimeout(() => {
          window.location.href = response.redirectUrl;
        }, 2000);
      } else {
        // Fallback or just show success message if no redirect is provided
        console.log(
          "Registration successful, no specific redirect URL provided."
        );
      }
    } catch (error) {
      console.error("Registration failed:", error);
      displayError(
        "formError",
        error.message || "Registration failed. Please try again."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register";
    }
  });

  // Form validation
  function validateForm() {
    let isValid = true;
    let errors = {}; // Collect all errors

    // Common fields validation
    if (!form.name.value.trim()) {
      errors.nameError = "Full Name is required.";
      isValid = false;
    }
    if (!form.email.value.trim()) {
      errors.emailError = "Email is required.";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.value)) {
      errors.emailError = "Please enter a valid email.";
      isValid = false;
    }

    if (!form.password.value) {
      errors.passwordError = "Password is required.";
      isValid = false;
    } else if (form.password.value.length < 8) {
      errors.passwordError = "Password must be at least 8 characters.";
      isValid = false;
    }

    if (!form.confirmPassword.value.trim()) {
      // Check for emptiness first
      errors.confirmPasswordError = "Confirm password cannot be empty.";
      isValid = false;
    } else if (form.password.value !== form.confirmPassword.value) {
      // Only check for match if confirmPassword is not empty
      errors.confirmPasswordError = "Passwords do not match.";
      isValid = false;
    }

    // Date of Birth validation (add this section)
    if (!form.dateOfBirth.value.trim()) {
      errors.dateOfBirthError = "Date of Birth is required.";
      isValid = false;
    }

    if (!form.gender.value) {
      // No need for .trim() as select values usually don't have leading/trailing spaces
      errors.genderError = "Please select your gender.";
      isValid = false;
    }

    // Role-specific validation
    const role = document.querySelector('input[name="role"]:checked').value;

    if (role === "client") {
      if (!form.therapy_goals.value.trim()) {
        errors.therapyGoalsError = "Therapy goals are required.";
        isValid = false;
      }
      if (!form.preferred_therapy_type.value) {
        errors.therapyTypeError = "Please select a therapy type.";
        isValid = false;
      }
    } else {
      // Therapist
      if (!form.license_number.value.trim()) {
        errors.licenseNumberError = "License number is required.";
        isValid = false;
      }
      if (!form.specialization.value.trim()) {
        errors.specializationError = "Specialization is required.";
        isValid = false;
      }

      if (!form.experience_years.value.trim()) {
        errors.experienceYearsError = "Years of Experience is required."; // <-- CHANGED KEY HERE
        isValid = false;
      } else if (
        isNaN(form.experience_years.value) ||
        parseInt(form.experience_years.value) < 0
      ) {
        errors.experienceYearsError =
          "Please enter a valid number for Years of Experience.";
        isValid = false;
      }
      if (!form.bio.value.trim()) {
        errors.bioError = "Bio is required."; // <-- CHANGED KEY HERE
        isValid = false;
      }
      // Validate file input
      const applicationFile = form.applicationFile.files[0];
      if (!applicationFile) {
        errors.applicationFileError =
          "An application file (License/CV) is required.";
        isValid = false;
      } else {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowedTypes.includes(applicationFile.type)) {
          errors.applicationFileError =
            "Only PDF, JPG, or PNG files are allowed.";
          isValid = false;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (applicationFile.size > maxSize) {
          errors.applicationFileError = "File size must not exceed 5MB.";
          isValid = false;
        }
      }
    }

    // Display all collected errors
    for (const errorId in errors) {
      displayError(errorId, errors[errorId]);
    }

    return isValid;
  }

  // Helper functions
  function displayError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".error");
    errorElements.forEach((element) => {
      element.textContent = "";
    });
  }

  // API call (IMPORTANT: Remove 'Content-Type' header for FormData)
  async function registerUser(formData) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        // DO NOT set 'Content-Type': 'multipart/form-data' explicitly.
        // The browser sets the correct 'Content-Type' header automatically
        // when you send a FormData object, including the necessary boundary.
        body: formData, // Send FormData directly
      });

      // Handle server-side errors
      if (!response.ok) {
        const errorData = await response.json(); // Assuming server sends JSON errors
        throw new Error(errorData.error || "Registration failed");
      }

      // Assuming a successful response also sends JSON, potentially with a redirect URL
      const data = await response.json();
      return data;
    } catch (error) {
      throw error; // Re-throw to be caught by the outer try-catch
    }
  }

  // Initialize the correct section on page load if role is set by controller
  const initialRole = document.querySelector(
    'input[name="role"]:checked'
  ).value;
  if (initialRole === "therapist") {
    therapistSection.classList.add("active");
    clientSection.classList.remove("active");
  } else {
    clientSection.classList.add("active");
    therapistSection.classList.remove("active");
  }
});
