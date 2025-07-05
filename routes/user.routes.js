// routes/user.routes.js (corrected)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller'); // Make sure this path is correct
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/pfp-upload');

router.use(authMiddleware()); // This applies authMiddleware to all subsequent routes

// Regular user profile routes
router.get('/dashboard', userController.showProfilePage);

// --- NEW ROUTE for the dedicated Edit Profile Page ---
router.get('/profile/edit', userController.showEditProfilePage); // This is new

// --- CORRECTED PROFILE UPDATE ROUTES ---
// All specific profile section updates will now hit the generic updateProfile controller
// and the 'type' of update will be inferred by the service based on the endpoint or req.body content.
router.put('/profile/basic', userController.updateProfile); // Redirect to generic updateProfile
router.put('/profile/client', userController.updateProfile); // Redirect to generic updateProfile
router.put('/profile/therapist', userController.updateProfile); // Redirect to generic updateProfile

// Account Settings (from modals) - Frontend uses POST, backend uses PATCH/POST
// Adjusting backend to POST to match frontend, and pointing to existing controllers
// router.post('/update-email', userController.updateEmail); // This function exists in controller
// router.post('/change-password', userController.updatePassword); // This function exists in controller

// router.get('/verify-email', (req, res) => {
//     res.render('user/verify-email', { title: 'Verify Email' });
// });

// Profile picture upload - Frontend and backend already match (POST /profile-picture)
router.post(
    '/profile-picture',
    upload.single('profile_picture'),
    userController.uploadProfilePicture // This function exists in controller
);

module.exports = router;