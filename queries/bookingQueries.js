const { GET_THERAPIST_BY_ID } = require("./viewTherapistsQueries");

queries = {
  GET_THERAPIST_BY_ID: `
  SELECT * FROM Therapists t
  JOIN Users u ON t.user_id = u.user_id
  WHERE t.therapist_id = $1;
  `,
  GET_AVAILABILITY_BY_THERAPIST_ID: `
  SELECT 
    availability_id,
    therapist_id,
    start_timestamp,
    end_timestamp,
    is_booked
  FROM Availability
  WHERE therapist_id = $1
  AND start_timestamp > NOW()
  AND is_booked = false
  ORDER BY start_timestamp ASC;
  `,

  CHECK_THERAPIST_SCHEDULE: `
  SELECT * FROM Availability
  WHERE therapist_id = $1
  AND start_timestamp::timestamp = $2::timestamp
  AND end_timestamp::timestamp = $3::timestamp
  AND is_booked = false;
`,

  GET_VALID_SUBSCRIPTION_AT_TIME: `
  SELECT * FROM Client_Subscriptions
  WHERE client_id = $1
  AND status = 'Active'
  AND remaining_sessions > 0
  AND end_date > $2
  LIMIT 1;
`,


  DECREMENT_SUBSCRIPTION_SESSION: `
  UPDATE Client_Subscriptions
  SET remaining_sessions = remaining_sessions - 1
  WHERE subscription_id = $1;
  `,

  BOOK_APPOINTMENT: `
  INSERT INTO Appointments
  (therapist_id, client_id, date_time, duration, status, session_type, price, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  RETURNING *;
  `
};

module.exports = queries;