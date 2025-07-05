// controllers/viewTherapistsController.js
const TherapistService = require("../services/viewTherapistsService"); // Note: corrected service file name

const viewTherapistsController = {
  getTherapistById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).render('error', { message: "Therapist ID is required" });
      }
      const therapist = await TherapistService.getTherapistById(id);
      if (!therapist) {
        return res.status(404).render('error', { message: 'Therapist not found' });
      }
      res.render('view-therapists/view-therapist', { therapist });
    } catch (error) {
      console.error("Error fetching therapist:", error.message);
      res.status(500).render('error', { message: 'Internal Server Error', error: error.message });
    }
  },

  getAllTherapists: async (req, res) => {
    try {
      // Extract filters from query parameters
      const filters = {
        search: req.query.search || '',
        specialization: req.query.specialization || 'All',
        level: req.query.level || 'All',
        genderPreference: req.query.genderPreference || 'All',
        language: req.query.language || 'All',
        approachStyle: req.query.approachStyle || 'All',
        religion: req.query.religion || 'All',
      };

      // Pass the filters object to the service method
      const therapists = await TherapistService.getAllTherapists(filters);

      // Pass the therapists array and current filters to the EJS template
      // This is crucial for pre-filling the filter forms
      res.render('view-therapists/view-all-therapists', { therapists, filters });
    } catch (error) {
      console.error("Error fetching therapists:", error.message);
      res.status(500).render('error', { message: 'Internal Server Error', error: error.message });
    }
  },
};

module.exports = viewTherapistsController;