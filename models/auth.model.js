// models/auth.model.js
const db = require("../config/database"); // Your database pool
const queries = require("../queries/auth.queries");

class AuthModel {
  // Method to check email existence (can still use pool directly as it's a read operation)
  static async checkEmailExists(email) {
    const { rows } = await db.query(queries.checkEmailExists, [email]);
    return rows.length > 0;
  }

  // NEW: Method to check phone number existence
  // static async checkPhoneNumberExists(phoneNumber) {
  //   const { rows } = await db.query(queries.checkPhoneNumberExists, [
  //     phoneNumber,
  //   ]);
  //   return rows.length > 0;
  // }

  // createUser now takes a 'client' object for transaction management
  static async createUser(client, userData) {
    const { rows } = await client.query(queries.insertUser, [
      userData.name,
      userData.email,
      userData.password,
      userData.dateOfBirth,
      userData.gender,
      // userData.phoneNumber, // NEW: Add phone number
    ]);
    return rows[0];
  }

  // getRoleId can still use pool directly
  static async getRoleId(roleName) {
    const { rows } = await db.query(queries.getRoleId, [roleName]);
    return rows[0]?.role_id;
  }

  // assignUserRole now takes a 'client' object
  static async assignUserRole(client, userId, roleId) {
    await client.query(queries.assignUserRole, [userId, roleId]);
  }

  // createTherapist now takes a 'client' object
  static async createTherapist(client, therapistData) {
    let level = "Junior";
    const years = therapistData.experience_years;
    const verified = therapistData.is_verified || false;

    if (years > 5 && verified) {
      level = "Senior";
    } else if (years >= 3 && verified) {
      level = "Licensed";
    }

    await client.query(queries.insertTherapist, [
      therapistData.userId,
      therapistData.license_number,
      therapistData.specialization,
      therapistData.experience_years,
      therapistData.bio,
      level,
    ]);

    const applicationLink = therapistData.application_link;
    const { rows: applicationRows } = await client.query(
      queries.insertTherapistApplication,
      [therapistData.userId, applicationLink]
    );
    return applicationRows[0].application_id;
  }

  // createClient now takes a 'client' object
  static async createClient(client, clientData) {
    await client.query(queries.insertClient, [
      clientData.userId,
      clientData.therapy_goals,
      clientData.preferred_therapy_type,
    ]);
  }

  // Remaining methods mostly unchanged as they are not part of the multi-step registration transaction
  static async storeRefreshToken(userId, token) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
        userId,
      ]);
      await client.query(queries.storeRefreshToken, [userId, token]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error storing refresh token:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserByEmail(email) {
    // Change from queries.getUserByEmail to queries.getUserDetailsForLogin
    const { rows } = await db.query(queries.getUserDetailsForLogin, [email]);
    return rows[0];
  }

  static async getUserRoles(userId) {
    const { rows } = await db.query(queries.getUserRoles, [userId]);
    return rows.map((role) => role.role_name);
  }

  static async getUserRoles(userId) {
    const { rows } = await db.query(queries.getUserRoles, [userId]);
    return rows.map((role) => role.role_name);
  }

  static async updateLastLogin(userId) {
    await db.query(queries.updateLastLogin, [userId]);
  }

  static async verifyRefreshToken(token) {
    const { rows } = await db.query(queries.verifyRefreshToken, [token]);
    return rows[0]?.user_id;
  }

  static async getUserDetails(userId) {
    const { rows } = await db.query(queries.getUserDetails, [userId]);
    return rows[0];
  }

  static async revokeRefreshToken(token) {
    await db.query(queries.revokeRefreshToken, [token]);
  }

  static async deleteRefreshToken(token) {
    const { rows } = await db.query(queries.deleteRefreshToken, [token]);
    return rows[0];
  }

  static async storePasswordResetToken(token, userId) {
    await db.query(queries.storePasswordResetToken, [token, userId]);
  }

  static async findPasswordResetToken(token) {
    const { rows } = await db.query(queries.findPasswordResetToken, [token]);
    return rows[0];
  }

  static async deletePasswordResetToken(token) {
    await db.query(queries.deletePasswordResetToken, [token]);
  }

  static async updateUserPassword(userId, hashedPassword) {
    await db.query(queries.updateUserPassword, [hashedPassword, userId]);
  }
}

module.exports = AuthModel;
