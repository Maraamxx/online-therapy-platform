// controllers/appointmentController.js

const availabilityService = require('../services/availabilityService');
const appointmentService = require('../services/appointmentService'); // Assuming you have this service
const { getClientAppointments } = require('../services/appointmentMService');
const therapistService = require("../services/viewTherapistsService"); // Note: corrected service file name
const viewHelpers = require('../utils/viewHelpers'); // The helper we discussed
const { getAppointmentById } = require('../models/appointmentModel');

// NEW FUNCTION TO RENDER THE BOOKING PAGE
// In controllers/appointmentController.js

const renderBookingPage = async (req, res) => {
  try {
    console.log('[DEBUG] 1. Entered renderBookingPage controller.');
    const { therapistId } = req.params;
    const user = req.session.user; // Changed from req.user to req.session.user

    if (!user) {
      console.error('[DEBUG] FAILED at step 1: No user found in request. Redirecting to login.');
      req.session.returnTo = `/api/appointment/book/${therapistId}`;
      return res.redirect('/api/auth/login');
    }
    console.log(`[DEBUG] 2. User authenticated: ${user.email}. Therapist ID from params: ${therapistId}`);

    // --- Potential Failure Point A ---
    console.log(`[DEBUG] 3. Calling therapistService.getTherapistById with ID: ${therapistId}`);
    const therapist = await therapistService.getTherapistById(therapistId);
    console.log('[DEBUG] 4. therapistService call completed. Result:', therapist);

    if (!therapist) {
      console.error(`[DEBUG] FAILED at step 4: Therapist not found.`);
      return res.status(404).render('404', { message: "Therapist not found" });
    }

    // --- Potential Failure Point B ---
    console.log(`[DEBUG] 5. Calling availabilityService.getAvailabilityByTherapistId with ID: ${therapistId}`);
    const availability = await availabilityService.getAvailabilityByTherapistId(therapistId);
    console.log('[DEBUG] 6. availabilityService call completed. Raw availability data:', availability);

    // --- Potential Failure Point C ---
    if (!availability) {
      console.error('[DEBUG] FAILED at step 6: Availability result is null or undefined. Cannot proceed to reduce.');
      // Throw an error to be caught by the catch block
      throw new Error('Availability data could not be retrieved.');
    }
    console.log('[DEBUG] 7. Grouping availability slots by date.');
    const availabilityByDate = availability.reduce((acc, slot) => {
      const date = new Date(slot.start_timestamp).toISOString().split('T')[0];
      if (!acc[date]) { acc[date] = []; }
      acc[date].push({
        ...slot,
        start_time: new Date(slot.start_timestamp).toTimeString().slice(0, 5),
        end_time: new Date(slot.end_timestamp).toTimeString().slice(0, 5)
      });
      return acc;
    }, {});
    console.log('[DEBUG] 8. Availability grouped successfully. Grouped data:', availabilityByDate);

    // --- Potential Failure Point D ---
    console.log('[DEBUG] 9. Rendering "book-appointment.ejs" template.');
    return res.render('view-therapists/book-appointment.ejs', {
      title: `Book with ${therapist.name}`,
      therapist,
      availabilityByDate,
      user: {
        user_id: user.userId, // Map userId to user_id for the template
        email: user.email,
        name: user.name
      },
      loggedIn: true,
      formatTime12h: viewHelpers.formatTime12h,
      extraCSS: '<link rel="stylesheet" href="/css/booking/book-appointment.css">'
    });

  } catch (error) {
    // This will now catch any of the potential failures above
    console.error('=== Error in renderBookingPage ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    // ... existing error response ...
    return res.status(500).json({
      error: "An unexpected server error occurred. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ... your existing bookAppointment function ...
const bookAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    console.log('Booking appointment with data:', appointmentData);

    const result = await appointmentService.bookAppointment(appointmentData);
    console.log('Booking result:', result);

    if (result.success && result.appointment) {
      // Wait a moment to ensure the transaction is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the appointment exists
      const appointment = await getAppointmentById(result.appointment.appointment_id);
      if (!appointment) {
        throw new Error('Appointment was not created successfully');
      }

      res.status(201).json({
        success: true,
        appointment: result.appointment,
        message: "Appointment booked successfully"
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || "Failed to book appointment"
      });
    }
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during booking.",
      error: err.message
    });
  }
};

const viewClientAppointments = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const appointments = await getClientAppointments(userId);

    res.render('appointments/client-appointments', {
      title: 'My Appointments',
      appointments,
      user: req.session.user,
      loggedIn: true,
      extraCSS: '<link rel="stylesheet" href="/css/appointments/client-appointments.css">'
    });
  } catch (error) {
    console.error('Error fetching client appointments:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load appointments',
      error: error.message
    });
  }
};

module.exports = {
  renderBookingPage, // EXPORT THE NEW FUNCTION
  bookAppointment,
  viewClientAppointments
};