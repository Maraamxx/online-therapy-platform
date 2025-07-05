const express = require("express");
const router = express.Router();
const {
  setAvailability,
  getAvailabilityByTherapistId,
  renderAvailabilityPage,
  updateAvailability,
  deleteAvailability,
} = require("../controllers/availabilityController");
const authMiddleware = require("../middlewares/auth.middleware");

router.use(authMiddleware());
router.use(authMiddleware(["therapist"]));

// Render availability page
router.get("/", renderAvailabilityPage);

// API routes
router.post("/:id", setAvailability);
router.put("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

module.exports = router;
