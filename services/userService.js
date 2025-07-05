// services/userService.js
const pool = require('../config/database'); // Assuming you have a db.js in a config folder for your PostgreSQL connection pool
const userQueries = require('../queries/user.queries');
const UserProfile = require('../models/userProfile');

class UserService {
  constructor() {
    if (!pool) {
      throw new Error('Database pool not initialized. Check your db.js configuration.');
    }
  }

  async getUserProfile(userId) {
    try {
      const result = await pool.query(userQueries.getUserProfile, [userId]);
      if (result.rows.length > 0) {
        return new UserProfile(result.rows[0]);
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile.');
    }
  }

  async updateUserBasicInfo(userId, name, dateOfBirth, profilePicture) {
    try {
      const result = await pool.query(userQueries.updateUserBasicInfo, [userId, name, dateOfBirth, profilePicture]);
      if (result.rows.length > 0) {
        return new UserProfile(result.rows[0]);
      }
      return null;
    } catch (error) {
      console.error('Error updating user basic info:', error);
      throw new Error('Failed to update user basic information.');
    }
  }

  async updateTherapistInfo(therapistId, specialization, experienceYears, bio) {
    try {
      const result = await pool.query(userQueries.updateTherapistInfo, [therapistId, specialization, experienceYears, bio]);
      if (result.rows.length > 0) {
        return new UserProfile({ ...result.rows[0], role_name: 'Therapist' }); // Add role_name for model constructor
      }
      return null;
    } catch (error) {
      console.error('Error updating therapist info:', error);
      throw new Error('Failed to update therapist information.');
    }
  }

  async updateClientInfo(clientId, therapyGoals, preferredTherapyType) {
    try {
      const result = await pool.query(userQueries.updateClientInfo, [clientId, therapyGoals, preferredTherapyType]);
      if (result.rows.length > 0) {
        return new UserProfile({ ...result.rows[0], role_name: 'Client' }); // Add role_name for model constructor
      }
      return null;
    } catch (error) {
      console.error('Error updating client info:', error);
      throw new Error('Failed to update client information.');
    }
  }

  async updateProfilePicture(profilePicture, userId) {
    try {
      const result = await pool.query(userQueries.updateProfilePicture, [profilePicture, userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw new Error('Failed to update profile picture.');
    }
  }

  // You can add more service methods for email verification, password updates, etc.
}

module.exports = new UserService();