// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const upload = require('../middlewares/pfp-upload'); // Import the upload middleware

const router = express.Router();

// Route to get a specific user's profile
router.get('/profile/:userId', userController.getUserProfile);

// Route to render the edit profile page
router.get('/profile/:userId/edit', userController.renderEditProfile);

// Route to update user profile (form submission for text fields)
router.post('/profile/:userId/edit', userController.updateUserProfile);

// Route to handle profile picture upload
// Use upload.single('profilePictureFile') because you're uploading a single file named 'profilePictureFile'
router.post('/profile/:userId/upload-picture', upload.single('profilePictureFile'), userController.uploadProfilePicture); // <-- ADD THIS ROUTE

// Placeholder for email/password updates (if you create these routes later)
router.post('/profile/:userId/update-email', userController.updateUserEmail);
router.post('/profile/:userId/update-password', userController.updateUserPassword);


module.exports = router;