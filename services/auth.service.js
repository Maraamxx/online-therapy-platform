// services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuthModel = require("../models/auth.model");
const AdminModel = require("../models/admin.model");
const ClientAssessmentModel = require("../models/clientAssessment.model"); // Assuming this model exists
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../config/database"); // Import the database pool here for transaction management
require("dotenv").config();

const saltRounds = 10;

// Configure Nodemailer (add to your .env or config file)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class AuthService {
  static async registerUser(userData) {
    const normalizedEmail = userData.email.toLowerCase();

    // --- Start: Robust Server-Side Validation ---
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long.");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    const emailExists = await AuthModel.checkEmailExists(normalizedEmail);
    if (emailExists) {
      throw new Error("Email already registered. Please use a different one.");
    }

    // Phone number validation (e.g., 10-15 digits, optional leading +)
    // const phoneRegex = /^\+?\d{10,15}$/;
    // if (userData.phoneNumber && !phoneRegex.test(userData.phoneNumber)) {
    //   throw new Error(
    //     "Please enter a valid phone number (10-15 digits, optional +)."
    //   );
    // }
    // if (userData.phoneNumber) {
    //   const phoneNumberExists = await AuthModel.checkPhoneNumberExists(
    //     userData.phoneNumber
    //   );
    //   if (phoneNumberExists) {
    //     throw new Error(
    //       "Phone number already registered. Please use a different one."
    //     );

    // Password validation (strong password)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;<>,.?~\\-]).{8,}$/;
    if (!passwordRegex.test(userData.password)) {
      throw new Error(
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
      );
    }
    if (userData.password !== userData.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    // Date of Birth validation (simple check for non-empty)
    if (!userData.dateOfBirth) {
      throw new Error("Date of Birth is required.");
    }
    const dob = new Date(userData.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new Error("Invalid Date of Birth format.");
    }
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      // Adjust age if birthday hasn't occurred yet this year
      // This makes sure age is calculated correctly based on the current date
    }
    if (age < 18) {
      // Assuming minimum age for registration
      throw new Error("You must be at least 18 years old to register.");
    }

    if (!userData.gender) {
      throw new Error("Gender is required.");
    }

    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const client = await db.connect(); // Get a client from the pool for the transaction

    try {
      await client.query("BEGIN"); // Start the transaction

      // 1. Create user
      const newUser = await AuthModel.createUser(client, {
        ...userData,
        email: normalizedEmail,
        password: hashedPassword,
        has_completed_assessment: false,
      });

      const userId = newUser.user_id;

      // 2. Get role_id
      const roleId = await AuthModel.getRoleId(userData.role); // This can still use the pool directly or be adjusted to use 'client' if preferred for consistency
      if (!roleId) {
        throw new Error("Invalid role specified.");
      }

      // 3. Assign role to user
      await AuthModel.assignUserRole(client, userId, roleId);

      // 4. Insert into role-specific tables and handle therapist application
      if (userData.role === "therapist") {
        if (
          !userData.additionalData.license_number ||
          !userData.additionalData.specialization ||
          !userData.additionalData.experience_years
        ) {
          throw new Error(
            "License number, specialization, and experience years are required for therapists."
          );
        }
        if (!userData.additionalData.application_link) {
          throw new Error("Therapist application file is required.");
        }
        await AuthModel.createTherapist(client, {
          userId,
          ...userData.additionalData,
        });
      } else if (userData.role === "client") {
        await AuthModel.createClient(client, {
          userId,
          ...userData.additionalData,
        });
      }

      await client.query("COMMIT"); // Commit the transaction if all steps succeed

      // Generate tokens (outside the transaction, as they don't affect DB integrity directly)
      const tokens = await this.generateTokens(
        userId,
        normalizedEmail,
        userData.role
      );

      return {
        ...tokens,
        user: {
          userId,
          email: normalizedEmail,
          name: userData.name,
          role: userData.role,
          hasCompletedAssessment: newUser.has_completed_assessment,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK"); // Rollback if any error occurs in the transaction
      console.error("Transaction failed during registration:", error);
      // Re-throw the error with a more user-friendly message or the original error message
      throw error;
    } finally {
      client.release(); // Always release the client back to the pool
    }
  }

static async loginUser(email, password) {
    const normalizedEmail = email.toLowerCase();
    const user = await AuthModel.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new Error("Invalid credentials.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials.");
    }

    const roles = user.roles ? user.roles.split(",") : [];
    console.log(`[AuthService.loginUser] User roles for ${user.email}:`, roles);

    if (
      roles.includes("therapist") &&
      user.therapist_status &&
      user.therapist_status !== "Approved"
    ) {
      console.log(
        `[AuthService.loginUser] Therapist ${user.email} attempted login with status: ${user.therapist_status}`
      );
    }

    await AuthModel.updateLastLogin(user.user_id);

    let hasCompletedAssessment = false; // Default to false
    let matchedTherapistId = null;

    // Only attempt to get assessment status if the user is a client
    if (roles.includes("client")) {
        console.log(`[AuthService.loginUser] Client detected. Checking assessment status for userId: ${user.user_id}`);
        try {
            const assessmentStatus = await ClientAssessmentModel.checkClientAssessmentStatus(user.user_id);
            hasCompletedAssessment = assessmentStatus.has_completed_assessment;
            matchedTherapistId = assessmentStatus.matched_therapist_id;
            console.log(`[AuthService.loginUser] Assessment status fetched: hasCompletedAssessment=${hasCompletedAssessment}, matchedTherapistId=${matchedTherapistId}`);
        } catch (error) {
            console.error(`[AuthService.loginUser] Error fetching client assessment status for userId ${user.user_id}:`, error);
            // Decide how to handle this error:
            // 1. Re-throw if critical (will prevent login)
            // 2. Log and proceed with default 'false' for assessment status (current approach)
            // For redirection purposes, proceeding with 'false' is usually fine.
        }
    } else {
        console.log(`[AuthService.loginUser] User is not a client. Skipping assessment status check.`);
    }


    const tokens = await this.generateTokens(
      user.user_id,
      user.email,
      roles,
      user.therapist_status // Pass therapist status to generateTokens
    );

    return {
      ...tokens,
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        roles,
        hasCompletedAssessment, // This is now a clean boolean
        therapistStatus: user.therapist_status,
        matchedTherapistId // Include matchedTherapistId here
      },
    };
  }

  static async adminLogin(email, password) {
    const adminUser = await AdminModel.getAdminUserByEmail(email);

    if (!adminUser) {
      throw new Error("Invalid credentials or not an admin.");
    }

    // Check if the retrieved user actually has the 'admin' role among their roles
    const userRoles = adminUser.roles ? adminUser.roles.split(",") : [];
    if (!userRoles.includes("admin")) {
      throw new Error("Invalid credentials or not an admin.");
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: adminUser.user_id, email: adminUser.email, roles: userRoles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Admin tokens can have a shorter expiry
    );

    return {
      token,
      user: {
        userId: adminUser.user_id,
        email: adminUser.email,
        roles: userRoles,
      },
    };
  }

  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error("Refresh token required.");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (err) {
      throw new Error("Invalid or expired refresh token.");
    }

    const userId = await AuthModel.verifyRefreshToken(refreshToken);
    if (!userId) {
      throw new Error("Invalid or expired refresh token.");
    }

    const userDetails = await AuthModel.getUserDetails(userId);
    if (!userDetails) {
      throw new Error("User not found.");
    }

    const newAccessToken = jwt.sign(
      { userId, email: userDetails.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, {
      expiresIn: "7d",
    });

    await AuthModel.revokeRefreshToken(refreshToken);
    await AuthModel.storeRefreshToken(userId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshToken) {
    if (!refreshToken) {
      throw new Error("Refresh token required.");
    }

    const result = await AuthModel.deleteRefreshToken(refreshToken);
    if (!result) {
      throw new Error("Invalid refresh token.");
    }

    return { message: "Logged out successfully." };
  }

  static async generateTokens(userId, email, roles, therapistStatus = null) {
    const payload = { userId, email, roles };
    if (therapistStatus) {
      payload.therapistStatus = therapistStatus;
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, {
      expiresIn: "30d",
    });

    await AuthModel.storeRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  static async verifyPasswordResetToken(token) {
    const tokenRecord = await AuthModel.findPasswordResetToken(token);
    return tokenRecord;
  }

  static async requestPasswordReset(email) {
    const normalizedEmail = email.toLowerCase();
    const user = await AuthModel.getUserByEmail(normalizedEmail);

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const userId = user.user_id;
    const resetToken = crypto.randomBytes(32).toString("hex");

    await AuthModel.storePasswordResetToken(resetToken, userId);

    const resetUrl = `${process.env.APP_URL}/api/auth/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset Request for Inner Aura",
      html: `
                        <p>You requested a password reset for your Inner Aura account.</p>
                        <p>Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>
                        <p>This link is valid for 1 hour.</p>
                        <p>If you did not request this, please ignore this email.</p>
                    `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (mailError) {
      console.error("Error sending password reset email:", mailError);
      throw new Error("Failed to send password reset email.");
    }
  }

  static async resetPassword(token, newPassword) {
    console.log("AuthService.resetPassword called with token:", token);

    // Password validation for reset password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;<>,.?~\\-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error(
        "New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
      );
    }

    const tokenRecord = await AuthModel.findPasswordResetToken(token);
    console.log("Token record found:", tokenRecord);

    if (!tokenRecord) {
      console.log("Invalid or expired password reset token in service.");
      throw new Error("Invalid or expired password reset token.");
    }

    const userId = tokenRecord.user_id;
    console.log("User ID for reset:", userId);

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log("New password hashed. Updating user password...");

    await AuthModel.updateUserPassword(userId, hashedPassword);
    console.log("User password updated. Deleting reset token...");

    await AuthModel.deletePasswordResetToken(token);
    console.log("Reset token deleted. Password reset complete.");
  }
}

module.exports = AuthService;
