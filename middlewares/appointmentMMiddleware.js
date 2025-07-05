const { body } = require('express-validator');
const jwt = require("jsonwebtoken");


const validateReschedule = [
  body('newDateTime')
    .isISO8601()
    .withMessage('Must be a valid date time')
    .custom((value, { req }) => {
      if (new Date(value) < new Date()) {
        throw new Error('New appointment time must be in the future');
      }
      return true;
    })
];

const validateCancel = [
  body('reason')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Reason must be less than 255 characters')
];

// const authMiddleware = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   const token = authHeader.split(" ")[1];

//   if (token === "test123") {
//     req.user = {
//       id: 4, // Replace with a valid ID from your DB
//       name: "Test User",
//       email: "test@example.com"
//     };
//     return next();
//   }

//   return res.status(401).json({ message: "Unauthorized" });
// };




module.exports = { validateCancel, validateReschedule};
