// routes/index.js (example, adjust as per your routing setup)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware'); // Your auth middleware
const therapistController = require('../controllers/therapist.controller'); // Your new therapist controller

// ... other routes

// Route for the therapist pending application page
router.get('/application-pending', authMiddleware(['therapist']), therapistController.renderApplicationPending);

// ... other routes

module.exports = router;