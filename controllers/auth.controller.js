// controllers/auth.controller.js
const AuthService = require("../services/auth.service");
const upload = require("../middlewares/upload"); // Import the upload middleware
const path = require("path");

// Define a comprehensive list of therapist specializations
const therapistSpecializations = [
  "Addiction Counseling",
  "Adolescent Therapy",
  "Anxiety Disorders",
  "Attachment-Based Therapy",
  "Behavioral Therapy (CBT, DBT)",
  "Bereavement & Grief Counseling",
  "Child & Play Therapy",
  "Cognitive Behavioral Therapy (CBT)",
  "Couples Counseling",
  "Depression",
  "Dialectical Behavior Therapy (DBT)",
  "Eating Disorders",
  "EMDR (Eye Movement Desensitization and Reprocessing)",
  "Family Therapy",
  "Gender Identity & Transition",
  "Grief and Loss",
  "Infertility Counseling",
  "LGBTQ+ Affirmative Therapy",
  "Mindfulness-Based Stress Reduction (MBSR)",
  "Neurofeedback",
  "Obsessive-Compulsive Disorder (OCD)",
  "Parenting Support",
  "Personality Disorders",
  "Post-Traumatic Stress Disorder (PTSD)",
  "Relationship Issues",
  "Schema Therapy",
  "Sex Therapy",
  "Sleep Disorders",
  "Somatic Experiencing",
  "Stress Management",
  "Trauma Therapy",
];

