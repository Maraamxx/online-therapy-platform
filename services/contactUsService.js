// services/contactUsService.js
const pool = require('../config/database'); // Assuming you have a db.js in config folder for pg pool
const ContactUsQueries = require('../queries/contactUsQueries');
const ContactMessage = require('../models/ContactMessage');

class ContactUsService {
  static async createMessage(name, email, subject, message) {
    try {
      const query = ContactUsQueries.createContactMessage();
      const values = [name, email, subject, message];
      const result = await pool.query(query, values);

      const { id, created_at } = result.rows[0];
      return new ContactMessage(id, name, email, subject, message, created_at);
    } catch (error) {
      console.error('Error creating contact message in service:', error);
      throw new Error('Failed to create contact message.');
    }
  }
}

module.exports = ContactUsService;