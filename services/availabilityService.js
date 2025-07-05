// services/availabilityService.js
const pool = require('../config/database');
const queries = require("../config/queries"); // <--- Corrected path and single import

const createAvailability = async ({ therapist_id, start_timestamp, end_timestamp }) => {
  console.log('Creating Availability:', { therapist_id, start_timestamp, end_timestamp });
  const values = [therapist_id, start_timestamp, end_timestamp];
  const result = await pool.query(queries.CREATE_AVAILABILITY, values); // <--- Using 'queries' directly
  return result.rows[0];
};

const getAvailabilityByTherapistId = async (therapist_id) => {
  const values = [therapist_id];
  const result = await pool.query(queries.GET_AVAILABILITY_BY_THERAPIST_ID, values); // <--- Using 'queries' directly
  return result.rows;
};

const updateAvailability = async (id, { start_timestamp, end_timestamp }) => {
  const values = [start_timestamp, end_timestamp, id];
  const result = await pool.query(queries.UPDATE_AVAILABILITY, values); // <--- Using 'queries' directly
  return result.rows[0];
};

const deleteAvailability = async (id) => {
  const values = [id];
  const result = await pool.query(queries.DELETE_AVAILABILITY, values); // <--- Using 'queries' directly
  return result.rows[0];
};

module.exports = {
  createAvailability,
  getAvailabilityByTherapistId,
  updateAvailability,
  deleteAvailability
};