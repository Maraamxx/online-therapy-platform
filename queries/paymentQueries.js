/* 
 Payment flow for an individual session.
*/
const paymentQueries = {
  createPayment: `
    INSERT INTO public.payments 
	  (client_id, therapist_id, amount, currency, payment_method, status, transaction_date, payment_type, appointment_id)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
    RETURNING *;
  `,
};

module.exports = paymentQueries;

