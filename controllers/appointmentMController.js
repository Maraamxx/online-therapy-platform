// controllers/appointmentMController.js
const appointmentMService = require("../services/appointmentMService");
const emailService = require("../services/emailService");
const queries = require("../config/queries"); // Updated path
const pool = require("../config/database"); // Still needed for some direct queries or in case service doesn't return full details

// --- Shared Helper Functions (Keep these or move to a separate utilities file) ---
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "check-circle";
    case "cancelled":
      return "x-circle";
    case "declined":
      return "x-octagon";
    case "rescheduled":
      return "refresh-cw"; // This applies to the *old* appointment after a reschedule
    case "rescheduled_pending_acceptance":
      return "clock"; // New status for old appointment
    case "pending":
      return "clock"; // New pending request
    default:
      return "alert-circle";
  }
};

const getStatusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-800 border border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border border-red-200";
    case "declined":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case "rescheduled":
    case "rescheduled_pending_acceptance": // Styling for the original appointment that's pending acceptance
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "pending": // Styling for the new pending reschedule request
      return "bg-yellow-50 text-yellow-800 border border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
};

const addCancellationInitiatorNames = async (appointments) => {
  // This can be simplified if the service already includes full user details
  for (const appt of appointments) {
    if (
      appt.status.toLowerCase() === "cancelled" &&
      appt.cancellation_initiated_by
    ) {
      // Assuming 'cancellation_initiated_by' is 'client' or 'therapist'
      appt.cancellation_initiator_name =
        appt.cancellation_initiated_by.charAt(0).toUpperCase() +
        appt.cancellation_initiated_by.slice(1);
    }
  }
};

const categorizeAppointments = (appointments) => {
  const now = new Date(); // Define the join window in milliseconds (15 minutes * 60 seconds * 1000 milliseconds)
  const joinWindowMs = 15 * 60 * 1000;

  const categorized = {
    upcoming: [],
    pending: [],
    rescheduled: [],
    past: [],
    cancelled: [],
    declined: [],
  };

  appointments.forEach((a) => {
    const apptDateTime = new Date(a.date_time);
    const statusLower = a.status.toLowerCase();

    // Calculate the "can join from" time
    const canJoinFromTime = new Date(apptDateTime.getTime() - joinWindowMs); // Condition for Upcoming Appointments

    // An appointment is 'upcoming' if it's confirmed AND its *actual start time* is in the future.
    // The 'joinable' status will be added separately, perhaps by the frontend based on `canJoinFromTime`.
    if (statusLower === "confirmed" && apptDateTime > now) {
      // Add a flag to indicate if the session is currently joinable
      a.isJoinable = now >= canJoinFromTime && now <= apptDateTime; // true if within 15 mins before or at the exact time
      categorized.upcoming.push(a);
    } else if (statusLower === "pending") {
      categorized.pending.push(a);
    } else if (
      statusLower === "rescheduled_pending_acceptance" ||
      statusLower === "rescheduled"
    ) {
      categorized.rescheduled.push(a);
    } else if (statusLower === "cancelled") {
      categorized.cancelled.push(a);
    } else if (statusLower === "declined") {
      categorized.declined.push(a);
    } else if (
      apptDateTime <= now &&
      !["cancelled", "declined"].includes(statusLower)
    ) {
      // Condition for Past Appointments
      // An appointment is truly 'past' only after its actual end time, or if the join window has passed
      // and it wasn't joined. For simplicity, we'll keep it as "actual time passed".
      // You might consider adding a grace period for joining *after* the session start time as well.
      // For now, if current time is past the appointment's start time and it's not handled by other categories, it's past.
      categorized.past.push(a);
    }
  });
  return categorized;
};

// --- Main Controller Functions ---

