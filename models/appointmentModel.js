const pool = require("../config/database");
const appointmentQueries = require('../queries/appointmentQueries');
const bookingQueries = require('../queries/bookingQueries');

const getAppointmentById = async (appointmentId) => {
  const query = appointmentQueries.getAppointmentById;
  const { rows } = await pool.query(query, [appointmentId]);
  console.log("DB Results:", rows);
  return rows[0];
};

const updateAppointmentStatus = async (status, appointmentId) => {
  const query = appointmentQueries.updateAppointmentStatus;
  const values = [status, appointmentId];
  await pool.query(query, values);
};

const createAppointment = async (appointmentData) => {
  const query = bookingQueries.BOOK_APPOINTMENT;
  const values = [
    appointmentData.therapistId,
    appointmentData.clientId,
    appointmentData.date_time,
    appointmentData.duration,
    appointmentData.status || 'Pending',
    appointmentData.session_type,
    appointmentData.price
  ];
  console.log('Creating appointment with query:', query);
  console.log('Values:', values);
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  getAppointmentById,
  updateAppointmentStatus,
  createAppointment
};
