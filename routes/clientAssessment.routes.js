// routes/clientAssessment.routes.js
const express = require("express");
const router = express.Router();
const ClientAssessmentController = require("../controllers/clientAssessment.controller");
const authMiddleware = require("../middlewares/auth.middleware"); // Assuming you have an auth middleware

// Middleware to ensure user is authenticated and is a client
router.use(authMiddleware()); // Protect all routes in this router
router.use(authMiddleware(["client"])); // Only clients can access these routes

// Show the assessment page (GET /api/assessment)
router.get("/", ClientAssessmentController.showAssessmentPage);

// Handle assessment submission and therapist matching (POST /api/assessment/match-therapist)
router.post("/match-therapist", ClientAssessmentController.matchTherapist);

module.exports = router;