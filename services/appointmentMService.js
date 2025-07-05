// services/appointmentMService.js
const pool = require('../config/database');
const handleCancellation = require('./refundService'); // Assuming this handles the payment and updates the original appointment to 'Cancelled'
const queries = require('../config/queries'); // Updated path

// Standard appointment data structure - Keep this here or in a dedicated utility
const standardizeAppointmentData = (appointment) => {
  if (!appointment) return null; // Handle cases where appointment might be null
  return {
    appointment_id: appointment.appointment_id,
    client_id: appointment.client_id,
    therapist_id: appointment.therapist_id,
    date_time: appointment.date_time,
    duration: appointment.duration,
    status: appointment.status?.toLowerCase() || 'pending', // Ensure lowercase
    cancellation_initiated_by: appointment.cancellation_initiated_by,
    cancellation_reason: appointment.cancellation_reason,
    reschedule_initiated_by: appointment.reschedule_initiated_by,
    rescheduled_from: appointment.rescheduled_from,
    decline_reason: appointment.decline_reason,
    created_at: appointment.created_at,
    updated_at: appointment.updated_at,
    // Include other fields if needed for common usage
    session_type: appointment.session_type,
    notes: appointment.notes,
    price: appointment.price,
    jitsi_room_name: appointment.jitsi_room_name,
    subscription_id: appointment.subscription_id,
    accepted_at: appointment.accepted_at,
    declined_at: appointment.declined_at,
  };
};

const getClientAppointments = async (clientId) => {
  const { rows } = await pool.query(queries.getClientAppointments, [clientId]);
  return { rows: rows.map(standardizeAppointmentData) };
};

const getTherapistAppointments = async (therapistId) => {
  const { rows } = await pool.query(queries.getTherapistAppointments, [therapistId]);
  return { rows: rows.map(standardizeAppointmentData) };
};

const rescheduleAppointment = async (originalAppointmentId, newDateTime, initiatorId, initiatorRole) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get the original appointment details
    const getAppointmentQuery = (initiatorRole === 'client') ? queries.getAppointmentByIdAndClient : queries.getAppointmentByIdAndTherapist;
    const getAppointmentValues = [originalAppointmentId, initiatorId];
    const { rows: appointmentRows } = await client.query(getAppointmentQuery, getAppointmentValues);
    const originalAppointment = appointmentRows[0];

    if (!originalAppointment) {
      throw new Error('Appointment not found or not authorized.');
    }

    // 2. Check therapist availability for the new time
    const checkAvailabilityValues = [originalAppointment.therapist_id, newDateTime];
    const { rows: conflicts } = await client.query(queries.checkTherapistAvailability, checkAvailabilityValues);
    if (conflicts.length > 0) {
      throw new Error('Therapist not available at the requested time.');
    }

    // 3. Create the new pending appointment (the reschedule request)
    const rescheduleValues = [originalAppointmentId, newDateTime, initiatorRole];
    const { rows: newApptRows } = await client.query(queries.rescheduleAppointmentInitiate, rescheduleValues);
    const newAppointment = newApptRows[0];

    if (!newAppointment) {
      throw new Error('Failed to create new pending appointment for reschedule.');
    }

    // 4. Mark the original appointment as 'Rescheduled_Pending_Acceptance'
    await client.query(queries.markOriginalAsRescheduled, [originalAppointmentId]);

    await client.query('COMMIT');

    return {
      originalAppointment: standardizeAppointmentData(originalAppointment),
      newAppointment: standardizeAppointmentData(newAppointment)
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cancelAppointment = async (appointmentId, initiatorId, initiatorRole, reason) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get the appointment details to ensure authorization and fetch info for cancellation
    const getAppointmentQuery = (initiatorRole === 'client') ? queries.getAppointmentByIdAndClient : queries.getAppointmentByIdAndTherapist;
    const getAppointmentValues = [appointmentId, initiatorId]; // If you want to strictly check `initiatorId` against `client_id` or `therapist_id`
    const { rows: apptRows } = await client.query(getAppointmentQuery, getAppointmentValues);
    const appointment = apptRows[0];

    if (!appointment) {
      throw new Error('Appointment not found or not authorized to cancel.');
    }

    // 2. Call handleCancellation (assuming this service updates payment and potentially subscription)
    // This function likely needs to be revised to just handle payment/subscription and then return info
    // for the main service to update the appointment status.
    const cancellationResult = await handleCancellation(appointmentId, initiatorRole, reason); // Pass the correct parameters
    // Assuming handleCancellation returns payment_id and refund_amount if applicable
    // If handleCancellation updates the payment status directly, that's fine.

    // 3. Update the appointment status to 'Cancelled'
    const { rows: updatedRows } = await client.query(queries.confirmAppointmentCancellation, [
      reason,
      initiatorRole, // Use the provided role
      appointmentId
    ]);

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Failed to confirm appointment cancellation status.');
    }

    // 4. If a therapist cancelled, increment their cancellation count
    if (initiatorRole === 'therapist') {
      await client.query(queries.updateTherapistCancellationCount, [initiatorId]);
    }

    await client.query('COMMIT');
    return standardizeAppointmentData(updatedRows[0]); // Return the cancelled appointment data
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


