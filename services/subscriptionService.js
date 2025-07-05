const SubscriptionModel = require("../models/subscriptionModel");

const SubscriptionService = {
  getAllPlans: async () => {
    const plans = await SubscriptionModel.getAllPlans();
    if (!plans.length) {
      throw new Error("No active subscription plans found.");
    }
    return plans;
  },

  getPlanById: async (planId) => {
    const plan = await SubscriptionModel.getPlanById(planId);
    if (!plan) {
      throw new Error(`Subscription plan with ID ${planId} not found.`);
    }
    return plan;
  },

  createClientSubscriptionWithPayment: async (
    clientId,
    planId,
    amount,
    currency,
    paymentMethod
  ) => {
    if (!clientId || !planId || !amount || !currency || !paymentMethod) {
      throw new Error("All fields are required");
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // CHECK IF CLIENT ALREADY HAS AN ACTIVE SUBSCRIPTION
    const activeSub = await SubscriptionModel.getActiveSubscriptionByClientId(clientId);
    if (activeSub) {
      throw new Error("You already have an active subscription. Please cancel it before subscribing to another plan.");
    }
    
    const payment = await SubscriptionModel.createSubscriptionWithPayment(
      clientId,
      planId,
      amount,
      currency,
      paymentMethod
    );

    return payment;
  },
  getSubscriptionById: async (subscriptionId) => {
    const subscription = await SubscriptionModel.getSubscriptionById(
      subscriptionId
    );
    if (!subscription) {
      throw new Error(`Subscription with ID ${subscriptionId} not found.`);
    }
    return subscription;
  },
};

module.exports = SubscriptionService;
