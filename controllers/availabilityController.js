const availabilityService = require('../services/availabilityService');
const queries = require('../config/queries');
const pool = require('../config/database'); // Assuming 'pool' is your database connection pool

// Render availability page
const renderAvailabilityPage = async (req, res) => {
    const therapistId = req.user.userId;
    try {
        // Get therapist's availability
        // This service call should already be updated to fetch start_timestamp and end_timestamp
        const availability = await availabilityService.getAvailabilityByTherapistId(therapistId);

        // Render the availability page with the data
        res.render('availability', {
            availability: availability,
            therapistId: therapistId
        });
    } catch (error) {
        console.error('Error rendering availability page:', error);
        res.status(500).send('Error loading availability page');
    }
};

const setAvailability = async (req, res) => {
    // Destructure directly from req.body, no more 'date' or separate 'time' fields
    const { start_timestamp, end_timestamp } = req.body;
    const therapistId = req.user.userId;

    if (isNaN(therapistId)) {
        return res.status(400).json({ error: 'Invalid therapist ID.' });
    }

    // --- Validation for timestamps ---
    if (!start_timestamp || !end_timestamp) {
        return res.status(400).json({ error: 'Missing required fields: start_timestamp and end_timestamp.' });
    }

    const startDateTime = new Date(start_timestamp);
    const endDateTime = new Date(end_timestamp);

    // Check if the timestamp strings are valid and parseable dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return res.status(400).json({ error: 'Invalid timestamp format. Please use a valid date and time.' });
    }

    // Check if start_timestamp is before end_timestamp
    if (startDateTime >= endDateTime) {
        return res.status(400).json({ error: 'Start time must be earlier than end time.' });
    }
    // --- End Validation ---

    try {
        const query = queries.GET_THERAPIST_BY_ID; // Assuming this query exists and works
        const therapistCheck = await pool.query(query, [therapistId]);
        if (therapistCheck.rowCount === 0) {
            return res.status(404).json({ error: 'Therapist not found.' });
        }

        const result = await availabilityService.createAvailability({
            therapist_id: therapistId,
            start_timestamp: start_timestamp, // Pass the direct timestamp string
            end_timestamp: end_timestamp      // Pass the direct timestamp string
        });

        if (!result) {
            throw new Error('Failed to create availability');
        }

        res.status(201).json({ message: 'Availability set successfully.' });
    } catch (error) {
        console.error("Error in setAvailability:", error);
        res.status(500).json({
            error: 'Failed to set availability.',
            details: error.message
        });
    }
};

const updateAvailability = async (req, res) => {
  const { start_timestamp, end_timestamp } = req.body;
  // This `id` comes from the URL parameter (e.g., /availability/123), which should be the availability_id
  const availabilityId = req.params.id;
  const callingTherapistId = req.user.userId; // The ID of the therapist making the request

  console.log("Update Availability Request:", {
    availabilityId,
    start_timestamp,
    end_timestamp,
    callingTherapistId,
  });

  if (!availabilityId || isNaN(parseInt(availabilityId))) {
    return res.status(400).json({ error: "Invalid availability ID provided." });
  }

  if (!start_timestamp || !end_timestamp) {
    return res
      .status(400)
      .json({ error: "Missing required fields: start_timestamp and end_timestamp." });
  }

  const startDateTime = new Date(start_timestamp);
  const endDateTime = new Date(end_timestamp);

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    return res.status(400).json({ error: "Invalid timestamp format. Please use a valid date and time." });
  }

  if (startDateTime >= endDateTime) {
    return res.status(400).json({ error: "Start time must be earlier than end time." });
  }

  try {
    // Crucial: Verify that the availability slot belongs to the authenticated therapist
    const checkQuery =
      "SELECT therapist_id FROM Availability WHERE availability_id = $1";
    const checkResult = await pool.query(checkQuery, [availabilityId]);

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    if (checkResult.rows[0].therapist_id !== callingTherapistId) {
      return res.status(403).json({ error: "Unauthorized to update this availability slot." });
    }

    const result = await availabilityService.updateAvailability(
      availabilityId,
      {
        start_timestamp: start_timestamp,
        end_timestamp: end_timestamp,
      }
    );

    if (!result) {
      throw new Error("Failed to update availability");
    }

    res.status(200).json({ message: "Availability updated successfully." });
  } catch (error) {
    console.error("Error in updateAvailability:", error);
    res.status(500).json({
      error: "Failed to update availability.",
      details: error.message,
    });
  }
};

const deleteAvailability = async (req, res) => {
  // This `id` comes from the URL parameter, which should be the availability_id
  const availabilityId = req.params.id;
  const callingTherapistId = req.user.userId; // The ID of the therapist making the request

  console.log("Delete request received:", {
    availabilityId,
    callingTherapistId,
  });

  if (!availabilityId || isNaN(parseInt(availabilityId))) {
    return res.status(400).json({ error: "Invalid availability ID provided." });
  }

  try {
    // Crucial: Verify that the availability slot belongs to the authenticated therapist
    const checkQuery =
      "SELECT therapist_id FROM Availability WHERE availability_id = $1";
    const checkResult = await pool.query(checkQuery, [availabilityId]);

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    if (checkResult.rows[0].therapist_id !== callingTherapistId) {
      return res.status(403).json({ error: "Unauthorized to delete this availability slot." });
    }

    const result = await pool.query(queries.DELETE_AVAILABILITY, [
      availabilityId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    res.status(200).json({ message: "Availability deleted successfully." });
  } catch (error) {
    console.error("Error in deleteAvailability:", error);
    res.status(500).json({
      error: "Failed to delete availability.",
      details: error.message,
    });
  }
};

module.exports = {
    renderAvailabilityPage,
    setAvailability,
    updateAvailability,
    deleteAvailability
};