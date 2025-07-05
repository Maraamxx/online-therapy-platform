// services/user.service.js
const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/database"); // Make sure this is imported if used directly
const EmailService = require("../utils/email.service"); // Import the new email service
const saltRounds = 10;

// Custom Error Classes for more granular error handling (NO CHANGES, kept for reference)
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Invalid input provided.", details = {}) {
    super(message, 400);
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "You are not authorized to perform this action.") {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = "A conflict occurred with the existing data.") {
    super(message, 409);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed. Please check your credentials.") {
    super(message, 401);
  }
}


class UserService {
  static formatUserProfile(rows) {
    if (!rows || rows.length === 0) return null;

    const baseUser = {
      user_id: rows[0].user_id,
      name: rows[0].name || null,
      email: rows[0].email || null,
      phone_number: rows[0].phone_number || null,
      date_of_birth: rows[0].date_of_birth
        ? new Date(rows[0].date_of_birth).toISOString().split('T')[0]
        : null,
      profile_picture: rows[0].profile_picture || null,
      is_active: Boolean(rows[0].is_active),
      roles: [...new Set(rows.map((row) => row.role_name).filter(Boolean))] || []
    };

    if (baseUser.roles.includes('therapist') && rows[0].therapist_id) {
      baseUser.therapistData = {
        license_number: rows[0].license_number || null,
        specialization: rows[0].specialization || null,
        years_of_experience: rows[0].experience_years || 0,
        bio: rows[0].bio || null,
        hourly_rate: rows[0].hourly_rate || null,
        status: rows[0].status || 'unknown',
        is_verified: Boolean(rows[0].is_verified),
        cancellation_count: rows[0].cancellation_count || 0
      };
    }

    if (baseUser.roles.includes('client') && rows[0].client_id) {
      baseUser.clientData = {
        therapy_goals: rows[0].therapy_goals || null,
        preferred_therapy_type: rows[0].preferred_therapy_type || null
      };
    }

    return baseUser;
  }

