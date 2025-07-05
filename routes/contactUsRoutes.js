// routes/contactUsRoutes.js
const express = require('express');
const router = express.Router();
const ContactUsController = require('../controllers/contactUsController');

// GET /api/contact-us/ - Renders the contact form page (for EJS view)
router.get('/', ContactUsController.renderContactForm);

// POST /api/contact-us/ - Handles the submission of the contact form (for both EJS form and JSON API)
router.post(
  '/',
  ContactUsController.validateContactForm(), // Apply validation middleware
  ContactUsController.submitContactForm
);

module.exports = router;