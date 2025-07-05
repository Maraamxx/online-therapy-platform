const db = require("../config/database");
const queries = require("../queries/user.queries");

class UserModel {
  // Get user profile
  static async getUserProfile(userId) {
    try {
      const { rows } = await db.query(queries.getUserProfile, [userId]);
      return rows;
    } catch (error) {
      console.error(
        `DB Error: Failed to fetch user profile for userId ${userId}.`,
        error
      );
      throw new Error("Database error: Could not retrieve profile."); // Generic DB error for upstream
    }
  }

  // Get client's appointments
  // static async getClientAppointments(userId) {
  //   try {
  //     const { rows } = await db.query(queries.getClientAppointments, [userId]);
  //     return rows;
  //   } catch (error) {
  //     console.error(
  //       `DB Error: Failed to fetch client appointments for userId ${userId}.`,
  //       error
  //     );
  //     throw new Error("Database error: Could not retrieve appointments.");
  //   }
  // }

  // // Get client's subscription info
  // static async getClientSubscription(userId) {
  //   try {
  //     const { rows } = await db.query(queries.getClientSubscription, [userId]);
  //     return rows[0] || null;
  //   } catch (error) {
  //     console.error(
  //       `DB Error: Failed to fetch client subscription for userId ${userId}.`,
  //       error
  //     );
  //     throw new Error("Database error: Could not retrieve subscription info.");
  //   }
  // }

  // // Get client's recent activity
  // static async getClientRecentActivity(userId) {
  //   try {
  //     const { rows } = await db.query(queries.getClientRecentActivity, [userId]);
  //     return rows;
  //   } catch (error) {
  //     console.error(
  //       `DB Error: Failed to fetch client activity for userId ${userId}.`,
  //       error
  //     );
  //     throw new Error("Database error: Could not retrieve activity history.");
  //   }
  // }

  // // Get therapist's today's appointments
  // static async getTherapistTodayAppointments(userId) {
  //   try {
  //     const { rows } = await db.query(queries.getTherapistTodayAppointments, [userId]);
  //     return rows;
  //   } catch (error) {
  //     console.error(
  //       `DB Error: Failed to fetch therapist's today appointments for userId ${userId}.`,
  //       error
  //     );
  //     throw new Error("Database error: Could not retrieve today's appointments.");
  //   }
  // }

  // // Get therapist's weekly stats
  // static async getTherapistWeeklyStats(userId) {
  //   try {
  //     const { rows } = await db.query(queries.getTherapistWeeklyStats, [userId]);
  //     return rows[0] || { totalSessions: 0, completedSessions: 0, upcomingSessions: 0 };
  //   } catch (error) {
  //     console.error(
  //       `DB Error: Failed to fetch therapist's weekly stats for userId ${userId}.`,
  //       error
  //     );
  //     throw new Error("Database error: Could not retrieve weekly statistics.");
  //   }
  // }

  // // Get therapist's recent activity
  // static async getTherapistRecentActivity(userId) {
  //   try {
  //     const { rows } = await db.query(queries.getTherapistRecentActivity, [userId]);
  //     return rows;
  //   } catch (error) {
  //     console.error(
  //       `DB Error: Failed to fetch therapist's activity for userId ${userId}.`,
  //       error
  //     );
  //     throw new Error("Database error: Could not retrieve activity history.");
  //   }
  // }

  // Update user profile
  static async updateUserBasicInfo(userId, updateData) {
    try {
      const { rows } = await db.query(queries.updateUserBasicInfo, [
        userId,
        updateData.name,
        // updateData.phone_number,
        updateData.date_of_birth,
        // updateData.gender,
        updateData.profile_picture,
      ]);
      if (rows.length === 0) {
        throw new Error("User not found or no changes made.");
      }
      return rows[0];
    } catch (error) {
      console.error(
        `DB Error: Failed to update user basic info for userId ${userId}.`,
        error
      );
      throw new Error("Database error: Could not update basic information.");
    }
  }

  static async updateTherapistInfo(userId, updateData) {
    try {
      const { rows } = await db.query(queries.updateTherapistInfo, [
        userId,
        updateData.specialization,
        updateData.experience_years,
        updateData.bio,
      ]);
      if (rows.length === 0) {
        throw new Error("Therapist not found or no changes made.");
      }
      return rows[0];
    } catch (error) {
      console.error(
        `DB Error: Failed to update therapist info for userId ${userId}.`,
        error
      );
      throw new Error(
        "Database error: Could not update therapist information."
      );
    }
  }

