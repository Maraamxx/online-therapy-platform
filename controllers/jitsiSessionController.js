// src/controllers/jitsiSessionController.js
const jitsiLogicService = require("../services/jitsiLogicService");
const jitsiSessionDBService = require("../services/jitsiSessionDBService");

/**
 * Handles the request for a user to join a Jitsi session.
 * Renders the session page with Jitsi iframe if authorized, otherwise renders an error page.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const joinSession = async (req, res, next) => {
  const { appointmentId } = req.params;
  const currentUser = req.user; // User object from authMiddleware

  if (!currentUser || !currentUser.userId) {
    // If no user, redirect to login or render specific auth error
    // Store originalUrl so user can be redirected back after login
    req.session.returnTo = req.originalUrl;
    return res.status(401).redirect("/api/auth/login");
  }

  try {
    const appointment = await jitsiSessionDBService.getAppointmentDetails(
      appointmentId
    );

    if (!appointment) {
      return res.status(404).render("error", {
        title: "Session Not Found",
        message: "The requested session (appointment) could not be found.",
        details: `Appointment ID: ${appointmentId}`,
      });
    }

    const isTherapist = currentUser.userId === appointment.therapist_id;
    const isClient = currentUser.userId === appointment.client_id;

    if (!isTherapist && !isClient) {
      return res.status(403).render("error", {
        title: "Access Denied",
        message: "You are not authorized to join this session.",
        details:
          "Only the assigned therapist or client can access this specific appointment.",
      });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).render("error", {
        title: "Session Unavailable",
        message: `This session is not confirmed. Current status: ${appointment.status}.`,
        details: "Please contact support if you believe this is an error.",
      });
    }

    const sessionStartTime = new Date(appointment.date_time);
    const sessionEndTime = new Date(
      sessionStartTime.getTime() + appointment.duration * 60 * 1000
    );
    const now = new Date();

    const allowJoinBefore = new Date(
      sessionStartTime.getTime() - 15 * 60 * 1000
    );
    const allowJoinAfter = new Date(sessionEndTime.getTime() + 15 * 60 * 1000);

    if (now < allowJoinBefore || now > allowJoinAfter) {
      return res.status(400).render("error", {
        title: "Session Time Window",
        message: `The session is not active yet or has already ended.`,
        details: `Please join between ${allowJoinBefore.toLocaleString()} and ${allowJoinAfter.toLocaleString()}.`,
      });
    }
    const rawJitsiRoomName = appointment.jitsi_room_name; // This is the UUID-based name you generated
    const jitsiJwt = jitsiLogicService.generateJitsiJwt(
      rawJitsiRoomName, // Pass the clean room name
      {
        userId: currentUser.userId,
        name: currentUser.name || currentUser.email,
        email: currentUser.email,
      },
      isTherapist // Assuming therapist is the moderator
    );

    if (!jitsiJwt) {
      console.error(
        "Failed to generate Jitsi JWT (missing APP_ID, PRIVATE_KEY, or KEY_ID)."
      );
      return res.status(500).render("error", {
        message: "Could not generate Jitsi session token. Check server logs.",
      });
    }

    const JITSI_APP_ID_FOR_DOMAIN = process.env.JITSI_APP_ID;

    // Basic validation for the environment variable
    if (
      !JITSI_APP_ID_FOR_DOMAIN ||
      typeof JITSI_APP_ID_FOR_DOMAIN !== "string" ||
      JITSI_APP_ID_FOR_DOMAIN.length === 0
    ) {
      console.error(
        "Critical Error: process.env.JITSI_APP_ID is not valid when constructing Jitsi domain."
      );
      return res.status(500).render("error", {
        title: "Configuration Error",
        message:
          "Jitsi App ID is not properly configured on the server. Please contact support.",
        details: "Ensure JITSI_APP_ID is set in your .env file.",
      });
    }

    const jaasDomain = `${JITSI_APP_ID_FOR_DOMAIN}.8x8.vc`;
    // Make sure you corrected the span tags in the room path from previous advice
    const jaasRoomPath = `${JITSI_APP_ID_FOR_DOMAIN}/${rawJitsiRoomName}`; // Format: AppID/roomName

    res.render("session/session", {
      jitsiRoomName: jaasRoomPath, // <--- Pass the JaaS-formatted room name
      jitsiDomain: jaasDomain, // <--- Pass your JaaS domain
      currentUser: {
        userId: currentUser.userId,
        email: currentUser.email,
        name: currentUser.name || currentUser.email,
      },
      jitsiJwt: jitsiJwt,
    });
  } catch (error) {
    console.error(
      "Error in jitsiSessionController.joinSession:",
      error.message
    );
    // Include the original error object in dev mode for more details
    const errorDetails =
      process.env.NODE_ENV === "development" ? error.stack : undefined;
    res.status(500).render("error", {
      title: "Session Join Error",
      message: "An unexpected error occurred while trying to join the session.",
      details: errorDetails,
    });
  }
};

// The assignJitsiRoomToAppointment remains unchanged as it's an API endpoint.
const assignJitsiRoomToAppointment = async (req, res, next) => {
  const { appointmentId } = req.params;
  const currentUser = req.user;

  if (!currentUser) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const appointmentExists = await jitsiSessionDBService.getAppointmentExists(
      appointmentId
    );

    if (!appointmentExists) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    let roomName = appointmentExists.jitsi_room_name;

    if (!roomName) {
      roomName = jitsiLogicService.generateJitsiRoomName(appointmentId);
      await jitsiSessionDBService.updateJitsiRoomName(appointmentId, roomName);
      console.log(
        `Assigned new Jitsi room ${roomName} to appointment ${appointmentId}.`
      );
    } else {
      console.log(
        `Appointment ${appointmentId} already has Jitsi room: ${roomName}.`
      );
    }

    res.status(200).json({
      message: "Jitsi room name assigned/updated for appointment.",
      appointmentId: appointmentId,
      jitsiRoomName: roomName,
    });
  } catch (error) {
    console.error(
      "Error in jitsiSessionController.assignJitsiRoomToAppointment:",
      error.message
    );
    next(error);
  }
};

module.exports = {
  joinSession,
  assignJitsiRoomToAppointment,
};