const acceptReschedule = async (newAppointmentId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get the details of the NEW appointment (the pending reschedule request)
    const { rows: newApptRows } = await client.query(queries.getPendingRescheduleRequest, [newAppointmentId]);
    const newAppointment = newApptRows[0];

    if (!newAppointment) {
      throw new Error('Reschedule request not found or not in pending state.');
    }

    // 2. Determine user role and authorization
    let role;
    if (newAppointment.therapist_id === userId) {
      role = 'therapist';
    } else if (newAppointment.client_id === userId) {
      role = 'client';
    } else {
      throw new Error('User is not authorized to accept this reschedule request.');
    }

    // 3. Prevent accepting own request
    if (newAppointment.reschedule_initiated_by === role) {
      throw new Error('You cannot accept your own reschedule request.');
    }

    // 4. Accept the new appointment
    const { rows: acceptedRows } = await client.query(queries.acceptRescheduleRequest, [newAppointmentId]);
    const acceptedAppointment = acceptedRows[0];

    if (!acceptedAppointment) {
      throw new Error('Failed to accept reschedule request.');
    }

    // 5. Mark the ORIGINAL appointment as 'Rescheduled' (final status for the old one)
    if (newAppointment.rescheduled_from) {
      await client.query(queries.markOriginalAsRescheduled, [newAppointment.rescheduled_from]);
    }

    // 6. Fetch full details for email notification after all updates
    const { rows: finalDetails } = await client.query(queries.getAppointmentDetails, [newAppointmentId]);
    const detailedAcceptedAppointment = finalDetails[0];

    await client.query('COMMIT');
    return standardizeAppointmentData(detailedAcceptedAppointment);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const declineReschedule = async (newAppointmentId, userId, userProvidedReason) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get the details of the NEW appointment (the pending reschedule request)
    const { rows: newApptRows } = await client.query(queries.getPendingRescheduleRequest, [newAppointmentId]);
    const newAppointment = newApptRows[0];

    if (!newAppointment) {
      throw new Error('Reschedule request not found or not in pending state.');
    }

    // 2. Determine user role and authorization
    let role;
    if (newAppointment.therapist_id === userId) {
      role = 'therapist';
    } else if (newAppointment.client_id === userId) {
      role = 'client';
    } else {
      throw new Error('User is not authorized to decline this reschedule request.');
    }

    // 3. Prevent declining own request
    if (newAppointment.reschedule_initiated_by === role) {
      throw new Error('You cannot decline your own reschedule request.');
    }

    // 4. Revert the original appointment status to 'Confirmed'
    if (newAppointment.rescheduled_from) {
      await client.query(queries.revertOriginalAppointmentStatus, [newAppointment.rescheduled_from]);
    }

    // 5. Mark the new (declined) appointment as 'Declined'
    const { rows: declinedRows } = await client.query(queries.markNewAppointmentAsDeclined, [
      newAppointmentId,
      userProvidedReason,
    ]);
    const declinedAppointment = declinedRows[0];

    if (!declinedAppointment) {
      throw new Error('Failed to mark reschedule request as declined.');
    }

    // 6. Fetch full details for email notification after all updates
    const { rows: finalDetails } = await client.query(queries.getAppointmentDetails, [newAppointmentId]);
    const detailedDeclinedAppointment = finalDetails[0];

    await client.query('COMMIT');
    return standardizeAppointmentData(detailedDeclinedAppointment);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getClientAppointments,
  getTherapistAppointments,
  rescheduleAppointment, // Client and Therapist will use this
  cancelAppointment,
  acceptReschedule,
  declineReschedule,
};