const express = require("express");
const router = express.Router();
const {
  simulatePaymentController, renderPaymentPage
} = require("../controllers/paymentController");
const {
  validateSimulatePayment
} = require("../middlewares/validationMiddleware");

// Payment processing
router.get("/:appointmentId", renderPaymentPage);
router.post("/simulate", validateSimulatePayment, simulatePaymentController);
router.get('/success', (req, res) => {
  res.render('payment/success', { 
    payment_id: req.query.payment_id 
  });
});

router.get('/failed', (req, res) => {
  res.render('payment/failed', { 
    error: req.query.error,
    appointment_id: req.query.appointment_id 
  });
});

module.exports = router;
