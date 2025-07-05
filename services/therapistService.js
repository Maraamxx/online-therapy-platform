const pool = require("../config/database");
const queries = require("../config/queries");

const getTherapistById = async (therapistId) => {
    const result = await pool.query(queries.GET_THERAPIST_BY_ID, [therapistId]);
    return result.rows[0];
};

module.exports = { getTherapistById };
