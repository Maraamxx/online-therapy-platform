const { simulatePayment } = require("../services/paymentService");
const { getAppointmentById } = require("../models/appointmentModel");
const pool = require("../config/database");

async function simulatePaymentController(req, res) {
  // Check if user is logged in
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      redirect: "/api/auth/login"
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Received payment request:", req.body);
    const paymentData = {
      clientId: req.body.client_id,
      therapistId: req.body.therapist_id,
      appointmentId: req.body.appointment_id,
      amount: req.body.amount,
      paymentMethod: req.body.payment_method,
      paymentDetails: req.body.payment_details || {}
    };

    console.log("Processing payment with data:", paymentData);
    const result = await simulatePayment(client, paymentData);
    console.log("Payment processed successfully:", result);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Payment processed successfully",
      redirect: `/appointments/management/client`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error in simulatePaymentController:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
      error: error.message
    });
  } finally {
    client.release();
  }
}

async function renderPaymentPage(req, res) {
  // Check if user is logged in
  if (!req.session || !req.session.user) {
    console.log("No session found in renderPaymentPage, redirecting to login");
    return res.redirect('/api/auth/login');
  }

  try {
    const appointmentId = parseInt(req.params.appointmentId);
    if (isNaN(appointmentId)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
        error: "Appointment ID must be a number"
      });
    }

    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
        error: "No appointment found with the provided ID"
      });
    }

    let price;
    switch (appointment.level) {
      case "junior":
        price = 150;
        break;
      case "licensed":
        price = 300;
        break;
      case "senior":
        price = 500;
        break;
      default:
        price = 300;
    }

    res.render("payment/payment", {
      appointment,
      price,
      user: req.session.user // Pass user data to the view
    });
  } catch (error) {
    console.error("Error in renderPaymentPage:", error);
    res.status(500).json({
      message: "Failed to load payment page",
      error: error.message
    });
  }
}

module.exports = { simulatePaymentController, renderPaymentPage };
