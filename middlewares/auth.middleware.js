// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const db = require("../config/database"); // Assuming this is your pg.Pool instance
require("dotenv").config(); // Ensure environment variables are loaded

const authMiddleware = (requiredRoles = []) => {
  return async (req, res, next) => {
    const isHtmlRequest = req.accepts('html');
    
    // Determine the appropriate login page for redirection
    const targetLoginPage = requiredRoles.includes('admin')
      ? '/api/auth/admin/login' // Redirect to admin login for admin-specific routes
      : '/api/auth/login';      // Redirect to general login for other routes

    const redirectToLogin = (status, errorMessage) => {
      if (isHtmlRequest) {
        req.session.loginError = errorMessage;
        req.session.returnTo = req.originalUrl; // Store original URL to redirect after login
        return res.status(status).redirect(targetLoginPage);
      } else {
        return res.status(status).json({ error: errorMessage });
      }
    };

    const redirectToPendingTherapistPage = (status, errorMessage) => {
      if (isHtmlRequest) {
        req.session.loginError = errorMessage;
        return res.status(status).redirect('/api/therapist/application-pending');
      } else {
        return res.status(status).json({
          message: errorMessage,
          therapistStatus: req.user.therapistStatus
        });
      }
    };

    // --- Helper function to fetch and update therapist status ---
    const updateTherapistStatus = async (user) => {
      if (user.roles && user.roles.includes('therapist')) {
        try {
          const { rows } = await db.query(
            `SELECT status FROM Therapists WHERE therapist_id = $1`,
            [user.userId]
          );
          if (rows.length > 0) {
            user.therapistStatus = rows[0].status;
          } else {
            user.therapistStatus = 'unknown'; // Indicate missing therapist record
            console.warn(`Therapist record not found for user ID: ${user.userId} with 'therapist' role.`);
          }
        } catch (dbError) {
          console.error(`Error fetching therapist status for user ID ${user.userId}:`, dbError.message);
          user.therapistStatus = 'error_fetching'; // Indicate DB error
        }
      }
    };

    // --- Authentication Logic: Prioritize Session, then JWT ---

    let isAuthenticated = false;
    let user;

    // 1. Session-Based Authentication
    if (req.session && req.session.user) {
      user = req.session.user;
      await updateTherapistStatus(user); // Always update status from DB for session users
      req.user = user; // Attach user to req for downstream middleware/controllers
      isAuthenticated = true;
    }
    // 2. JWT-Based Authentication (if no session or for API calls)
    else {
      const token = req.header("Authorization")?.replace("Bearer ", "").trim();

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const { rows } = await db.query(
            `SELECT
                u.user_id,
                u.email,
                u.name, -- Include name for consistency with session object
                STRING_AGG(DISTINCT r.role_name, ',') as roles,
                t.status as therapist_status
             FROM Users u
             LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
             LEFT JOIN Roles r ON ur.role_id = r.role_id
             LEFT JOIN Therapists t ON u.user_id = t.therapist_id
             WHERE u.user_id = $1
             GROUP BY u.user_id, u.email, u.name, t.status`, // Group by name too
            [decoded.userId]
          );

          if (rows.length === 0) {
            return redirectToLogin(401, "User not found or invalid token data.");
          }

          const dbUser = rows[0];
          user = {
            userId: dbUser.user_id, // Use userId for consistency
            email: dbUser.email,
            name: dbUser.name, // Include name
            roles: dbUser.roles ? dbUser.roles.split(',') : [],
            therapistStatus: dbUser.therapist_status
          };
          req.user = user; // Attach user to req for downstream middleware/controllers
          isAuthenticated = true;

        } catch (error) {
          let errorMessage = "Invalid token.";
          if (error.name === "TokenExpiredError") {
            errorMessage = "Token expired.";
          } else if (error.name === "JsonWebTokenError") {
            errorMessage = "Malformed or invalid token.";
          }
          console.error("JWT authentication error:", error.message);
          return redirectToLogin(401, errorMessage);
        }
      }
    }

    // --- Authorization & Status Checks ---

    if (!isAuthenticated) {
      return redirectToLogin(401, "Authentication required.");
    }

    // Check required roles
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      console.warn(`Access denied: User ${user.email} (ID: ${user.userId}) lacks required roles: ${requiredRoles.join(', ')}`);
      return redirectToLogin(403, "You do not have the necessary permissions to access this page.");
    }

    // Therapist status check
    if (userRoles.includes('therapist') && user.therapistStatus !== 'Approved') {
      const allowedTherapistPaths = [
        '/api/therapist/application-pending',
        '/api/auth/logout'
        // Add other paths like password reset, profile view (if allowed for non-approved therapists)
      ];

      // Check if the current URL is *not* one of the allowed paths for non-approved therapists
      if (!allowedTherapistPaths.includes(req.originalUrl)) {
        console.warn(`Therapist ${user.userId} with status '${user.therapistStatus}' attempted to access ${req.originalUrl}.`);
        return redirectToPendingTherapistPage(403, `Your application status is '${user.therapistStatus}'. You cannot access this page yet.`);
      }
    }

    // All checks passed
    next();
  };
};

module.exports = authMiddleware;