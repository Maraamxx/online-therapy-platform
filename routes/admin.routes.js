const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Middleware to check if the user is an admin (already there)
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.roles.includes('admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin role required.' });
    }
};

// Admin routes (requires admin role)
router.get("/dashboard", authMiddleware(['admin']), adminController.getAdminPanel);
router.get("/users", authMiddleware(["admin"]), adminController.getAllUsers);

// ✨ IMPORTANT: Place more specific routes BEFORE general dynamic routes ✨

// NEW ADMIN ROUTES (Specific ones first)
router.get('/users/inactive', authMiddleware(['admin']), adminController.getInactiveUsers); // <-- MOVED UP!
router.get('/therapists/active', authMiddleware(['admin']), adminController.getActiveTherapists); // Good place for this too
router.get('/therapists', authMiddleware(['admin']), adminController.getAllTherapists); // Good place for this
router.get('/clients', authMiddleware(['admin']), adminController.getAllClients);     // Good place for this

// Dynamic user routes (more general)
router.get("/users/:userId", authMiddleware(["admin"]), adminController.getProfileById); // <-- This should be AFTER specific /users routes
router.patch('/users/:userId', authMiddleware(['admin']), adminController.adminUpdateUser);
router.patch('/users/:userId/deactivate', authMiddleware(['admin']), adminController.deactivateUser);
router.patch('/users/:userId/activate', authMiddleware(['admin']), adminController.activateUser);


// View (already correctly placed relative to each other)
router.get('/appointments', authMiddleware(['admin']), adminController.viewAppointments);
router.get('/sessions', authMiddleware(['admin']), adminController.viewSessions);
router.get('/payments', authMiddleware(['admin']), adminController.viewPayments);
router.get('/subscription-payments', authMiddleware(['admin']), adminController.viewSubscriptionPayments);
router.get('/plan-subscribers-count', authMiddleware(['admin']), adminController.viewPlanSubscribedUsersCount);


// GET all pending therapist applications
router.get('/therapist-applications/pending', authMiddleware(['admin']), adminController.getPendingTherapistApplications);

// UPDATE therapist application status (approve/reject)
router.post('/therapist-applications/:therapistId/status', authMiddleware(['admin']), adminController.updateTherapistApplicationStatus);

module.exports = router;