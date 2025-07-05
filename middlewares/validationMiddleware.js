function validateSimulatePayment(req, res, next) {
  const { client_id, therapist_id, appointment_id, amount } = req.body;

  if (!client_id || !therapist_id || !appointment_id || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  next();
}

module.exports = { validateSimulatePayment }