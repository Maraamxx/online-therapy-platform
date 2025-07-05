// models/clientAssessment.model.js
const db = require("../config/database"); // Assuming you have a database config
const queries = require("../queries/clientAssessment.queries");

class ClientAssessmentModel {
    // MODIFIED: Now takes matchedTherapistId to update clients table
    static async saveAssessmentAndMarkCompleted(assessmentData, userId, matchedTherapistId = null) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");

            // Save the client assessment
            await client.query(queries.saveClientAssessment, [
                userId, // client_id (which is the userId)
                assessmentData.mental_health_concerns,
                assessmentData.preferred_therapist_gender,
                assessmentData.preferred_religion,
                assessmentData.preferred_language,
                assessmentData.age_group_preference,
                // Add time_availability here if you decide to store it in client_assessments
                // assessmentData.time_availability,
            ]);

            // Mark client's assessment as completed and store matched therapist ID
            await client.query(queries.markClientAssessmentCompleted, [
                userId, // client_id
                matchedTherapistId, // matched_therapist_id
            ]);

            await client.query("COMMIT");
            // No specific return value for this transaction, just success/failure
            return true;
        } catch (error) {
            await client.query("ROLLBACK");
            console.error(
                "DB Transaction Error: Failed to save assessment or mark completed for client.",
                error
            );
            throw error;
        } finally {
            client.release();
        }
    }

    // MODIFIED: Check status from clients table, return both has_completed_assessment and matched_therapist_id
    static async checkClientAssessmentStatus(userId) {
        try {
            const { rows } = await db.query(queries.checkClientAssessmentStatus, [
                userId, // client_id
            ]);
            // Ensure userId is valid and rows is not empty
            if (rows.length === 0) {
                // If no client record found (e.g., user is a therapist or record not created yet)
                // Default to false for assessment completion and null for therapist ID
                return { has_completed_assessment: false, matched_therapist_id: null };
            }

            const clientData = rows[0];

            // Explicitly convert to boolean for has_completed_assessment.
            // If the DB column is boolean, this is good for robustness.
            // If it can be NULL, `=== true` handles it correctly.
            return {
                has_completed_assessment: clientData.has_completed_assessment === true,
                matched_therapist_id: clientData.matched_therapist_id,
            };
        } catch (error) {
            console.error(
                `DB Error: Failed to check assessment status for client userId ${userId}.`,
                error
            );
            throw new Error("Database error: Could not check assessment status.");
        }
    }

    static async findTherapists(mentalHealthConcern, gender, religion, language) {
        try {
            const params = [
                mentalHealthConcern,
                gender,
                religion,
                language,
            ];

            console.log("DEBUG: findTherapists params:", JSON.stringify(params));
            console.log(
                "DEBUG: findTherapists query:",
                queries.findTherapistsForMatching
            );

            const { rows } = await db.query(
                queries.findTherapistsForMatching,
                params
            );

            console.log("DEBUG: Therapists found:", rows.length, "rows");
            return rows;
        } catch (error) {
            console.error("DB Error: Failed to find therapists. ", error);
            throw new Error("Database error: Could not find therapists.");
        }
    }
}

module.exports = ClientAssessmentModel;