  static async updateClientInfo(userId, updateData) {
    try {
      const { rows } = await db.query(queries.updateClientInfo, [
        userId,
        updateData.therapy_goals,
        updateData.preferred_therapy_type,
      ]);
      if (rows.length === 0) {
        throw new Error("Client not found or no changes made.");
      }
      return rows[0];
    } catch (error) {
      console.error(
        `DB Error: Failed to update client info for userId ${userId}.`,
        error
      );
      throw new Error("Database error: Could not update client information.");
    }
  }

  static async checkEmailExists(email) {
    try {
      const { rows } = await db.query(queries.checkEmailExists, [
        email.toLowerCase(),
      ]);
      return rows.length > 0;
    } catch (error) {
      console.error(
        `DB Error: Failed to check email existence for ${email}.`,
        error
      );
      throw new Error("Database error: Could not check email availability.");
    }
  }

  static async updateUserEmail(userId, newEmail) {
    try {
      const { rows } = await db.query(queries.updateUserEmail, [
        userId,
        newEmail.toLowerCase(),
      ]);
      if (rows.length === 0) {
        throw new Error("User not found or email could not be updated.");
      }
      return rows[0];
    } catch (error) {
      console.error(
        `DB Error: Failed to update user email for userId ${userId} to ${newEmail}.`,
        error
      );
      // Check for unique constraint violation (PostgreSQL error code)
      if (error.code === "23505") {
        // Unique violation error code
        throw new Error(
          "Email already in use. Please choose a different email."
        ); // More specific error
      }
      throw new Error("Database error: Could not update email.");
    }
  }

  static async updateUserPassword(userId, hashedPassword) {
    try {
      const result = await db.query(queries.updateUserPassword, [
        userId,
        hashedPassword,
      ]);
      if (result.rowCount === 0) {
        throw new Error("User not found or password could not be updated.");
      }
    } catch (error) {
      console.error(
        `DB Error: Failed to update user password for userId ${userId}.`,
        error
      );
      throw new Error("Database error: Could not update password.");
    }
  }

  static async createEmailVerificationToken(userId, token) {
    try {
      const { rows } = await db.query(queries.createEmailVerificationToken, [
        userId,
        token,
      ]);
      return rows[0];
    } catch (error) {
      console.error(
        `DB Error: Failed to create email verification token for userId ${userId}.`,
        error
      );
      throw new Error(
        "Database error: Could not create email verification token."
      );
    }
  }

  static async getEmailVerificationToken(token) {
    try {
      const { rows } = await db.query(queries.getEmailVerificationToken, [
        token,
      ]);
      return rows[0];
    } catch (error) {
      console.error(
        `DB Error: Failed to retrieve email verification token ${token}.`,
        error
      );
      throw new Error(
        "Database error: Could not retrieve email verification token."
      );
    }
  }

  static async markEmailAsVerified(userId) {
    try {
      const result = await db.query(queries.markEmailAsVerified, [userId]);
      if (result.rowCount === 0) {
        throw new Error("User not found or email already verified.");
      }
    } catch (error) {
      console.error(
        `DB Error: Failed to mark email as verified for userId ${userId}.`,
        error
      );
      throw new Error("Database error: Could not verify email.");
    }
  }

  static async invalidateEmailToken(token) {
    try {
      await db.query(queries.invalidateEmailToken, [token]);
    } catch (error) {
      console.error(
        `DB Error: Failed to invalidate email token ${token}.`,
        error
      );
      throw new Error("Database error: Could not invalidate email token.");
    }
  }

  static async updateProfilePicture(userId, filePath) {
    try {
      const result = await db.query(queries.updateProfilePicture, [
        filePath,
        userId,
      ]);
      if (result.rowCount === 0) {
        throw new Error(
          "User not found or profile picture could not be updated."
        );
      }
    } catch (error) {
      console.error(
        `DB Error: Failed to update profile picture for userId ${userId}.`,
        error
      );
      throw new Error("Database error: Could not update profile picture.");
    }
  }

  static async getUserById(userId) {
    try {
      const query = `
                SELECT user_id, email, matched_therapist_id
                FROM users
                WHERE user_id = $1;
            `;
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  static async updateAssessmentStatus(userId, isCompleted, matchedTherapistId = null) {
    try {
      const query = `
                UPDATE users
                SET has_completed_assessment = $2,
                    matched_therapist_id = $3,
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING *;
            `;
      const result = await db.query(query, [userId, isCompleted, matchedTherapistId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user assessment status:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
