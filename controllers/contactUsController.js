// controllers/contactUsController.js
const ContactUsService = require('../services/contactUsService');
const {
  body,
  validationResult
} = require('express-validator');

class ContactUsController {
  // Validation middleware for both JSON API and EJS form submissions
  static validateContactForm() {
    return [
      body('name').trim().notEmpty().withMessage('Name is required.'),
      body('email').trim().isEmail().withMessage('Invalid email format.'),
      body('subject').trim().notEmpty().withMessage('Subject is required.'),
      body('message').trim().notEmpty().withMessage('Message is required.'),
    ];
  }

  // Method to render the contact form page (used for GET requests to /api/contact-us/)
  static renderContactForm(req, res) {
    res.render('contact-us', { // Assuming your EJS is views/contact.ejs
      successMessage: null,
      errorMessage: null,
      formData: {} // Initialize empty form data for a fresh load
    });
  }

  // Method to handle the contact form submission (used for POST requests to /api/contact-us/)
  static async submitContactForm(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If validation fails for an EJS form submission, re-render the page with errors
      if (req.accepts('html')) { // Check if the client expects HTML (i.e., it's a form submission)
        return res.render('contact-us', {
          successMessage: null,
          errorMessage: 'Please correct the following errors: ' + errors.array().map(e => e.msg).join(', '),
          formData: req.body // Re-populate form fields on validation error
        });
      } else {
        // Otherwise, it's likely an API call expecting JSON
        return res.status(400).json({
          errors: errors.array()
        });
      }
    }

    const {
      name,
      email,
      subject,
      message
    } = req.body;

    try {
      const newContactMessage = await ContactUsService.createMessage(name, email, subject, message);

      if (req.accepts('html')) {
        // For EJS form submission, re-render the page with success message
        res.render('contact-us', {
          successMessage: 'Your message has been sent successfully!',
          errorMessage: null,
          formData: {} // Clear form data on success
        });
      } else {
        // For API call, send JSON response
        res.status(201).json({
          message: 'Your message has been sent successfully!',
          data: newContactMessage
        });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      if (req.accepts('html')) {
        // For EJS form submission, re-render the page with error message
        res.render('contact-us', {
          successMessage: null,
          errorMessage: error.message || 'Failed to send your message. Please try again later.',
          formData: req.body // Keep form data on server error
        });
      } else {
        // For API call, send JSON error response
        res.status(500).json({
          message: error.message || 'Internal server error.'
        });
      }
    }
  }
}

module.exports = ContactUsController;