const pool = require("../config/database")
const { createPayment } = require("../models/paymentModel");
const { getAppointmentById, updateAppointmentStatus } = require("../models/appointmentModel");

async function simulatePayment(client, paymentData) {
  const { clientId, therapistId, appointmentId, amount, paymentMethod, paymentDetails } = paymentData;

  // 1. Get appointment with required fields
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  // 2. Convert price to number and validate
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) throw new Error("Invalid price value");

  // 3. Determine therapist level (with fallback)
  const therapistLevel = appointment.level || 'licensed';

  try {
    await client.query("BEGIN");

    // Create payment record
    const paymentQuery = `
      INSERT INTO public.payments 
      (client_id, therapist_id, amount, currency, payment_method, status, transaction_date, payment_type, appointment_id)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
      RETURNING *;
    `;

    const paymentValues = [
      clientId,
      therapistId,
      numericAmount,
      'EGP',
      paymentMethod || 'mock',
      'Completed',
      'session',
      appointmentId
    ];

    const paymentResult = await client.query(paymentQuery, paymentValues);

    // Update appointment status
    const updateQuery = `
      UPDATE appointments 
      SET status = 'Confirmed' 
      WHERE appointment_id = $1
      RETURNING *;
    `;
    await client.query(updateQuery, [appointmentId]);

    await client.query("COMMIT");
    return paymentResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment simulation error:", error);
    throw error;
  }
}

module.exports = { simulatePayment };
