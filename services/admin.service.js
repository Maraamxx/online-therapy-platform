const AdminModel = require("../models/admin.model");
const UserModel = require("../models/user.model"); // Make sure this is correctly imported and has the update methods
const db = require("../config/database"); // Assuming you have a central db connection
const adminQueries = require("../queries/admin.queries"); // Assuming this is where your queries are defined
const EmailService = require("./email.service"); // Import the new EmailService

class AdminService {
  static async getProfileById(userId) {
    const rows = await AdminModel.getUserProfileById(userId);

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    return this.formatUserProfile(rows);
  }

  static async getAllUsers() {
    return await AdminModel.getAllUsers();
  }

  static formatUserProfile(rows) {
    const user = {
      user_id: rows[0].user_id,
      name: rows[0].name,
      email: rows[0].email,
      phone_number: rows[0].phone_number,
      date_of_birth: rows[0].date_of_birth,
      profile_picture: rows[0].profile_picture,
      is_active: rows[0].is_active,
      // Assuming gender and other common fields are also available in Users table
      gender: rows[0].gender,
      created_at: rows[0].created_at, // Add these if available in your User model/query
      updated_at: rows[0].updated_at, // Add these if available in your User model/query
      roles: [...new Set(rows.map((row) => row.role_name).filter(Boolean))],
    };

    if (user.roles.includes("therapist")) {
      user.therapistData = {
        license_number: rows[0].license_number,
        specialization: rows[0].specialization,
        years_of_experience: rows[0].experience_years, // Note: your query uses 'experience_years', not 'experience'
        bio: rows[0].bio,
        hourly_rate: rows[0].hourly_rate,
        status: rows[0].status,
        is_verified: rows[0].is_verified,
        cancellation_count: rows[0].cancellation_count,
        application_link: rows[0].application_link,
      };
    }

    if (user.roles.includes("client")) {
      user.clientData = {
        therapy_goals: rows[0].therapy_goals,
        preferred_therapy_type: rows[0].preferred_therapy_type,
      };
    }

    return user;
  }

  static async adminUpdateUser(adminId, userId, updateData) {
    // In a real app, you would verify admin privileges here,
    // but authMiddleware should already handle it.

    let result = {};

    // Update basic user info if provided
    if (updateData.basicInfo) {
      result.user = await UserModel.updateUserBasicInfo(
        userId,
        updateData.basicInfo
      );
    }

    // Update role-specific info if provided
    if (updateData.therapistData) {
      result.therapistData = await UserModel.updateTherapistInfo(
        userId,
        updateData.therapistData
      );
    }

    if (updateData.clientData) {
      result.clientData = await UserModel.updateClientInfo(
        userId,
        updateData.clientData
      );
    }

    return result;
  }

  // MODIFIED: To also fetch summary counts for the controller
  static async getPendingTherapistApplications() {
    const applications = await AdminModel.getPendingTherapistApplications();
    const approvedCount = await AdminModel.countApprovedTherapistApplications();
    const rejectedCount = await AdminModel.countRejectedTherapistApplications(); // Use rejected here

    return {
      applications,
      summary: {
        pending: applications.length, // 'applications' here are already filtered to 'Pending'
        approved: approvedCount,
        rejected: rejectedCount,
      },
    };
  }

  static async updateTherapistApplicationStatus(
    therapistId,
    newStatus, // This will be 'Approved' or 'Rejected' from the controller
    adminId,
    feedback = null
  ) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Update the therapist's account status
      // Adjust this line to use 'Pending Approval' or 'Rejected' based on newStatus
      const therapistAccountStatus =
        newStatus === "Approved" ? "Approved" : "Rejected";
      const { rows: therapistRows } = await client.query(
        adminQueries.updateTherapistAccountStatus,
        [therapistId, therapistAccountStatus]
      );
      if (therapistRows.length === 0) {
        throw new Error(
          "Therapist not found or unable to update account status."
        );
      }

      // 2. Update the specific pending therapist application status
      const { rows: applicationRows } = await client.query(
        adminQueries.updateTherapistApplicationStatus,
        [
          therapistId,
          newStatus, // 'Approved' or 'Rejected'
          feedback,
          adminId,
        ]
      );

      if (applicationRows.length === 0) {
        console.warn(
          `No pending application found for therapist ${therapistId} to update.`
        );
      }

      // Commit the transaction before sending email
      await client.query("COMMIT");

      // 3. Send notification email to the therapist about the status change
      // (Assuming EmailService methods are implemented)
      const userDetails = await db.query(
        "SELECT email, name FROM Users WHERE user_id = $1",
        [therapistId]
      );
      if (userDetails.rows.length > 0) {
        const { email, name } = userDetails.rows[0];
        if (newStatus === "Approved") {
          await EmailService.sendApprovalEmail(email, name);
        } else if (newStatus === "Rejected" && feedback) {
          await EmailService.sendRejectionEmail(email, name, feedback);
        }
      } else {
        console.warn(
          `Could not find user details for therapist ID ${therapistId} to send email.`
        );
      }

      return {
        therapist: therapistRows[0],
        application: applicationRows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating therapist application status:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAppointments() {
    return await AdminModel.getAllAppointments();
  }

  static async getSessions() {
    return await AdminModel.getAllSessions();
  }

  // MODIFIED: To also fetch payment summary for the controller
  static async getPayments() {
    const payments = await AdminModel.getAllPayments();
    const paymentSummary = await AdminModel.getPaymentSummary();
    return { payments, paymentSummary };
  }

  static async getSubscriptionPayments() {
    return await AdminModel.getAllSubscriptionPayments();
  }

  static async getPlanSubscriberCounts() {
    return await AdminModel.getPlanSubscribedUsersCount();
  }

  // NEW ADMIN SERVICE METHODS (for summary data)
  static async countApprovedTherapistApplications() {
    return await AdminModel.countApprovedTherapistApplications();
  }

  static async countDeclinedTherapistApplications() {
    // Adjusted name for consistency
    return await AdminModel.countRejectedTherapistApplications();
  }

  static async getPaymentSummary() {
    return await AdminModel.getPaymentSummary();
  }

  // Existing NEW ADMIN SERVICE METHODS
  static async getActiveTherapists() {
    return await AdminModel.getActiveTherapists();
  }

  static async getInactiveUsers() {
    return await AdminModel.getInactiveUsers();
  }

  static async deactivateUser(adminId, userId) {
    const result = await AdminModel.deactivateUser(userId);
    if (!result) {
      throw new Error(`Failed to deactivate user with ID: ${userId}`);
    }
    return result;
  }

  static async activateUser(adminId, userId) {
    const result = await AdminModel.activateUser(userId);
    if (!result) {
      throw new Error(`Failed to activate user with ID: ${userId}`);
    }
    return result;
  }
  static async getAllTherapists() {
    return await AdminModel.getAllTherapists();
  }

  static async getAllClients() {
    return await AdminModel.getAllClients();
  }
}

module.exports = AdminService;
