const GET_APPOINTMENT_DETAILS = `
    SELECT
        a.appointment_id,
        a.therapist_id,
        a.client_id,
        a.date_time,
        a.duration,
        a.status,
        a.jitsi_room_name,
        t_user.name AS therapist_name,
        c_user.name AS client_name
    FROM appointments a
    JOIN users t_user ON a.therapist_id = t_user.user_id
    JOIN users c_user ON a.client_id = c_user.user_id
    WHERE a.appointment_id = $1;
`;

const UPDATE_APPOINTMENT_JITSI_ROOM = `
    UPDATE appointments
    SET jitsi_room_name = $1, updated_at = NOW()
    WHERE appointment_id = $2
    RETURNING jitsi_room_name;
`;

// You might also need a query to check if an appointment exists without full details
const GET_APPOINTMENT_EXISTS = `
    SELECT appointment_id, jitsi_room_name FROM appointments WHERE appointment_id = $1;
`;

module.exports = {
    GET_APPOINTMENT_DETAILS,
    UPDATE_APPOINTMENT_JITSI_ROOM,
    GET_APPOINTMENT_EXISTS,
};