const handleAppointmentListing = async (req, res, viewType, serviceMethod) => {
  try {
    // FIX: Use req.session.user.userId as per your logs
    const userId = req.session.user.userId;
    const { rows } = await serviceMethod(userId); // Pass userId // Add cancellation initiator names if needed, though service might provide more details

    await addCancellationInitiatorNames(rows);

    const isApiRequest =
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept === "application/json";

    if (isApiRequest) {
      return res.json({
        success: true,
        appointments: rows,
        timestamp: new Date().toISOString(),
      });
    }

    const categorized = categorizeAppointments(rows);
    res.render("pages/appointmentsList", {
      ...categorized,
      viewType,
      getStatusIcon,
      getStatusVariant,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error in ${viewType} appointments:`, error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    const errorMessage =
      "Failed to fetch appointments. Please try again later.";

    if (
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept === "application/json"
    ) {
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: error.message, // More detailed error for API
        timestamp: new Date().toISOString(),
      });
    }

    res.status(statusCode).render("error", {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};

exports.getClientAppointments = async (req, res) => {
  await handleAppointmentListing(
    req,
    res,
    "client",
    appointmentMService.getClientAppointments
  );
};

exports.getTherapistAppointments = async (req, res) => {
  await handleAppointmentListing(
    req,
    res,
    "therapist",
    appointmentMService.getTherapistAppointments
  );
};

// Direct data return function (useful for other services/controllers if they need raw data)
exports.getClientAppointmentsData = async (req) => {
  try {
    // FIX: Use req.session.user.userId here too
    const userId = req.session.user.userId;
    const { rows } = await appointmentMService.getClientAppointments(userId); // Pass userId
    return rows;
  } catch (error) {
    throw error;
  }
};

// Consolidated Reschedule Function
const handleReschedule = async (req, res, initiatorRole) => {
  try {
    if (!req.params.id || !req.body.newDateTimeString) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and new date/time are required",
        timestamp: new Date().toISOString(),
      });
    }

    const { originalAppointment, newAppointment } =
      await appointmentMService.rescheduleAppointment(
        req.params.id, // Original appointment ID
        req.body.newDateTimeString,
        req.session.user.userId, // FIX: Use req.session.user.userId
        initiatorRole
      ); // Fetch full details of the NEW pending appointment for email

    const { rows: detailedNewApptRows } = await pool.query(
      queries.getAppointmentDetails,
      [newAppointment.appointment_id]
    );
    const detailedNewAppointment = detailedNewApptRows[0];

    if (!detailedNewAppointment) {
      throw new Error("Failed to retrieve detailed new appointment for email.");
    } // Determine recipient for email (the *other* party)

    let recipientEmail, recipientName, initiatorName;
    if (initiatorRole === "client") {
      recipientEmail = detailedNewAppointment.therapist_email;
      recipientName = detailedNewAppointment.therapist_name;
      initiatorName = detailedNewAppointment.client_name;
    } else {
      // therapist initiated
      recipientEmail = detailedNewAppointment.client_email;
      recipientName = detailedNewAppointment.client_name;
      initiatorName = detailedNewAppointment.therapist_name;
    }

    if (recipientEmail) {
      await emailService.sendMail(
        recipientEmail,
        "Appointment Reschedule Request",
        `<p>Dear ${recipientName},</p>
         <p><strong>${initiatorName}</strong> has requested to reschedule your appointment.</p>
         <ul>
           <li><strong>Old Date & Time:</strong> ${new Date(
          originalAppointment.date_time
        ).toLocaleString("en-US")}</li>
           <li><strong>Requested New Date & Time:</strong> ${new Date(
          detailedNewAppointment.date_time
        ).toLocaleString("en-US")}</li>
         </ul>
         <p>Please review and respond to the request in your dashboard.</p>`
      );
    }

    const isApiRequest =
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept === "application/json";

    if (isApiRequest) {
      return res.json({
        success: true,
        originalAppointment,
        newAppointment, // Return both for clarity
        message: "Reschedule request sent successfully.",
        timestamp: new Date().toISOString(),
      });
    }

    res.render("pages/rescheduleSuccess", {
      viewType: initiatorRole,
      appointment: detailedNewAppointment, // Pass the new pending appointment
      timestamp: new Date().toISOString(),
      message: "Your reschedule request has been sent successfully.",
    });
  } catch (error) {
    console.error("Reschedule appointment error:", error);
    const statusCode =
      error.message.includes("not found") || error.message.includes("available")
        ? 400
        : 500;
    const errorMessage = error.message;

    const isApiRequest =
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept === "application/json";

    if (isApiRequest) {
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(statusCode).render("error", {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};

exports.rescheduleAppointment = (req, res) =>
  handleReschedule(req, res, "client");
exports.therapistReschedule = (req, res) =>
  handleReschedule(req, res, "therapist");

// Consolidated Cancel Function
const handleCancel = async (req, res, initiatorRole) => {
  try {
    const { id: appointmentId } = req.params;
    const { reason } = req.body; // Reason should come from the body for both client/therapist

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Cancellation reason is required." });
    } // Call the service with appropriate parameters

    const cancelledAppointment = await appointmentMService.cancelAppointment(
      appointmentId,
      req.session.user.userId, // FIX: Use req.session.user.userId
      initiatorRole,
      reason
    );

    if (!cancelledAppointment) {
      throw new Error(
        "Failed to cancel appointment. It might not exist or you are not authorized."
      );
    } // Fetch full details of the CANCELLED appointment for email (service should return it now)

    const { rows: detailedCancelledApptRows } = await pool.query(
      queries.getAppointmentDetails,
      [appointmentId]
    );
    const detailedCancelledAppointment = detailedCancelledApptRows[0];

    if (!detailedCancelledAppointment) {
      // This case should ideally not happen if service returns a valid cancelledAppointment
      console.warn(
        "Could not retrieve full details for cancelled appointment email, sending generic."
      );
      return res.json({
        success: true,
        message:
          "Appointment cancelled, but email could not be sent with full details.",
      });
    } // Determine recipient and initiator for email

    let recipientEmail, recipientName, initiatorName;
    if (initiatorRole === "client") {
      recipientEmail = detailedCancelledAppointment.therapist_email;
      recipientName = detailedCancelledAppointment.therapist_name;
      initiatorName = detailedCancelledAppointment.client_name;
    } else {
      // therapist initiated
      recipientEmail = detailedCancelledAppointment.client_email;
      recipientName = detailedCancelledAppointment.client_name;
      initiatorName = detailedCancelledAppointment.therapist_name;
    }

    if (recipientEmail) {
      await emailService.sendMail(
        recipientEmail,
        "Appointment Cancellation Notification",
        `<p>Dear ${recipientName},</p>
         <p>The appointment scheduled for <strong>${new Date(
          detailedCancelledAppointment.date_time
        ).toLocaleString(
          "en-US"
        )}</strong> has been cancelled by <strong>${initiatorName}</strong>.</p>
         <p><strong>Reason:</strong> ${
          detailedCancelledAppointment.cancellation_reason ||
          "No reason provided."
        }</p>
         <p>If you have questions, please contact support.</p>`
      );
    }

    return res.json({
      success: true,
      appointment: cancelledAppointment,
      message: "Appointment cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelAppointment = (req, res) => handleCancel(req, res, "client");
exports.therapistCancel = (req, res) => handleCancel(req, res, "therapist");

exports.acceptReschedule = async (req, res) => {
  try {
    const details = await appointmentMService.acceptReschedule(
      req.params.id, // This is the new pending appointment ID
      req.session.user.userId // FIX: Use req.session.user.userId
    );

    if (!details) {
      throw new Error(
        "Could not process the request or appointment not found."
      );
    } // Determine who initiated and who accepted based on the 'details' object

    let recipientEmail, recipientName, initiatorName, acceptedByName;
    if (details.reschedule_initiated_by === "client") {
      // Client initiated, therapist accepted. Email client.
      recipientEmail = details.client_email;
      recipientName = details.client_name;
      initiatorName = details.client_name; // Who initiated the request
      acceptedByName = details.therapist_name; // Who accepted it
    } else {
      // Therapist initiated, client accepted. Email therapist.
      recipientEmail = details.therapist_email;
      recipientName = details.therapist_name;
      initiatorName = details.therapist_name;
      acceptedByName = details.client_name;
    }

    if (recipientEmail) {
      await emailService.sendMail(
        recipientEmail,
        "Reschedule Request Accepted",
        `<p>Dear ${recipientName},</p>
         <p>Your reschedule request for the appointment on <strong>${new Date(
          details.date_time
        ).toLocaleString(
          "en-US"
        )}</strong> (initiated by <strong>${initiatorName}</strong>) has been <span style="color:green;"><strong>accepted</strong></span> by <strong>${acceptedByName}</strong>.</p>
         <p>Please check your dashboard for details.</p>`
      );
    }

    return res.json({
      success: true,
      appointment: details,
      message: "Reschedule request accepted successfully.",
    });
  } catch (error) {
    console.error("Error accepting reschedule:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.declineReschedule = async (req, res) => {
  try {
    const details = await appointmentMService.declineReschedule(
      req.params.id, // This is the new pending appointment ID
      req.session.user.userId, // FIX: Use req.session.user.userId
      req.body.userProvidedReason || "No reason provided"
    );

    if (!details) {
      throw new Error(
        "Could not process the request or appointment not found."
      );
    } // Determine who initiated and who declined based on the 'details' object

    let recipientEmail, recipientName, initiatorName, declinedByName;
    if (details.reschedule_initiated_by === "client") {
      // Client initiated, therapist declined. Email client.
      recipientEmail = details.client_email;
      recipientName = details.client_name;
      initiatorName = details.client_name; // Who initiated the request
      declinedByName = details.therapist_name; // Who declined it
    } else {
      // Therapist initiated, client declined. Email therapist.
      recipientEmail = details.therapist_email;
      recipientName = details.therapist_name;
      initiatorName = details.therapist_name;
      declinedByName = details.client_name;
    }

    if (recipientEmail) {
      await emailService.sendMail(
        recipientEmail,
        "Reschedule Request Declined",
        `<p>Dear ${recipientName},</p>
         <p>Your reschedule request for the appointment on <strong>${new Date(
          details.date_time
        ).toLocaleString(
          "en-US"
        )}</strong> (initiated by <strong>${initiatorName}</strong>) has been <span style="color:red;"><strong>declined</strong></span> by <strong>${declinedByName}</strong>.</p>
         <p><strong>Reason for declining:</strong> ${details.decline_reason}</p>
         <p>The original appointment time remains unchanged. Please check your dashboard for details.</p>`
      );
    }

    return res.json({
      success: true,
      appointment: details,
      message: "Reschedule request declined successfully",
    });
  } catch (error) {
    console.error("Error declining reschedule:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.showRescheduleForm = async (req, res) => {
  try {
    // FIX: Use req.session.user.userId
    const { rows } = await pool.query(queries.getAppointmentByIdAndClient, [
      req.params.id,
      req.session.user.userId,
    ]);
    const appointment = rows[0];

    if (!appointment) {
      return res
        .status(404)
        .render("error", {
          message: "Appointment not found or not authorized for reschedule.",
        });
    }
    res.render("pages/rescheduleForm", {
      appointment: appointment,
      viewType: "client",
    });
  } catch (error) {
    console.error("Error showing client reschedule form:", error);
    res.status(500).render("error", { message: error.message });
  }
};

exports.showTherapistRescheduleForm = async (req, res) => {
  try {
    // FIX: Use req.session.user.userId
    const { rows } = await pool.query(queries.getAppointmentByIdAndTherapist, [
      req.params.id,
      req.session.user.userId,
    ]);
    const appointment = rows[0];

    if (!appointment) {
      return res
        .status(404)
        .render("error", {
          message: "Appointment not found or not authorized for reschedule.",
        });
    }
    res.render("pages/rescheduleForm", {
      appointment: appointment,
      viewType: "therapist",
    });
  } catch (error) {
    console.error("Error showing therapist reschedule form:", error);
    res.status(500).render("error", { message: error.message });
  }
};
