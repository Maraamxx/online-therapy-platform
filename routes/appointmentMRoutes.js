const express = require("express");
const router = express.Router();
const appointmentMController = require("../controllers/appointmentMController");
const {
  validateCancel,
  validateReschedule,
} = require("../middlewares/appointmentMMiddleware"); // Assuming this middleware exists and is correctly implemented
const authMiddleware = require("../middlewares/auth.middleware"); // Your authentication middleware

// Client routes
// All client-specific actions should be protected by authMiddleware for 'client' role
router.get(
  "/client",
  authMiddleware(["client"]), // Ensures only authenticated clients can view their appointments
  appointmentMController.getClientAppointments
);

router.post(
  "/:id/reschedule",
  authMiddleware(["client"]), // Client initiates reschedule
  validateReschedule,
  appointmentMController.rescheduleAppointment
);

router.put(
  "/:id/cancel",
  authMiddleware(["client"]), // Client cancels their appointment
  validateCancel,
  appointmentMController.cancelAppointment
);

// Therapist routes
// All therapist-specific actions should be protected by authMiddleware for 'therapist' role
router.get(
  "/therapist",
  authMiddleware(["therapist"]), // Ensures only authenticated therapists can view their appointments
  appointmentMController.getTherapistAppointments
);

router.put(
  "/:id/therapist/reschedule",
  authMiddleware(["therapist"]), // Therapist initiates reschedule
  validateReschedule,
  appointmentMController.therapistReschedule
);

router.put(
  "/:id/therapist/cancel",
  authMiddleware(["therapist"]), // Therapist cancels an appointment
  validateCancel,
  appointmentMController.therapistCancel
);

router.put(
  "/:id/reschedule/accept",
  authMiddleware(["client", "therapist"]), // Both roles might accept/decline requests
  appointmentMController.acceptReschedule
);

router.put(
  "/:id/reschedule/decline",
  authMiddleware(["client", "therapist"]), // Both roles might accept/decline requests
  appointmentMController.declineReschedule
);

// Reschedule form routes
// The forms should also be protected to ensure only relevant users can access them for their appointments.
router.get(
  "/:id/reschedule-form",
  authMiddleware(["client"]), // Client accessing their reschedule form
  appointmentMController.showRescheduleForm
);

router.get(
  "/:id/therapist/reschedule-form",
  authMiddleware(["therapist"]), // Therapist accessing their reschedule form
  appointmentMController.showTherapistRescheduleForm
);


module.exports = router;