// src/services/jitsiSessionDBService.js
const db = require('../config/database'); // Your pgPool instance
const jitsiSessionQueries = require('../queries/jitsiSessionQueries');

/**
 * Fetches detailed information for a specific appointment, including associated user names.
 * @param {string} appointmentId - The ID of the appointment.
 * @returns {Promise<object | null>} The appointment object, or null if not found.
 */
const getAppointmentDetails = async (appointmentId) => {
    const result = await db.query(jitsiSessionQueries.GET_APPOINTMENT_DETAILS, [appointmentId]);
    return result.rows[0] || null;
};

/**
 * Updates the jitsi_room_name for a given appointment.
 * @param {string} appointmentId - The ID of the appointment.
 * @param {string} roomName - The new Jitsi room name to assign.
 * @returns {Promise<string>} The assigned room name.
 */
const updateJitsiRoomName = async (appointmentId, roomName) => {
    const result = await db.query(jitsiSessionQueries.UPDATE_APPOINTMENT_JITSI_ROOM, [roomName, appointmentId]);
    return result.rows[0].jitsi_room_name;
};

/**
 * Checks if an appointment exists and retrieves its current Jitsi room name.
 * @param {string} appointmentId - The ID of the appointment.
 * @returns {Promise<object | null>} Object with appointment_id and jitsi_room_name, or null.
 */
const getAppointmentExists = async (appointmentId) => {
    const result = await db.query(jitsiSessionQueries.GET_APPOINTMENT_EXISTS, [appointmentId]);
    return result.rows[0] || null;
};


module.exports = {
    getAppointmentDetails,
    updateJitsiRoomName,
    getAppointmentExists,
};