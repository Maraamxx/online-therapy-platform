const express = require("express");
const router = express.Router();
const viewTherapistController = require("../controllers/viewTherapistsController");

router.get("/", viewTherapistController.getAllTherapists);
router.get("/:id", viewTherapistController.getTherapistById);

module.exports = router;