// controllers/userController.js
const userService = require('../services/userService');

class UserController {
  async getProfilePage(req, res) {
    try {
      // In a real application, userId would come from session or JWT
      const userId = req.params.userId || 1; // Example: assuming user ID 1 for now

      const userProfile = await userService.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).send('User not found.');
      }

      res.render('user/profile', { user: userProfile });
    } catch (error) {
      console.error('Error loading profile page:', error);
      res.status(500).send('Error loading profile page.');
    }
  }

  async getEditProfilePage(req, res) {
    try {
      const userId = req.params.userId || 1; // Example: assuming user ID 1 for now
      const userProfile = await userService.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).send('User not found.');
      }

      res.render('user/editProfile', { user: userProfile });
    } catch (error) {
      console.error('Error loading edit profile page:', error);
      res.status(500).send('Error loading edit profile page.');
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.params.userId || 1; // Example: assuming user ID 1 for now
      const { name, dateOfBirth, profilePicture, specialization, experienceYears, bio, therapyGoals, preferredTherapyType } = req.body;

      // Update basic user info
      await userService.updateUserBasicInfo(userId, name, dateOfBirth, profilePicture);

      // Check role and update specific info
      const currentUserProfile = await userService.getUserProfile(userId); // Fetch to get current role

      if (currentUserProfile.isTherapist()) {
        await userService.updateTherapistInfo(userId, specialization, experienceYears, bio);
      } else if (currentUserProfile.isClient()) {
        await userService.updateClientInfo(userId, therapyGoals, preferredTherapyType);
      }

      res.redirect(`/api/profile/${userId}`); // Redirect to updated profile page
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error updating profile.');
    }
  }

  async updateProfilePicture(req, res) {
    try {
      const userId = req.params.userId || 1; // Get user ID
      const { profilePicture } = req.body; // Assuming profilePicture is sent in the body

      if (!profilePicture) {
        return res.status(400).send('Profile picture URL is required.');
      }

      const success = await userService.updateProfilePicture(profilePicture, userId);

      if (success) {
        res.status(200).json({ message: 'Profile picture updated successfully.' });
      } else {
        res.status(500).json({ message: 'Failed to update profile picture.' });
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).send('Error updating profile picture.');
    }
  }
}

module.exports = new UserController();