const authController = {
  showRegistrationForm: (req, res) => {
    res.render("register/signup", {
      title: "Register",
      role: req.query.role || "client",
      errors: null,
      formData: null,
      specializations: therapistSpecializations, // Pass specializations to the view
    });
  },

  register: async (req, res) => {
    upload.single("applicationFile")(req, res, async (err) => {
      // Collect all form data for re-rendering on error
      const formData = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber, // NEW: Include phone number
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        role: req.body.role || "client",
        license_number: req.body.license_number,
        specialization: req.body.specialization,
        experience_years: req.body.experience_years,
        bio: req.body.bio,
        therapy_goals: req.body.therapy_goals,
        preferred_therapy_type: req.body.preferred_therapy_type,
        // Do NOT include password or confirmPassword in formData to prevent exposing them
      };

      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({
          success: false,
          error: err.message || "File upload failed.",
          formData: formData,
        });
      }

      const {
        name,
        email,
        phoneNumber, // NEW
        password,
        confirmPassword,
        dateOfBirth,
        gender,
        role,
      } = req.body;

      let applicationLink = null;
      if (req.file) {
        applicationLink = `/uploads/applications/${req.file.filename}`;
      }

      let additionalData = {};
      if (role === "therapist") {
        additionalData = {
          license_number: req.body.license_number,
          specialization: req.body.specialization,
          experience_years: parseInt(req.body.experience_years),
          bio: req.body.bio,
          is_verified: req.body.is_verified === "on",
          application_link: applicationLink,
        };
      } else {
        additionalData = {
          therapy_goals: req.body.therapy_goals,
          preferred_therapy_type: req.body.preferred_therapy_type,
        };
      }

      try {
        const result = await AuthService.registerUser({
          name,
          email,
          phoneNumber, // NEW
          password,
          confirmPassword, // Pass confirmPassword for service-side validation
          dateOfBirth,
          gender,
          role,
          additionalData,
        });

        req.session.user = {
          userId: result.user.userId,
          email: result.user.email,
          name: result.user.name,
          roles: result.user.roles || [role], // Use result.user.roles for consistency
          hasCompletedAssessment: result.user.hasCompletedAssessment,
        };

        req.session.accessToken = result.accessToken;
        req.session.refreshToken = result.refreshToken;

        let redirectPath;
        if (role === "therapist") {
          redirectPath = "/api/therapist/application-pending";
        } else if (role === "client") {
          // For new client registrations, they are always considered to not have completed the assessment
          redirectPath = "/api/assessment";
        } else {
          redirectPath = "/api/auth/login";
        }

        return res.status(200).json({
          success: true,
          message: "Registration successful!",
          redirectUrl: redirectPath,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        });
      } catch (error) {
        console.error("Error during registration:", error);
        // Use a more specific error message based on common error types
        let userMessage = "Registration failed. Please check your inputs.";
        if (error.message.includes("Email already")) {
          userMessage = error.message; // "Email already registered. Please use a different one."
        } else if (error.message.includes("Password must be")) {
          userMessage = error.message; // "Password must be at least 8 characters..."
        } else if (error.message.includes("Passwords do not match")) {
          userMessage = error.message;
        } else if (error.message.includes("valid email address")) {
          userMessage = error.message;
        } else if (error.message.includes("Phone number already")) {
          // NEW
          userMessage = error.message;
        } else if (error.message.includes("valid phone number")) {
          // NEW
          userMessage = error.message;
        } else if (error.message.includes("at least 18 years old")) {
          // NEW
          userMessage = error.message;
        } else if (error.message.includes("required for therapists")) {
          userMessage = error.message;
        } else if (error.message.includes("application file is required")) {
          userMessage = error.message;
        } else if (error.message.includes("invalid role")) {
          userMessage = "Invalid user role specified.";
        }
        // For unexpected database errors, you might still show a generic message
        // or log the full error for debugging without exposing it to the user.

        return res.status(400).json({
          success: false,
          error: userMessage, // Display user-friendly message
          formData: formData, // Return form data to repopulate fields
        });
      }
    });
  },

  showLoginForm: (req, res) => {
    const error = req.session.loginError;
    const email = req.session.loginEmail;
    delete req.session.loginError; // Clear error after displaying
    delete req.session.loginEmail; // Clear email after displaying
    const message = req.session.message; // For reset password success message
    delete req.session.message;

    res.render("register/login", {
      title: "Login",
      error: error,
      email: email,
      message: message, // Pass the success message
    });
  },

  // UPDATED: Function to render the Admin Login Page
  showAdminLoginForm: (req, res) => {
    const error = req.session.adminLoginError;
    const email = req.session.adminLoginEmail;
    delete req.session.adminLoginError; // Clear error after displaying
    delete req.session.adminLoginEmail; // Clear email after displaying

    res.render("register/admin-login", {
      title: "Admin Login",
      error: error,
      email: email,
      currentPage: "admin-login", // Add this line to define currentPage
    });
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        throw new Error("Email and password are required for login.");
      }

      const { accessToken, refreshToken, user } = await AuthService.loginUser(email, password);

      req.session.user = {
        userId: user.userId,
        email: user.email,
        name: user.name,
        roles: user.roles,
        hasCompletedAssessment: user.hasCompletedAssessment,
        therapistStatus: user.therapistStatus, // Store therapist status in session
        matchedTherapistId: user.matchedTherapistId, // Store matched therapist ID in session
      };

      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;

      console.log(`[AuthController.login] User ${user.email} logged in. Roles: ${user.roles.join(', ')}, Has Assessment: ${user.hasCompletedAssessment}`);

      let redirectPath;
      if (user.roles.includes("therapist")) {
        // Check the therapist's status for redirection
        if (user.therapistStatus === "Approved") {
          redirectPath = "/api/user/dashboard"; // Or whatever the therapist's main dashboard is
        } else if (user.therapistStatus === "Pending Approval") {
          redirectPath = "/api/therapist/application-pending"; // Redirect to pending page
        } else {
          // Rejected or Suspended
          // You might want a specific page for rejected/suspended or just redirect to login with error
          req.session.loginError = `Your therapist account status is: ${user.therapistStatus}. Please contact support.`;
          redirectPath = "/api/auth/login";
        }
      } else if (user.roles.includes("client")) {
        // Client specific redirection
        if (user.hasCompletedAssessment === false) { // Strict comparison is important
          console.log(`[AuthController.login] Client ${user.email} needs to complete assessment. Redirecting to /api/assessment.`);
          redirectPath = "/api/assessment";
        } else if (user.hasCompletedAssessment === true) {
          // If client has completed assessment, check for matched therapist
          if (user.matchedTherapistId) {
            console.log(`[AuthController.login] Client ${user.email} has completed assessment and is matched. Redirecting to therapist profile.`);
            redirectPath = `/api/therapists/${user.matchedTherapistId}`;
          } else {
            console.log(`[AuthController.login] Client ${user.email} has completed assessment but no specific match found (matchedTherapistId is null). Redirecting to general therapists.`);
            redirectPath = "/api/therapists"; // General therapists browse page
          }
        } else {
            // Fallback for unexpected hasCompletedAssessment value (though should be boolean)
            console.warn(`[AuthController.login] Unexpected hasCompletedAssessment value for client ${user.email}: ${user.hasCompletedAssessment}. Redirecting to default client path.`);
            redirectPath = "/api/therapists"; // Default client path
        }
      } else {
        redirectPath = "/"; // Default for other roles or general users (e.g., admin if not handled by adminLogin)
        console.log(`[AuthController.login] User ${user.email} is not a client or therapist. Redirecting to default: ${redirectPath}`);
      }

      // For API calls, return JSON; for page renders, use redirect
      // Assuming this controller is used for server-rendered pages where redirect is preferred
      return res.redirect(redirectPath);
    } catch (error) {
      console.error("Error during login:", error);
      req.session.loginError = error.message; // Store the specific error message
      req.session.loginEmail = email; // Keep email pre-filled
      return res.redirect("/api/auth/login"); // Redirect back to login page
    }
  },
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const { token, user } = await AuthService.adminLogin(email, password);

      // For web applications using sessions, you might set a session here
      if (req.session) {
        req.session.user = {
          userId: user.userId,
          email: user.email,
          roles: user.roles,
          // Add any other necessary session data
        };
        // Redirect admin to their dashboard after successful login
        return res.redirect("/api/admin/dashboard"); // Assuming you'll have an admin dashboard route
      }

      // If not using sessions or for pure API response
      res.status(200).json({ message: "Admin login successful", token, user });
    } catch (error) {
      console.error("❌ Admin Login Error:", error.message);
      req.session.adminLoginError = error.message; // Store error for rendering
      req.session.adminLoginEmail = req.body.email; // Keep email pre-filled
      return res.redirect("/api/auth/admin/login"); // Redirect back to admin login page
    }
  },
  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.session.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(403).json({ error: "Refresh token required." });
      }

      const result = await AuthService.refreshToken(refreshToken);

      req.session.accessToken = result.accessToken;
      req.session.refreshToken = result.refreshToken;

      res.json(result);
    } catch (error) {
      console.error("❌ Refresh Token Error:", error.message);
      res
        .status(403)
        .json({ error: error.message || "Invalid refresh token." });
    }
  },

  logout: async (req, res) => {
    try {
      const refreshToken = req.session.refreshToken;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("❌ Session destruction error:", err);
          return res.status(500).redirect("/");
        }

        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    } catch (error) {
      console.error("❌ Logout Error:", error.message);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    }
  },
  showForgotPasswordRequestForm: (req, res) => {
    res.render("register/forgot-password-request", {
      title: "Forgot Password",
      error: null,
      message: null,
    });
  },

  requestPasswordReset: async (req, res) => {
    const { email } = req.body;
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }
      await AuthService.requestPasswordReset(email);
      res.render("register/forgot-password-request", {
        title: "Forgot Password",
        error: null,
        message:
          "If an account with that email exists, a password reset link has been sent to your inbox. Please check your email.",
      });
    } catch (error) {
      console.error("Error in requestPasswordReset controller:", error);
      res.render("register/forgot-password-request", {
        title: "Forgot Password",
        error: error.message || "Something went wrong. Please try again.",
        message: null,
      });
    }
  },

  showResetPasswordForm: async (req, res) => {
    const { token } = req.params;
    try {
      const tokenRecord = await AuthService.verifyPasswordResetToken(token);
      if (!tokenRecord) {
        return res.render("register/reset-password", {
          title: "Reset Password",
          error: "Invalid or expired reset link.",
          token: null,
          message: null,
        });
      }

      res.render("register/reset-password", {
        title: "Reset Password",
        error: null,
        token: token,
        message: null,
      });
    } catch (error) {
      console.error("Error showing reset password form:", error);
      res.render("register/reset-password", {
        title: "Reset Password",
        error: "Invalid or expired reset link.",
        token: null,
        message: null,
      });
    }
  },

  resetPassword: async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      // Password strength validation is now handled in AuthService.resetPassword
      await AuthService.resetPassword(token, newPassword);
      req.session.message =
        "Your password has been successfully reset. Please log in.";
      return res.redirect("/api/auth/login");
    } catch (error) {
      console.error("Error in resetPassword controller:", error);
      return res.render("register/reset-password", {
        title: "Reset Password",
        error: error.message || "Failed to reset password. Please try again.",
        token: token,
        message: null,
      });
    }
  },
};

module.exports = authController;