const pool = require('../config/database');
const queries = require('../config/queries');

async function handleCancellation(appointmentId, cancellationInitiatedBy, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get appointment details with subscription info
    const appointmentQuery = queries.selectAppointmentById; // Use the query from your config
    const appointmentValues = [appointmentId];
    const appointmentRes = await client.query(appointmentQuery, appointmentValues);
    const appointment = appointmentRes.rows[0];

    if (!appointment) throw new Error('Appointment not found');

    const hoursLeft = (new Date(appointment.date_time) - new Date()) / (1000 * 60 * 60);

    // 2. Therapist-initiated cancellation
    if (hoursLeft <= 0) {
      throw new Error("Cannot cancel a past appointment. Please contact support if you need assistance.");
    }
    if (cancellationInitiatedBy === 'therapist') {
      // Return session credit if subscription
      if (appointment.subscription_id) {
        const sessionQuery = queries.incrementRemainingSessionById; // Use the query from your config
        const sessionValues = [appointment.subscription_id];
        await client.query(sessionQuery, sessionValues);
      }
      // Full refund if pay-per-session
      else {
        const paymentQuery = queries.updatePaymenStatusTherapistCancel; // Use the query from your config
        const paymentValues = [appointment.payment_amount, appointment.payment_id];
        await client.query(paymentQuery, paymentValues);
      }

      // Track therapist cancellations
      const therapistCancellationQuery = queries.updateTherapistCancellationCount; // Use the query from your config
      const therapistCancellationValues = [appointment.therapist_id];
      await client.query(therapistCancellationQuery, therapistCancellationValues);

      await client.query('COMMIT');
      return { success: true, action: 'full_refund' };
    }

    // 3. Client-initiated cancellation
    if (hoursLeft > 12) {
      // Early cancellation - no penalty
      if (appointment.subscription_id) {
        // Just mark as Cancelled, keep session credit
        const appointmentQuery = queries.updateAppointmentStatusById; // Use the query from your config
        const appointmentValues = [appointmentId];
        await client.query(appointmentQuery, appointmentValues);
      } else {
        // Full refund for pay-per-session
        const paymentQuery = queries.updatePaymentStatusClientEarlyCancel; // Use the query from your config
        const paymentValues = [appointment.payment_amount, appointment.payment_id];
        await client.query(paymentQuery, paymentValues);
      }
    }
    else if (hoursLeft > 0) {
      // Late cancellation (<12 hours)
      if (appointment.subscription_id) {
        // Calculate session value
        const sessionValue = appointment.plan_price / appointment.session_limit;
        const refundAmount = sessionValue * 0.75;

        // Apply immediate partial refund
        const refundQuery = queries.updatePaymentStatusClientLateCancel;
        const refundValues = [refundAmount, appointment.payment_id];
        await client.query(refundQuery, refundValues);

        // Note: no session increment — session is still considered used
      } else {
        // Pay-per-session: partial refund (75%)
        const refundAmount = appointment.payment_amount * 0.75;
        const paymentQuery = queries.updatePaymentStatusClientLateCancel;
        const paymentValues = [refundAmount, appointment.payment_id];
        await client.query(paymentQuery, paymentValues);
      }
    }


    // 4. Update appointment status
    const updateStatusQuery = queries.confirmAppointmentCancellation;
    const updateStatusValues = [reason, cancellationInitiatedBy, appointmentId];
    await client.query(updateStatusQuery, updateStatusValues);

    await client.query('COMMIT');
    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancellation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}



module.exports = handleCancellation;

