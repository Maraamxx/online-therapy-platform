// controllers/user.controller.js
const UserService = require("../services/user.service");
const { AppError, ValidationError } = require("../services/user.service"); // Import specific error classes

const userController = {
  // --- API Endpoint for fetching profile data (JSON) ---
  getProfile: async (req, res, next) => {
    try {
      console.log("✅ Request User for API Profile:", req.user);
      const userId = req.user.userId;
      const roles = req.user.roles;
      const userProfile = await UserService.getProfile(userId, roles);

      res.json(userProfile);
    } catch (error) {
      console.error("❌ Profile Fetch Error (API):", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  },

  // --- Dashboard Page Renderer ---
  showDashboardPage: async (req, res, next) => {
    try {
      console.log("🔍 Debug - User session:", req.user);

      if (!req.user || !req.user.userId) {
        console.error("❌ No user session found");
        return res.status(401).render('error', {
          title: 'Authentication Error',
          message: 'Please log in to view your dashboard',
          details: process.env.NODE_ENV === 'development' ? 'No valid user session found' : null
        });
      }

      const userId = req.user.userId;
      const roles = req.user.roles;

      console.log("🔍 Debug - Fetching dashboard data for userId:", userId, "roles:", roles);

      const userProfile = await UserService.getProfile(userId, roles);

      console.log("✅ Dashboard data retrieved successfully");

      // Render different dashboard based on user role
      if (roles.includes('therapist')) {
        res.render('user/therapist-dashboard', {
          user: userProfile,
          title: 'Therapist Dashboard'
        });
      } else if (roles.includes('client')) {
        res.render('user/client-dashboard', {
          user: userProfile,
          title: 'Client Dashboard'
        });
      } else {
        res.render('user/dashboard', {
          user: userProfile,
          title: 'Dashboard'
        });
      }

    } catch (error) {
      console.error("❌ Dashboard Page Render Error:", error);
      console.error("Error stack:", error.stack);

      if (error instanceof AppError) {
        return res.status(error.statusCode).render('error', {
          title: 'Error',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : null
        });
      }

      // Handle database connection errors specifically
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).render('error', {
          title: 'Service Unavailable',
          message: 'Unable to connect to the database. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.stack : null
        });
      }

      next(error);
    }
  },

  // --- EJS Renderer for the Profile Page ---
  showProfilePage: async (req, res, next) => {
    try {
      console.log("🔍 Debug - User session:", req.user);

      if (!req.user || !req.user.userId) {
        console.error("❌ No user session found");
        return res.status(401).render('error', {
          title: 'Authentication Error',
          message: 'Please log in to view your profile',
          details: process.env.NODE_ENV === 'development' ? 'No valid user session found' : null
        });
      }

      const userId = req.user.userId;
      const roles = req.user.roles;

      console.log("🔍 Debug - Fetching profile for userId:", userId, "roles:", roles);

      const userProfile = await UserService.getProfile(userId, roles);

      console.log("✅ Profile data retrieved successfully");

      res.render('user/profile', {
        user: userProfile,
        title: `${userProfile.name}'s Profile`
      });

    } catch (error) {
      console.error("❌ Profile Page Render Error:", error);
      console.error("Error stack:", error.stack);

      if (error instanceof AppError) {
        return res.status(error.statusCode).render('error', {
          title: 'Error',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : null
        });
      }

      // Handle database connection errors specifically
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).render('error', {
          title: 'Service Unavailable',
          message: 'Unable to connect to the database. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.stack : null
        });
      }

      next(error);
    }
  },
showEditProfilePage: async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const roles = req.user.roles;
            const userProfile = await UserService.getProfile(userId, roles);

            res.render('user/edit-profile', {
                user: userProfile,
                title: 'Edit My Profile'
            });

        } catch (error) {
            console.error("❌ Edit Profile Page Render Error:", error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).render('error', {
                    title: 'Error',
                    message: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : null
                });
            }
            next(error);
        }
    },
  // --- Update Profile (API Endpoint) ---
  updateProfile: async (req, res, next) => {
    try {
      const { userId, roles } = req.user;
      const updateData = req.body;

      const updatedProfile = await UserService.updateProfile(
        userId,
        roles,
        updateData
      );

      res.json({
        message: "Profile updated successfully!",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("❌ Profile Update Error:", error.message);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  },

  // --- Update Email (API Endpoint) ---
  updateEmail: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { email } = req.body;

      // Client-side validation is good, but server-side is essential too.
      // UserService already has validation, so this might be redundant here,
      // but good to keep as a quick fail-fast for bad input.
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address." });
      }

      const result = await UserService.updateEmail(userId, email);
      res.json({
        message: "Email updated successfully. A verification link has been sent to your new email address. Please check your inbox.",
        data: { email: result.email }, // Only return the email, not the token
      });
    } catch (error) {
      console.error("❌ Email Update Error:", error.message);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  },

  // --- Verify Email (API Endpoint) ---
  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.body; // Assuming token is sent in body for POST. If GET, it's req.query.token
      await UserService.verifyEmail(token);
      res.json({ message: "Email verified successfully!" });
    } catch (error) {
      console.error("❌ Email Verification Error:", error.message);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  },

  // --- Update Password (API Endpoint) ---
  updatePassword: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { currentPassword, newPassword } = req.body;

      // Server-side validation for passwords
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required." });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long." });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ error: "New password cannot be the same as your current password." });
      }

      await UserService.updatePassword(userId, currentPassword, newPassword);
      res.json({ message: "Password updated successfully!" });
    } catch (error) {
      console.error("❌ Password Update Error:", error.message);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  },

  // --- Upload Profile Picture (API Endpoint) ---
  uploadProfilePicture: async (req, res, next) => {
    try {
      // Multer error handling (e.g., file type, size limits) is usually done via middleware `upload.single('profile_picture')`
      // and errors are caught by express-async-handler or a custom error handler.
      // If Multer itself catches an error, it might pass it to `next(err)`.

      if (!req.file) {
        // This case should ideally be caught by Multer's fileFilter or size limits
        // but good as a fallback.
        return res.status(400).json({ error: "No image file was uploaded. Please select a picture." });
      }

      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized: User session invalid. Please log in again." });
      }

      const { userId } = req.user;
      const uploadedFilePath = await UserService.uploadAndSaveProfilePicture(userId, req.file);

      res.status(200).json({
        message: "Profile picture uploaded successfully!",
        filePath: uploadedFilePath,
      });

    } catch (error) {
      console.error("❌ Profile Picture Upload Controller Error:", error.message);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      // Specific Multer errors can be handled here if you want to differentiate
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum 5MB allowed.' });
      }
      if (error.message === 'Invalid file type. Only image files are allowed.') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },
};

module.exports = userController;