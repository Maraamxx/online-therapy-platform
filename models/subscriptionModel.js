const pool = require("../config/database");
const subscriptionQueries = require("../queries/subscriptionQueries");

const SubscriptionModel = {
  getAllPlans: async () => {
    const result = await pool.query(subscriptionQueries.getAllPlans);
    return result.rows;
  },

  getPlanById: async (planId) => {
    const result = await pool.query(subscriptionQueries.getPlanById, [planId]);
    return result.rows[0];
  },

  getActiveSubscriptionByClientId: async (clientId) => {
    // Adjust this query to your ORM / raw SQL
    // The key is to find a subscription for clientId that is still active
    const result = await pool.query(
      subscriptionQueries.getActiveSubscriptionByClientId,
      [clientId]
    );
    return result.rows[0] || null;
  },

  createSubscriptionWithPayment: async (
    clientId,
    planId,
    amount,
    currency,
    paymentMethod
  ) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN"); // Start transaction

      // 1. First check for existing active subscription
      const existing = await client.query(
        subscriptionQueries.checkExistingSubscription,
        [clientId, planId]
      );

      if (existing.rows.length > 0) {
        throw {
          code: "SUBSCRIPTION_EXISTS",
          message: "You already have an active subscription. Please cancel it before subscribing to another plan.",
          statusCode: 409,
        };
      }

      // 2. Get plan details
      const plan = await client.query(subscriptionQueries.getPlanById, [
        planId,
      ]);
      if (!plan.rows.length) {
        await client.query("ROLLBACK");
        throw new Error("Invalid plan ID");
      }

      // 3. Verify amount matches plan price
      if (parseFloat(amount) !== parseFloat(plan.rows[0].price)) {
        await client.query("ROLLBACK");
        throw new Error("Amount doesn't match plan price");
      }

      // 4. Create subscription and payment records
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + plan.rows[0].duration_days);

      const subRes = await client.query(
        subscriptionQueries.createClientSubscription,
        [
          clientId,
          planId,
          plan.rows[0].session_limit,
          startDate.toISOString(),
          endDate.toISOString(),
        ]
      );

      const payRes = await client.query(
        subscriptionQueries.recordSubscriptionPayment,
        [
          subRes.rows[0].subscription_id,
          clientId,
          amount,
          currency,
          paymentMethod,
        ]
      );

      await client.query("COMMIT");

      return {
        subscriptionId: subRes.rows[0].subscription_id,
        paymentId: payRes.rows[0].subscriptions_payment_id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }

      console.error("Subscription Error:", error);
      error.statusCode = error.statusCode || 500;
      throw error;
    }
  },

  getSubscriptionById: async (subscriptionId) => {
    const query = subscriptionQueries.getSubscriptionById;
    const result = await pool.query(query, [subscriptionId]);
    return result.rows[0];
  },
};

module.exports = SubscriptionModel;
