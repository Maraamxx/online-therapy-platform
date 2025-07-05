const pool = require("../config/database");
const queries = require("../queries/bookingQueries");
const { createAppointment } = require("../models/appointmentModel");

const isTherapistAvailable = async (therapistId, dateTime) => {
  console.log('Checking therapist availability with:', {
    therapistId,
    dateTime: dateTime.toISOString()
  });
  const query = queries.CHECK_THERAPIST_AVAILABILITY;
  const values = [therapistId, dateTime];
  const result = await pool.query(query, values);
  console.log('Availability check result:', {
    rowsFound: result.rows.length,
    query: query,
    values: values
  });
  return result.rows.length > 0;
};

const isInTherapistSchedule = async (therapistId, dateTime) => {
  console.log('Checking therapist schedule with:', {
    therapistId,
    dateTime: dateTime.toISOString()
  });
  const query = queries.CHECK_THERAPIST_SCHEDULE;
  // Get the end time by adding duration to start time
  const endDateTime = new Date(dateTime.getTime() + (60 * 60 * 1000)); // Adding 1 hour for now
  const values = [therapistId, dateTime, endDateTime];
  const result = await pool.query(query, values);
  console.log('Schedule check result:', {
    rowsFound: result.rows.length,
    query: query,
    values: values
  });
  return result.rows.length > 0;
};

const getActiveSubscriptionAtTime = async (clientId, appointmentTime) => {
  const query = queries.GET_VALID_SUBSCRIPTION_AT_TIME;
  const values = [clientId, appointmentTime];
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};


const decrementSubscription = async (subscriptionId) => {
  const query = queries.DECREMENT_SUBSCRIPTION_SESSION;
  const values = [subscriptionId];
  await pool.query(query, values);
};

const bookAppointment = async ({ therapistId, clientId, date_time, duration, status, session_type, price, availability_id, therapist_id, client_id }) => {
  // Use either camelCase or snake_case parameters
  const finalTherapistId = therapistId || therapist_id;
  const finalClientId = clientId || client_id;

  // Validate required fields
  if (!finalTherapistId) {
    return { success: false, message: "Therapist ID is required" };
  }
  if (!finalClientId) {
    return { success: false, message: "Client ID is required" };
  }
  if (!date_time) {
    return { success: false, message: "Appointment date and time is required" };
  }

  console.log('Booking appointment with:', {
    therapistId: finalTherapistId,
    clientId: finalClientId,
    date_time,
    duration,
    status,
    session_type,
    price,
    availability_id
  });

  const appointmentDateTime = new Date(date_time);
  console.log('Converted appointment datetime:', appointmentDateTime.toISOString());

  // Check for active subscription
  const activeSubscription = await getActiveSubscriptionAtTime(finalClientId, appointmentDateTime);
  console.log('Active subscription check:', activeSubscription);

  // ✅ BEGIN TRANSACTION
  const clientConn = await pool.connect();
  try {
    await clientConn.query("BEGIN");

    // 1. Create the appointment using the model
    const appointment = await createAppointment({
      therapistId: finalTherapistId,
      clientId: finalClientId,
      date_time,
      duration,
      status,
      session_type,
      price,
      subscription_id: activeSubscription ? activeSubscription.subscription_id : null
    });
    console.log('Appointment created:', appointment);

    // 2. Update the availability slot to mark it as booked
    if (availability_id) {
      const updateAvailabilityQuery = `
        UPDATE Availability 
        SET is_booked = true 
        WHERE availability_id = $1
      `;
      await clientConn.query(updateAvailabilityQuery, [availability_id]);
      console.log('Availability slot marked as booked:', availability_id);
    }

    // 3. If there's an active subscription, decrement the remaining sessions
    if (activeSubscription) {
      await decrementSubscription(activeSubscription.subscription_id);
      console.log('Decremented subscription sessions:', activeSubscription.subscription_id);
    }

    await clientConn.query("COMMIT");

    return {
      success: true,
      appointment,
      subscription: activeSubscription ? {
        remaining_sessions: activeSubscription.remaining_sessions - 1,
        end_date: activeSubscription.end_date
      } : null,
      message: activeSubscription
        ? `Appointment booked successfully using subscription. ${activeSubscription.remaining_sessions - 1} sessions remaining.`
        : "Appointment booked successfully"
    };
  } catch (err) {
    await clientConn.query("ROLLBACK");
    console.error("Booking failed:", err);

    // Handle specific database errors
    if (err.code === '22P02') {
      return {
        success: false,
        message: "Invalid input data. Please check all required fields are filled correctly."
      };
    }

    return {
      success: false,
      message: "Internal server error during booking.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    };
  } finally {
    clientConn.release();
  }
};

const getUpcomingAppointmentsForClients = async (clientId) => {
  const query = queries.VIEW_UPCOMING_APPOINTMENTS_CLIENTS;
  const values = [clientId];
  const result = await pool.query(query, values);
  return result.rows;
};

const getUpcomingAppointmentsForTherapists = async (therapistId) => {
  const query = queries.VIEW_UPCOMING_APPOINTMENTS_THERAPISTS;
  const values = [therapistId];
  const result = await pool.query(query, values);
  return result.rows;
};




module.exports = {
  isTherapistAvailable,
  isInTherapistSchedule,
  getActiveSubscriptionAtTime,
  decrementSubscription,
  bookAppointment,
  getUpcomingAppointmentsForClients,
  getUpcomingAppointmentsForTherapists
};