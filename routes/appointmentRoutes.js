const express = require("express");
const router = express.Router();
const { renderPaymentPage, simulatePaymentController } = require("../controllers/paymentController");
const {
    renderBookingPage,
    bookAppointment,
    viewClientAppointments
} = require("../controllers/appointmentController");
const authMiddleware = require('../middlewares/auth.middleware');
const { validateSimulatePayment } = require("../middlewares/validationMiddleware");

// Booking routes
router.get('/book/:therapistId', authMiddleware(), renderBookingPage);
router.post('/book', authMiddleware(), bookAppointment);

// Payment routes
router.get('/payment/:appointmentId', authMiddleware(), renderPaymentPage);
router.post('/payment/simulate', authMiddleware(), validateSimulatePayment, simulatePaymentController);

// Client appointments route
router.get('/appointments', authMiddleware(), viewClientAppointments);

module.exports = router;
