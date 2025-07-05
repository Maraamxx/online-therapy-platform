// src/routes/jitsiSessionRoutes.js
const express = require('express');
const jitsiSessionController = require('../controllers/jitsiSessionController');
const authMiddleware = require('../middlewares/auth.middleware'); // Your existing auth middleware

const router = express.Router();

// Endpoint for a therapist or client to join their designated session.
// Requires authentication via session or JWT (handled by authMiddleware).
router.get('/join/:appointmentId', authMiddleware(), jitsiSessionController.joinSession);

// Endpoint to assign/update a Jitsi room name for an appointment.
// This should be called when an appointment is confirmed or created.
// Restricted to 'therapist' or 'admin' roles for security.
router.post('/assign-room/:appointmentId', authMiddleware(['therapist', 'admin']), jitsiSessionController.assignJitsiRoomToAppointment);

module.exports = router;