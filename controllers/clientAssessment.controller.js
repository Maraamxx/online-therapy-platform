// In controllers/clientAssessment.controller.js
const ClientAssessmentService = require('../services/clientAssessment.service');
// const User = require('../models/user.model'); // No longer directly using User model for assessment status

class ClientAssessmentController {
    static async showAssessmentPage(req, res) {
        const userId = req.user ? req.user.id : 57; // Use actual user ID from auth
        try {
            // Get assessment status and matched therapist ID from the clients table
            const clientAssessmentStatus = await ClientAssessmentService.hasUserCompletedAssessment(userId);
            const hasCompleted = clientAssessmentStatus.has_completed_assessment;
            const matchedTherapistId = clientAssessmentStatus.matched_therapist_id;

            if (hasCompleted && req.query.retake !== "true") {
                // If assessment is completed and not a retake request
                if (matchedTherapistId) {
                    // Redirect to the specific therapist profile
                    return res.redirect(`/api/therapists/${matchedTherapistId}`);
                } else {
                    // Redirect to a general therapists browse page if no specific match was found/saved
                    return res.redirect("/api/therapists");
                }
            }

            // If not completed, or it's a retake, render the assessment form
            res.render("client/assessment", {
                title: "Client Assessment",
                errors: null, // Initial state, no errors
                formData: null, // Initial state, no form data
                accessToken: req.session ? req.session.accessToken : null // Pass if you have session based auth
            });
        } catch (error) {
            console.error("Error showing assessment page:", error);
            res.status(500).render("error", { message: "Internal server error." });
        }
    }

    // POST /api/assessment/match-therapist
    static async matchTherapist(req, res) {
        const userId = req.user ? req.user.id : 52; // Use actual user ID
        const assessmentData = req.body;

        // Basic validation (you can enhance this greatly)
        if (
            !assessmentData.mental_health_concerns ||
            !Array.isArray(assessmentData.mental_health_concerns) ||
            assessmentData.mental_health_concerns.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one mental health concern.",
            });
        }

        try {
            const { matchFound, therapist, topOtherOptions } =
                await ClientAssessmentService.getMatchedTherapist(
                    userId,
                    assessmentData
                );

            if (matchFound) {
                return res.status(200).json({
                    success: true,
                    message: "Therapist matched successfully!",
                    matchedTherapist: therapist,
                    topOtherOptions: topOtherOptions,
                });
            } else {
                return res.status(200).json({
                    success: false,
                    message: "No direct match found based on your preferences. Please browse other therapists.",
                    matchedTherapist: null,
                    topOtherOptions: [],
                });
            }
        } catch (error) {
            console.error("Error matching therapist:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to find a matched therapist due to a server error.",
            });
        }
    }
}
module.exports = ClientAssessmentController;