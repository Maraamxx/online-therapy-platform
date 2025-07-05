// queries/appointmentQueries.js
const queries = {
  // Appointment Retrieval Queries
  getClientAppointments: `
    SELECT * FROM Appointments
    WHERE client_id = $1
    ORDER BY date_time
  `,

  getTherapistAppointments: `
    SELECT * FROM Appointments
    WHERE therapist_id = $1
    ORDER BY date_time
  `,

  getAppointmentByIdAndClient: `
    SELECT * FROM Appointments
    WHERE appointment_id = $1 AND client_id = $2
  `,

  getAppointmentByIdAndTherapist: `
    SELECT * FROM Appointments
    WHERE appointment_id = $1 AND therapist_id = $2
  `,

  selectAppointmentById: `
    SELECT 
      a.*,
      p.payment_id,
      p.amount as payment_amount,
      cs.subscription_id,
      sp.price as plan_price,
      sp.session_limit
    FROM Appointments a
    LEFT JOIN Payments p ON a.appointment_id = p.appointment_id
    LEFT JOIN client_subscriptions cs ON a.subscription_id = cs.subscription_id
    LEFT JOIN subscription_plans sp ON cs.plan_id = sp.plan_id
    WHERE a.appointment_id = $1
  `,

  // Appointment Details Queries (Consolidated and improved join aliases)
  getAppointmentDetails: `
    SELECT
      a.appointment_id,
      a.client_id,
      a.therapist_id,
      a.date_time,
      a.duration,
      a.status,
      a.cancellation_initiated_by,
      a.cancellation_reason,
      a.reschedule_initiated_by,
      a.rescheduled_from,
      a.decline_reason,
      a.created_at,
      a.updated_at,
      a.session_type,
      a.notes,
      a.price,
      a.jitsi_room_name,
      cs.remaining_sessions,
      sp.price AS plan_price,
      sp.session_limit,
      p.amount AS payment_amount,
      p.payment_id,
      u_client.email AS client_email,
      u_client.name AS client_name,
      u_therapist.email AS therapist_email,
      u_therapist.name AS therapist_name
    FROM Appointments a
    LEFT JOIN client_subscriptions cs ON a.subscription_id = cs.subscription_id
    LEFT JOIN subscription_plans sp ON cs.plan_id = sp.plan_id
    LEFT JOIN Payments p ON a.appointment_id = p.appointment_id
    JOIN Users u_client ON a.client_id = u_client.user_id
    JOIN Users u_therapist ON a.therapist_id = u_therapist.user_id
    WHERE a.appointment_id = $1
  `,

  // Availability Check Queries
  // Explicitly check for 'Confirmed' or 'Pending' or 'Rescheduled' appointments
  checkTherapistAvailability: `
    SELECT appointment_id FROM Appointments
    WHERE therapist_id = $1
    AND date_time = $2
    AND status IN ('Confirmed', 'Pending', 'Rescheduled');
  `,

  // Subscription Management Queries
  incrementRemainingSessionById: `
    UPDATE client_subscriptions
    SET remaining_sessions = remaining_sessions + 1
    WHERE subscription_id = $1
  `,

  decrementRemainingSessionById: `
    UPDATE client_subscriptions
    SET remaining_sessions = remaining_sessions - 1
    WHERE subscription_id = $1
  `,

  // Payment Status Queries
  updatePaymentStatusTherapistCancel: `
    UPDATE Payments
    SET status = 'Refunded',
        refund_amount = $1,
        refund_reason = 'Therapist Cancellation'
    WHERE payment_id = $2
  `,

  updatePaymentStatusClientEarlyCancel: `
    UPDATE Payments
    SET status = 'Refunded',
        refund_amount = $1,
        refund_reason = 'Client Early Cancellation'
    WHERE payment_id = $2
  `,

  updatePaymentStatusClientLateCancel: `
    UPDATE Payments
    SET status = 'Partially_Refunded',
        refund_amount = $1,
        refund_reason = 'Client Late Cancellation'
    WHERE payment_id = $2
  `,

  updateAppointmentStatusById: `
    UPDATE Appointments
    SET status = 'Cancelled',
        updated_at = NOW()
    WHERE appointment_id = $1
  `,

  // Appointment Status Queries
  // Renamed to be more specific if its purpose is to "activate" or "confirm"
  updateAppointmentToConfirmed: `
    UPDATE Appointments
    SET status = 'Confirmed'
    WHERE appointment_id = $1
  `,

  // Using a single cancellation query with parameters for reason and initiator
  confirmAppointmentCancellation: `
    UPDATE Appointments
    SET status = 'Cancelled',
        cancellation_reason = $1,
        cancellation_initiated_by = $2
    WHERE appointment_id = $3
    RETURNING * -- Return updated row to confirm
  `,

  // Reschedule Queries
  // This query remains the same, as it creates a new "pending" appointment
  rescheduleAppointmentInitiate: `
    WITH original_appointment AS (
      SELECT
        therapist_id, client_id, duration, session_type, notes, price, jitsi_room_name, subscription_id
      FROM Appointments
      WHERE appointment_id = $1
    )
    INSERT INTO Appointments (
      therapist_id, client_id, date_time,
      duration, status, session_type, notes,
      price, jitsi_room_name, created_at, updated_at, rescheduled_from, reschedule_initiated_by, subscription_id
    )
    SELECT
      oa.therapist_id, oa.client_id, $2,
      oa.duration, 'Pending', oa.session_type, oa.notes,
      oa.price, oa.jitsi_room_name, NOW(), NOW(), $1, $3, oa.subscription_id -- $1 is original_id
    FROM original_appointment oa
    RETURNING *
  `,

  // Update original appointment status after a reschedule request has been made
  markOriginalAsRescheduled: `
    UPDATE Appointments
    SET status = 'Rescheduled_Pending_Acceptance', -- More descriptive status
        updated_at = NOW()
    WHERE appointment_id = $1
  `,

  getPendingRescheduleRequest: `
    SELECT * FROM Appointments
    WHERE appointment_id = $1
    AND status = 'Pending' -- Ensure it's the new pending request
  `,

  acceptRescheduleRequest: `
    UPDATE Appointments
    SET status = 'Confirmed',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE appointment_id = $1
    RETURNING *
  `,

  // Decline Reschedule Queries
  // Revert the original appointment's status
  revertOriginalAppointmentStatus: `
    UPDATE Appointments
    SET status = 'Confirmed', -- Revert to confirmed as it was before reschedule initiation
        rescheduled_from = NULL,
        updated_at = NOW()
    WHERE appointment_id = $1
  `,

  // Mark the new (declined) appointment as declined
  markNewAppointmentAsDeclined: `
    UPDATE Appointments
    SET status = 'Declined',
        decline_reason = $2,
        declined_at = NOW(),
        updated_at = NOW()
    WHERE appointment_id = $1
    RETURNING *
  `,

  // Therapist Management Queries
  updateTherapistCancellationCount: `
    UPDATE Therapists
    SET cancellation_count = cancellation_count + 1
    WHERE therapist_id = $1
  `,

  // Removed `cancelAppointment` as it was a duplicate/similar to `confirmAppointmentCancellation`
  // The transaction based `confirmReschedule` and `declineReschedule` also need rethinking
  // given the new approach of marking original and inserting new.
  // The transactional `confirmReschedule` and `declineReschedule` below are problematic.
  // The service layer handles the transaction with multiple queries instead.

  // User Details Queries - Consolidated
  getUserDetails: `
    SELECT email, name FROM Users WHERE user_id = $1
  `,

  CREATE_AVAILABILITY: `
  INSERT INTO Availability (therapist_id, start_timestamp, end_timestamp)
  VALUES ($1, $2, $3)
  RETURNING *;
  `,
  GET_THERAPIST_BY_ID: `
  SELECT * FROM Therapists  
  WHERE therapist_id = $1;
  `,
  GET_AVAILABILITY_BY_THERAPIST_ID: `
  SELECT * FROM Availability
  WHERE therapist_id = $1
  ORDER BY start_timestamp ASC;
  `,
  UPDATE_AVAILABILITY: `
  UPDATE Availability
  SET start_timestamp = $1, end_timestamp = $2
  WHERE availability_id = $3
  RETURNING *;
  `,
  DELETE_AVAILABILITY: `
  DELETE FROM Availability
  WHERE availability_id = $1
  RETURNING *;
  `
}


module.exports = queries;