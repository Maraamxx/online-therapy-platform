const SubscriptionService = require("../services/subscriptionService");

const SubscriptionController = {
  getAllPlans: async (req, res) => {
    try {
      const plans = await SubscriptionService.getAllPlans();
      res.render("subscriptions/plans", { plans });
      return;
    } catch (err) {
      console.log("Error fetching subscription plans:", err.message);
      res.status(500).json({ message: "Error fetching subscription plans" });
    }
  },

  getPlanById: async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const plan = await SubscriptionService.getPlanById(planId);
      res.render("subscriptions/plan-details", { plan });
      return;
    } catch (err) {
      res.status(500).json({ message: "Error fetching subscription plan" });
      console.log("Error fetching subscription plan:", err.message);
    }
  },

  showSubscriptionPage: async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const plan = await SubscriptionService.getPlanById(planId);

      res.render("subscriptions/subscribe", {
        plan,
        paymentMethods: ["Vodafone Cash", "Orange Money", "Etisalat Cash", "Credit Card"],
        // clientId, // Assuming you have authenticated user
      });
      return;
    } catch (err) {
      res.status(500).json({ message: "Error fetching subscription plans" });
      console.log("Error fetching subscription plans:", err.message);
    }
  },

  createSubscription: async (req, res) => {
    try {
      const { clientId, planId, amount, currency, paymentMethod } = req.body;

      if (!clientId || !planId || !amount || !currency || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields." });
      }


      const result =
        await SubscriptionService.createClientSubscriptionWithPayment(
          clientId,
          planId,
          amount,
          currency,
          paymentMethod
        );

      res.status(201).json({
        message: "Subscription and payment created successfully.",
        data: result,
      });
      return;
    } catch (error) {
      if (error.code === "23505" && error.constraint === 'one_active_sub_per_user') {
        return res.status(400).json({
          success: false,
          message: "You already have an active subscription. Please cancel it before subscribing to another plan.",
        });
      }

      console.error("Controller Error:", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to create subscription and payment",
        });
    }
  },

  getSubscriptionById: async (req, res) => {
    try {
      const {subscriptionId} = req.query;

      // fetch subscription and plan details from your database
      const subscription = await SubscriptionService.getSubscriptionById(
        subscriptionId
      );
      const plan = await SubscriptionService.getPlanById(subscription.plan_id);

      res.render("subscriptions/confirmation", { subscription, plan });
      return;
    } catch (err) {
      console.error("Error fetching subscription by ID:", err.message);
      res.status(500).json({ message: "Error fetching subscription details" });
    }
  },
};

module.exports = SubscriptionController;
