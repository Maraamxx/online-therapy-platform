const express = require('express');
const router = express.Router();

// Public routes that don't require authentication
router.get('/about', (req, res) => {
    res.render('about', { title: 'About INNERAURA. - Our Mission & Vision' });
});

module.exports = router; 