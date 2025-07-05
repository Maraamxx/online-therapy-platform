// services/viewTherapistsService.js
const pool = require("../config/database"); // Your database connection pool
const viewTherapistsQueries = require("../queries/viewTherapistsQueries");

class TherapistService {
  static async getAllTherapists(filters = {}) {
    let query = viewTherapistsQueries.GET_ALL_THERAPISTS_BASE;
    const queryParams = [];
    let paramIndex = 1;

    // Add search and filter conditions dynamically
    if (filters.search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR t.specialization ILIKE $${paramIndex} OR t.bio ILIKE $${paramIndex})`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }
    if (filters.specialization && filters.specialization !== 'All') {
      query += ` AND t.specialization = $${paramIndex}`;
      queryParams.push(filters.specialization);
      paramIndex++;
    }
    if (filters.level && filters.level !== 'All') {
      query += ` AND t.level = $${paramIndex}`;
      queryParams.push(filters.level);
      paramIndex++;
    }
    if (filters.genderPreference && filters.genderPreference !== 'All') {
      query += ` AND t.gender_preference = $${paramIndex}`;
      queryParams.push(filters.genderPreference);
      paramIndex++;
    }
    if (filters.language && filters.language !== 'All') {
      query += ` AND $${paramIndex} = ANY(t.languages)`; // For array type
      queryParams.push(filters.language);
      paramIndex++;
    }
    if (filters.approachStyle && filters.approachStyle !== 'All') {
      query += ` AND t.approach_style = $${paramIndex}`;
      queryParams.push(filters.approachStyle);
      paramIndex++;
    }
    if (filters.religion && filters.religion !== 'All') {
      query += ` AND t.religion = $${paramIndex}`;
      queryParams.push(filters.religion);
      paramIndex++;
    }


    query += ` ORDER BY u.name;`; // Always order results

    try {
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error("Error in getAllTherapists service (with filters):", error);
      throw new Error("Could not fetch therapists with applied filters.");
    }
  }

  static async getTherapistById(therapistId) {
    const query = viewTherapistsQueries.GET_THERAPIST_BY_ID;
    const values = [therapistId];
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error in getTherapistById service:", error);
      throw new Error(`Could not fetch therapist with ID ${therapistId}.`);
    }
  }
}

module.exports = TherapistService;