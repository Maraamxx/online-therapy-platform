const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Register a new user
router.get("/register", authController.showRegistrationForm);
router.post("/register", authController.register);

// Login user
router.get("/login", authController.showLoginForm);
router.post("/login", authController.login);

// NEW: Admin Login Page (GET request to render the form)
router.get("/admin/login", authController.showAdminLoginForm);
// Admin Login Route (no authMiddleware needed here, it's the entry point)
router.post("/admin/login", authController.adminLogin);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

// Logout user
router.post("/logout", authController.logout);

// Forgot password routes
router.get("/forgot-password", authController.showForgotPasswordRequestForm);
router.post("/request-password-reset", authController.requestPasswordReset);
router.get("/reset-password/:token", authController.showResetPasswordForm);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;