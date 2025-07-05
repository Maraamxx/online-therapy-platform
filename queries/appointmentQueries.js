const appointmentQueries = {
  getAppointmentById: `SELECT 
    u.name AS therapist_name, 
    u.email AS therapist_email, 
    u.phone_number AS therapist_phone_number, 
    t.specialization AS therapist_specialization, 
    t.experience_years AS therapist_experience_years, 
    t.bio AS therapist_bio,
    t.level,
    a.appointment_id, 
    a.therapist_id,
    a.client_id, 
    a.date_time, 
    a.duration, 
    a.status, 
    a.session_type, 
    a.notes, 
    a.price
FROM appointments a
JOIN therapists t ON a.therapist_id = t.therapist_id
JOIN users u ON t.therapist_id = u.user_id
WHERE a.appointment_id = $1;

`,
  updateAppointmentStatus: `
        UPDATE public.appointments
        SET status = $1
        WHERE appointment_id = $2;
      `,
};

module.exports = appointmentQueries;
