const {
  getActiveSubscriptionByClientId,
} = require("../models/subscriptionModel");

const subscriptionQueries = {
  getAllPlans: `
        SELECT plan_id, plan_name, description, price, currency, 
               session_limit, duration_days 
        FROM subscription_plans
        WHERE is_active = true
        ORDER BY price ASC
      `,

  // Get a specific plan by ID
  getPlanById: `
        SELECT plan_id, plan_name, description, price, currency, 
               session_limit, duration_days 
        FROM subscription_plans 
        WHERE plan_id = $1 AND is_active = true
      `,

  getActiveSubscriptionByClientId: `SELECT * FROM client_subscriptions WHERE client_id = $1 AND status = 'active' LIMIT 1`,
  checkExistingSubscription: `SELECT * FROM client_subscriptions 
WHERE client_id = $1 AND plan_id = $2 
AND status = 'Active'`,

  // Create a new client subscription
  createClientSubscription: `
        INSERT INTO client_subscriptions 
        (client_id, plan_id, remaining_sessions, start_date, end_date, status)
        VALUES ($1, $2, $3, $4, $5, 'Active')
        RETURNING subscription_id
      `,

  // Record subscription payment
  recordSubscriptionPayment: `
        INSERT INTO subscription_payments 
        (subscription_id, client_id, amount, currency, payment_method, status, transaction_date)
        VALUES ($1, $2, $3, $4, $5, 'Completed', NOW())
        RETURNING subscriptions_payment_id
      `,

  // Get client subscription by ID
  getSubscriptionById: `
      SELECT * FROM client_subscriptions 
      WHERE subscription_id = $1
  `,
};

module.exports = subscriptionQueries;
