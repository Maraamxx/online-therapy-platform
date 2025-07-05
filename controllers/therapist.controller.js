// controllers/therapist.controller.js (Create or add to existing)
const TherapistService = require("../services/therapist.service");

class TherapistController {
  static async renderApplicationPending(req, res) {
    // Ensure user is authenticated and has a userId in req.user
    if (!req.user || !req.user.userId) {
      req.session.loginError = "You must be logged in to view this page.";
      return res.redirect("/api/auth/login");
    }

    try {
      const applicationData =
        await TherapistService.getTherapistApplicationStatus(req.user.userId); // FIX THIS LINE: Remove the leading slash '/'

      res.render("therapist/application-pending", {
        // <-- CORRECTED
        title: "Application Under Review",
        applicationData: applicationData, // Pass any errors from login if redirected here
        error: req.session.loginError || null,
      }); // Clear the error after displaying
      if (req.session.loginError) {
        delete req.session.loginError;
      }
    } catch (error) {
      console.error(
        "Error rendering therapist application pending page:",
        error
      );
      res.status(500).render("error", {
        title: "Error",
        message: "Failed to load application status.",
        details: error.message,
      });
    }
  }
}

module.exports = TherapistController;
