const pool = require("../config/database");
const paymentQueries = require("../queries/paymentQueries");

const createPayment = async (
  clientId,
  therapistId,
  amount,
  currency,
  method,
  status,
  type,
  appointmentId
) => {
  const query = paymentQueries.createPayment;
  const values = [
    clientId,
    therapistId,
    amount,
    currency,
    method,
    status,
    type,
    appointmentId,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = { createPayment };
