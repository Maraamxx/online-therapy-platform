const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Existing routes
router.get('/plans', subscriptionController.getAllPlans);
router.get('/plans/:planId', subscriptionController.getPlanById);

// GET subscription page with plan details
router.get('/subscribe/:planId', subscriptionController.showSubscriptionPage);

// POST process payment and create subscription
router.post('/payment', subscriptionController.createSubscription);


router.get("/payment", subscriptionController.getSubscriptionById);
  
module.exports = router;