  static async getProfile(userId, userRoles) {
    try {
      // Block admins from accessing this route
      // if (userRoles.includes("admin")) {
      //   throw new UnauthorizedError("Admins cannot access user profiles directly via this route.");
      // }

      console.log("🔍 Debug - Attempting to fetch profile for userId:", userId);

      const rows = await UserModel.getUserProfile(userId);

      if (!rows || rows.length === 0) {
        console.error("❌ No profile data found for userId:", userId);
        throw new NotFoundError("User profile not found.");
      }

      console.log("✅ Raw profile data retrieved:", rows);

      const userProfile = this.formatUserProfile(rows);

      if (!userProfile) {
        console.error("❌ Failed to format profile data for userId:", userId);
        throw new AppError("Failed to process user profile data.");
      }

      // Add dashboard-specific data
      // if (userRoles.includes('client')) {
      //   // Get client's appointments
      //   // const appointments = await UserModel.getClientAppointments(userId);
      //   // userProfile.appointments = appointments;

      //   // Get client's subscription info
      //   const subscription = await UserModel.getClientSubscription(userId);
      //   if (subscription) {
      //     userProfile.subscriptionPlan = subscription.plan_name;
      //     userProfile.subscriptionEndDate = subscription.end_date;
      //   }

      //   // Get client's recent activity
      //   const recentActivity = await UserModel.getClientRecentActivity(userId);
      //   userProfile.recentActivity = recentActivity;
      // } 
      // else if (userRoles.includes('therapist')) {
      //   // Get therapist's today's appointments
      //   const todayAppointments = await UserModel.getTherapistTodayAppointments(userId);
      //   userProfile.todayAppointments = todayAppointments;

      //   // Get therapist's weekly stats
      //   const weeklyStats = await UserModel.getTherapistWeeklyStats(userId);
      //   userProfile.weeklyStats = weeklyStats;

      //   // Get therapist's recent activity
      //   const recentActivity = await UserModel.getTherapistRecentActivity(userId);
      //   userProfile.recentActivity = recentActivity;
      // }

      return userProfile;
    } catch (error) {
      console.error("Service Error: getProfile:", error);
      console.error("Error stack:", error.stack);

      // Re-throw custom errors directly
      if (error instanceof AppError) throw error;

      // Handle database-specific errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new AppError("Database connection error. Please try again later.");
      }

      throw new AppError("Failed to retrieve user profile due to an unexpected issue.");
    }
  }

  static async updateProfile(userId, userRoles, updateData) {
    try {
      let result = {};

      // Basic validation for common fields before attempting DB update
      if (updateData.name && (typeof updateData.name !== 'string' || updateData.name.trim().length === 0)) {
        throw new ValidationError("Name cannot be empty.");
      }
      // if (updateData.phone_number && !/^\+?\d{10,15}$/.test(updateData.phone_number)) {
      //     throw new ValidationError("Invalid phone number format.");
      // }
      if (updateData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(updateData.date_of_birth)) {
        throw new ValidationError("Invalid date of birth format. Use YYYY-MM-DD.");
      }
      // if (updateData.gender && !['male', 'female', 'unspecified'].includes(updateData.gender.toLowerCase())) {
      //     throw new ValidationError("Invalid gender provided. Accepted: 'male', 'female', 'unspecified'.");
      // }

      // Update basic user info
      result.user = await UserModel.updateUserBasicInfo(userId, {
        name: updateData.name,
        // phone_number: updateData.phone_number,
        date_of_birth: updateData.date_of_birth,
        // gender: updateData.gender,
        profile_picture: updateData.profile_picture // This might be null/undefined initially
      });

      // Update role-specific info
      if (userRoles.includes('therapist') && updateData.therapistData) {
        // Add specific validation for therapist data
        if (updateData.therapistData.specialization && (typeof updateData.therapistData.specialization !== 'string' || updateData.therapistData.specialization.trim().length === 0)) {
          throw new ValidationError("Therapist specialization cannot be empty.");
        }
        if (updateData.therapistData.experience_years !== undefined && (isNaN(updateData.therapistData.experience_years) || updateData.therapistData.experience_years < 0)) {
          throw new ValidationError("Experience years must be a non-negative number.");
        }
        result.therapistData = await UserModel.updateTherapistInfo(userId, updateData.therapistData);
      }

      if (userRoles.includes('client') && updateData.clientData) {
        // Add specific validation for client data
        if (updateData.clientData.therapy_goals && (typeof updateData.clientData.therapy_goals !== 'string' || updateData.clientData.therapy_goals.trim().length === 0)) {
          throw new ValidationError("Therapy goals cannot be empty.");
        }
        result.clientData = await UserModel.updateClientInfo(userId, updateData.clientData);
      }

      return result;
    } catch (error) {
      console.error("Service Error: updateProfile:", error);
      if (error instanceof AppError) throw error; // Re-throw custom errors
      throw new AppError("Failed to update profile due to an unexpected issue. Please try again.");
    }
  }

  static async updateEmail(userId, newEmail) {
    try {
      // Basic email format validation
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        throw new ValidationError("Please provide a valid email address.");
      }

      // Check if email already exists
      const emailExists = await UserModel.checkEmailExists(
        newEmail.toLowerCase()
      );
      if (emailExists) {
        throw new ConflictError("This email address is already registered. Please use a different one.");
      }

      const updatedUser = await UserModel.updateUserEmail(userId, newEmail);

      // Generate verification token (JWT for secure link)
      const verificationToken = jwt.sign(
        { userId, email: newEmail },
        process.env.JWT_SECRET + "_EMAIL_VERIFICATION",
        { expiresIn: "24h" }
      );

      // Store the token in the database
      await UserModel.createEmailVerificationToken(userId, verificationToken);

      // ******* Send the actual email *******
      await EmailService.sendEmailVerification(newEmail, verificationToken);

      // Return only necessary info, not the sensitive token
      return { email: updatedUser.email, message: "Verification link sent." };
    } catch (error) {
      console.error("Service Error: updateEmail:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update email due to an unexpected error. Please try again.");
    }
  }

  static async verifyEmail(token) {
    try {
      // Basic token validation (length, type)
      if (!token || typeof token !== 'string' || token.length < 10) { // arbitrary length check
        throw new ValidationError("Invalid verification token format.");
      }

      // Verify token signature and expiry from JWT
      let decoded;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET + "_EMAIL_VERIFICATION"
        );
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          throw new UnauthorizedError("Email verification link has expired. Please request a new one.");
        }
        if (jwtError.name === 'JsonWebTokenError') {
          throw new UnauthorizedError("Invalid email verification link. It might be malformed or tampered with.");
        }
        throw jwtError; // Re-throw for other unexpected JWT errors
      }

      // Check DB token existence and expiry
      const dbToken = await UserModel.getEmailVerificationToken(token);
      if (!dbToken || new Date(dbToken.expires_at) < new Date()) {
        throw new UnauthorizedError("Email verification link is invalid or has expired. Please request a new one.");
      }

      // Mark email as verified
      await UserModel.markEmailAsVerified(decoded.userId);
      await UserModel.invalidateEmailToken(token);

      return { success: true };
    } catch (error) {
      console.error("Service Error: verifyEmail:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to verify email due to an unexpected error. Please try again.");
    }
  }

  static async updatePassword(userId, currentPassword, newPassword) {
    try {
      // Input validation for passwords
      if (!currentPassword || !newPassword) {
        throw new ValidationError("Current password and new password are required.");
      }
      if (newPassword.length < 8) { // Example password policy
        throw new ValidationError("New password must be at least 8 characters long.");
      }
      if (currentPassword === newPassword) {
        throw new ValidationError("New password cannot be the same as the current password.");
      }

      // Get user's current password hash
      const { rows } = await db.query(
        "SELECT password FROM Users WHERE user_id = $1",
        [userId]
      );

      if (rows.length === 0) {
        throw new NotFoundError("User not found."); // Should ideally not happen if auth middleware works
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
      if (!isMatch) {
        throw new AuthenticationError("The current password you entered is incorrect. Please try again.");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      await UserModel.updateUserPassword(userId, hashedPassword);

      return { success: true };
    } catch (error) {
      console.error("Service Error: updatePassword:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update password due to an unexpected error. Please try again.");
    }
  }

  static async uploadAndSaveProfilePicture(userId, file) {
    try {
      if (!file || !file.filename) {
        throw new ValidationError("No file or filename provided for profile picture upload. Please select an image.");
      }

      // Construct the public file path
      const filePath = `/uploads/profile-pictures/${file.filename}`;

      // Update the user's profile picture in the database
      await UserModel.updateProfilePicture(userId, filePath);

      return filePath;
    } catch (error) {
      console.error("Service Error: uploadAndSaveProfilePicture:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to upload profile picture due to an unexpected issue. Please try again.");
    }
  }
}

module.exports = UserService;
// Export custom error classes for use in controllers/middleware
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ConflictError = ConflictError;
module.exports.AuthenticationError = AuthenticationError;