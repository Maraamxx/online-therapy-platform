// models/therapist.model.js (Create this file if it doesn't exist)
const db = require("../config/database");
const queries = require("../queries/therapist.queries"); // Assuming this file path

class TherapistModel {
    static async getApplicationDetails(therapistId) {
        const { rows } = await db.query(queries.getTherapistApplicationDetails, [therapistId]);
        return rows[0]; // Return the first (latest) application found
    }
}

module.exports = TherapistModel;