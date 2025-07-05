// queries/contactUsQueries.js
class ContactUsQueries {
  static createContactMessage() {
    return `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, subject, message, created_at;
    `;
  }
}

module.exports = ContactUsQueries;