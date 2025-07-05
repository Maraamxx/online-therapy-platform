// services/clientAssessment.service.js
const ClientAssessmentModel = require("../models/clientAssessment.model");

class ClientAssessmentService {
    // MODIFIED: Now takes matchedTherapistId
    static async saveAssessment(userId, assessmentData, matchedTherapistId = null) {
        const dataToSave = {
            client_id: userId, // client_id will be the userId
            mental_health_concerns: assessmentData.mental_health_concerns || [],
            preferred_therapist_gender:
                assessmentData.preferred_therapist_gender || null,
            preferred_religion: assessmentData.preferred_religion || null,
            preferred_language: assessmentData.preferred_language || null,
            age_group_preference: assessmentData.age_group_preference || null,
            time_availability: assessmentData.time_availability || null,
        };

        try {
            // Pass userId and matchedTherapistId to the model
            await ClientAssessmentModel.saveAssessmentAndMarkCompleted(
                dataToSave,
                userId,
                matchedTherapistId
            );
            return true; // Indicate success
        } catch (error) {
            console.error("Error in saveAssessment service:", error);
            throw new Error("Failed to save assessment.");
        }
    }

    // MODIFIED: Pass matchedTherapistId from here to saveAssessment
    static async getMatchedTherapist(userId, assessmentData) {
        try {
            const {
                mental_health_concerns,
                preferred_therapist_gender,
                preferred_religion,
                preferred_language,
                // age_group_preference is not used in findTherapists query
            } = assessmentData;

            let matchedTherapists = await ClientAssessmentModel.findTherapists(
                mental_health_concerns,
                preferred_therapist_gender,
                preferred_religion,
                preferred_language
            );

            let matchedTherapist = null;
            let topOtherOptions = [];

            if (matchedTherapists.length > 0) {
                matchedTherapist = matchedTherapists[0];
                topOtherOptions = matchedTherapists.slice(1, 4); // Get up to 3 other options
            }

            // Save the assessment and mark completed with the matched therapist ID
            // Only mark completed if a therapist was found, or if you want to mark it completed even with no match
            const therapistIdToSave = matchedTherapist ? matchedTherapist.therapist_id : null;
            await this.saveAssessment(userId, assessmentData, therapistIdToSave);


            return {
                matchFound: !!matchedTherapist, // true if matchedTherapist exists, false otherwise
                therapist: matchedTherapist,
                topOtherOptions: topOtherOptions,
            };

        } catch (error) {
            console.error("Error in getMatchedTherapist service:", error);
            throw new Error("Failed to find a matched therapist.");
        }
    }

    // No change needed here, as it calls the model which is updated
    static async hasUserCompletedAssessment(userId) {
        try {
            return await ClientAssessmentModel.checkClientAssessmentStatus(userId);
        } catch (error) {
            console.error("Error checking user assessment status:", error);
            throw new Error("Failed to check assessment status.");
        }
    }
}

module.exports = ClientAssessmentService;