const AdminService = require("../services/admin.service");

const adminController = {
  getAdminPanel: async (req, res) => {
    // This route already follows the desired format
    res.render("admin/base_admin_layout", {
      title: "Dashboard",
      currentPage: "dashboard", // For sidebar active state
      body: "../admin/dashboard.ejs", // Path to the actual content view (relative to views folder)
    });
  },

  getProfileById: async (req, res) => {
    try {
      const { userId } = req.params;
      const userProfile = await AdminService.getProfileById(userId);
      // Applying the format for user_profile
      res.render("admin/base_admin_layout", {
        title: `User Profile: ${userProfile.email}`,
        currentPage: "all-users", // Assuming this is linked from all-users
        body: "../admin/user_profile.ejs", // Path to the actual content view
        user: userProfile, // Pass data
      });
    } catch (error) {
      console.error("❌ Admin Profile Fetch Error:", error.message);
      if (error.message === "User not found") {
        return res
          .status(404)
          .render("admin/error", { message: error.message, status: 404 });
      }
      res
        .status(500)
        .render("admin/error", {
          message: "Failed to fetch profile",
          status: 500,
        });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await AdminService.getAllUsers();
      // This route already follows the desired format
      res.render("admin/base_admin_layout", {
        title: "All Users", // Changed title for clarity
        currentPage: "all-users", // Corrected currentPage value for sidebar
        body: "../admin/users.ejs", // Path to the actual content view
        users: users, // Pass data
      });
    } catch (error) {
      console.error("❌ Get All Users Error:", error.message);
      res
        .status(500)
        .render("admin/error", {
          message: "Failed to fetch users",
          status: 500,
        });
    }
  },

  adminUpdateUser: async (req, res) => {
    try {
      const { userId: adminId } = req.user;
      const { userId } = req.params;
      const updateData = req.body;

      const result = await AdminService.adminUpdateUser(
        adminId,
        userId,
        updateData
      );
      res.json({
        message: "User updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Admin Update Error:", error.message);
      res.status(400).json({ error: error.message });
    }
  },

  getPendingTherapistApplications: async (req, res) => {
    try {
      // You had two res.render calls here, removed the first one.
      const { applications, summary } =
        await AdminService.getPendingTherapistApplications();
      // Applying the format
      res.render("admin/base_admin_layout", {
        title: "Therapist Applications",
        currentPage: "therapist-apps", // Corrected for sidebar consistency
        body: "../admin/therapist_applications.ejs", // Path to the actual content view
        applications: applications, // Pass data
        applicationSummary: summary, // Pass summary data
      });
    } catch (error) {
      console.error("Error fetching pending therapist applications:", error);
      return res
        .status(500)
        .render("admin/error", {
          success: false,
          error: "Failed to fetch applications.",
        });
    }
  },

  updateTherapistApplicationStatus: async (req, res) => {
    const { therapistId } = req.params;
    const { status, feedback } = req.body;
    const adminId = req.user.userId;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status provided. Must be 'Approved' or 'Rejected'.",
      });
    }

    try {
      const result = await AdminService.updateTherapistApplicationStatus(
        therapistId,
        status,
        adminId,
        feedback
      );
      return res.status(200).json({
        success: true,
        message: `Therapist application ${status.toLowerCase()} successfully.`,
        result,
      });
    } catch (error) {
      console.error(
        `Error ${status.toLowerCase()} therapist application:`,
        error
      );
      return res.status(500).json({
        success: false,
        error:
          error.message || `Failed to ${status.toLowerCase()} application.`,
      });
    }
  },

  viewAppointments: async (req, res) => {
    try {
      const appointments = await AdminService.getAppointments();
      // This route already follows the desired format
      res.render("admin/base_admin_layout", {
        title: "Appointments",
        currentPage: "appointments", // For sidebar active state
        body: "../admin/appointments.ejs", // Path to the actual content view
        appointments: appointments, // Pass data to the content view
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },

  viewSessions: async (req, res) => {
    try {
      const sessions = await AdminService.getSessions();
      // Applying the format for sessions
      res.render("admin/base_admin_layout", {
        title: "Sessions",
        currentPage: "sessions",
        body: "../admin/sessions.ejs", // Path to the actual content view
        sessions: sessions, // Pass data
      });
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },

  viewPayments: async (req, res) => {
    try {
      const { payments, paymentSummary } = await AdminService.getPayments();
      // Applying the format for payments
      res.render("admin/base_admin_layout", {
        title: "Payments",
        currentPage: "payments",
        body: "../admin/payments.ejs", // Path to the actual content view
        payments: payments,
        paymentSummary: paymentSummary, // Pass summary data
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },

  viewSubscriptionPayments: async (req, res) => {
    try {
      const subscriptionPayments = await AdminService.getSubscriptionPayments();
      // Applying the format for subscription_payments
      res.render("admin/base_admin_layout", {
        title: "Subscription Payments",
        currentPage: "sub-payments", // Corrected for sidebar consistency
        body: "../admin/subscription_payments.ejs", // Path to the actual content view
        subscriptionPayments: subscriptionPayments, // Pass data
      });
    } catch (error) {
      console.error("Error fetching subscription payments:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },

  viewPlanSubscribedUsersCount: async (req, res) => {
    try {
      const planCounts = await AdminService.getPlanSubscriberCounts();
      // Applying the format for plan_subscribers
      res.render("admin/base_admin_layout", {
        title: "Plan Subscribers",
        currentPage: "plan-subscribers",
        body: "../admin/plan_subscribers.ejs", // Path to the actual content view
        planCounts: planCounts, // Pass data
      });
    } catch (error) {
      console.error("Error fetching plan subscribed users count:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },

  getActiveTherapists: async (req, res) => {
    try {
      const therapists = await AdminService.getActiveTherapists();
      // Applying the format for therapists view (for active therapists)
      res.render("admin/base_admin_layout", {
        title: "Active Therapists",
        currentPage: "active-therapists",
        body: "../admin/therapists.ejs", // Assuming 'therapists.ejs' can display both active/all based on data
        therapists: therapists, // Pass data
      });
    } catch (error) {
      console.error("Error fetching active therapists:", error);
      res
        .status(500)
        .render("admin/error", {
          success: false,
          error: "Failed to fetch active therapists.",
        });
    }
  },

  getInactiveUsers: async (req, res) => {
    try {
      const inactiveUsers = await AdminService.getInactiveUsers();
      // Applying the format for users view (for inactive users)
      res.render("admin/base_admin_layout", {
        title: "Inactive Users",
        currentPage: "inactive-users",
        body: "../admin/users.ejs", // Reusing 'users.ejs' for inactive users too
        users: inactiveUsers, // Pass data (renamed to 'users' to match 'users.ejs' expectation)
      });
    } catch (error) {
      console.error("Error fetching inactive users:", error);
      res
        .status(500)
        .render("admin/error", {
          success: false,
          error: "Failed to fetch inactive users.",
        });
    }
  },

  deactivateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;
      const result = await AdminService.deactivateUser(adminId, userId);
      res.status(200).json({
        success: true,
        message: "User deactivated successfully.",
        user: result,
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to deactivate user.",
      });
    }
  },

  activateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;
      const result = await AdminService.activateUser(adminId, userId);
      res.status(200).json({
        success: true,
        message: "User activated successfully.",
        user: result,
      });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to activate user.",
      });
    }
  },

  getAllTherapists: async (req, res) => {
    try {
      const therapists = await AdminService.getAllTherapists();
      // Applying the format for therapists view (for all therapists)
      res.render("admin/base_admin_layout", {
        title: "All Therapists",
        currentPage: "all-therapists",
        body: "../admin/therapists.ejs", // Reusing 'therapists.ejs' for all therapists too
        therapists: therapists, // Pass data
      });
    } catch (error) {
      console.error("Error fetching all therapists:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },

  getAllClients: async (req, res) => {
    try {
      const clients = await AdminService.getAllClients();
      // Applying the format for clients view
      res.render("admin/base_admin_layout", {
        title: "All Clients",
        currentPage: "clients",
        body: "../admin/clients.ejs", // Path to the actual content view
        clients: clients, // Pass data
      });
    } catch (error) {
      console.error("Error fetching all clients:", error);
      res
        .status(500)
        .render("admin/error", { message: "Internal server error" });
    }
  },
};

module.exports = adminController;