// models/ContactMessage.js
class ContactMessage {
  constructor(id, name, email, subject, message, createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.subject = subject;
    this.message = message;
    this.createdAt = createdAt;
  }
}

module.exports = ContactMessage;