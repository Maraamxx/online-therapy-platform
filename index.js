const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const methodOverride = require("method-override");
const dotenv = require("dotenv");
const session = require("express-session");
const pg = require("pg");
const pgSession = require("connect-pg-simple")(session);
const multer = require("multer");
const cookieParser = require("cookie-parser");
const fs = require("fs");

// Load env variables
dotenv.config();
console.log("Environment variables loaded:");

// Initialize app
const app = express();

// PostgreSQL Pool for sessions
const pgPool = new pg.Pool({
  connectionString: process.env.database_url,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./certificates/ca.pem").toString(),
  },
});

// Configure connect-pg-simple session store
const store = new pgSession({
  pool: pgPool,
  tableName: "session",
});
store.on("error", (error) => {
  console.error("PostgreSQL Session Store Error:", error);
});

// Middleware
app.use(cors());
// app.use(helmet());
app.use(morgan("dev"));
app.use(express.json()); // 🔥 REQUIRED for req.body in JSON routes
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

// Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use(session({
  secret: 'ayhaga',
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something is stored
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
})
);

app.use((req, res, next) => {
  // Check if there's a user in the session
  if (req.session && req.session.user) {
    res.locals.loggedIn = true;
    res.locals.user = { // Ensure res.locals.user is always an object with userId
      userId: req.session.user.userId,
      email: req.session.user.email,
      roles: req.session.user.roles,
      name: req.session.user.name || req.session.user.email, // Ensure name is available
      // Add any other properties you want accessible in templates
    };
    // Add a log here to confirm what's being set:
    console.log('res.locals.user being set to:', res.locals.user);
  } else {
    res.locals.loggedIn = false;
    res.locals.user = null; // Or an empty object {} if your template handles it gracefully
  }
  next();
});
// Custom middleware
const helpersMiddleware = require("./middleware/helpers");
const setGlobalViewVars = require("./middlewares/setGlobalViewVars");
app.use(helpersMiddleware);
app.use(setGlobalViewVars);

// Cleanup script
require("./scripts/cleanup");

// ROUTES
// Public routes (no authentication required)
app.use('/', require('./routes/public.routes'));

// Management route from feature/appointment-management
const appointmentMRoutes = require("./routes/appointmentMRoutes");
app.use("/appointments/management", appointmentMRoutes);

// All other routes
// app.use('/api', require('./routes/userRoutes'));
app.use("/api/availability", require("./routes/availabilityRoutes"));
app.use("/api/appointment", require("./routes/appointmentRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/therapists", require("./routes/viewTherapistsRoutes"));
app.use("/api/assessment", require("./routes/clientAssessment.routes"));
app.use("/api/contact-us", require("./routes/contactUsRoutes"));
app.use("/api/therapist", require("./routes/therapist.routes"));
app.use("/api/jitsi-sessions", require("./routes/jitsiSessionRoutes"));

app.get("/", (req, res) => {
  // Pass res.locals.user and res.locals.loggedIn explicitly
  res.render("home", {
    loggedIn: res.locals.loggedIn,
    user: res.locals.user
  });
});

app.get("/", (req, res) => {
  // Pass res.locals.user and res.locals.loggedIn explicitly
  res.render("home", {
    loggedIn: res.locals.loggedIn,
    user: res.locals.user
  });
});

// Error handling
const { AppError } = require("./services/user.service");

app.use((err, req, res, next) => {
  console.error("Caught by global error handler:", err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details:
        process.env.NODE_ENV === "development" ? err.details : undefined,
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json({ error: "Invalid authentication token. Please log in again." });
  }

  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ error: "Authentication token has expired. Please log in again." });
  }

  res.status(500).json({
    error: "An unexpected server error occurred. Please try again later.",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
