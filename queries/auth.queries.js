// queries/auth.queries.js
const authQueries = {
  // authQueries
  checkEmailExists: "SELECT 1 FROM Users WHERE email = $1",
  checkPhoneNumberExists: "SELECT 1 FROM Users WHERE phone_number = $1",
  insertUser: `
      INSERT INTO Users (name, email, password, date_of_birth, gender, phone_number) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id
    `,
  getRoleId: "SELECT role_id FROM Roles WHERE role_name = $1",
  assignUserRole: "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
  insertTherapist: `
      INSERT INTO Therapists 
      (therapist_id, license_number, specialization, experience_years, bio, level, status) 
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending Approval')
    `,
  insertTherapistApplication: `
    INSERT INTO therapist_applications (therapist_id, submission_date, status, application_link)
    VALUES ($1, CURRENT_TIMESTAMP, 'Pending', $2) RETURNING application_id
    `,
  insertClient: `
      INSERT INTO Clients 
      (client_id, therapy_goals, preferred_therapy_type) 
      VALUES ($1, $2, $3)
    `,
  storeRefreshToken: `
      INSERT INTO refresh_tokens (user_id, token, expires_at) 
      VALUES ($1, $2, NOW() + INTERVAL '30 days')
    `,
  getUserByEmail:
        "SELECT user_id, name, email, password, phone_number FROM Users WHERE email = $1",

    // NEW Query: Get user details for login, including therapist status if applicable
    getUserDetailsForLogin: `
        SELECT 
            u.user_id, 
            u.name, 
            u.email, 
            u.password, 
            u.phone_number, 
            STRING_AGG(DISTINCT r.role_name, ',') as roles,
            t.status as therapist_status, -- Get therapist specific status
            t.is_verified as therapist_is_verified -- Get therapist verification status
        FROM Users u
        LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        LEFT JOIN Therapists t ON u.user_id = t.therapist_id -- Join with therapists table
        WHERE u.email = $1
        GROUP BY u.user_id, u.name, u.email, u.password, u.phone_number, t.status, t.is_verified;
    `,
    getUserRoles: `
      SELECT r.role_name FROM user_roles ur 
      JOIN Roles r ON ur.role_id = r.role_id 
      WHERE ur.user_id = $1
    `,
  updateLastLogin:
    "UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
  verifyRefreshToken: `
      SELECT user_id FROM refresh_tokens 
      WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()
    `,
  getUserDetails: "SELECT email FROM Users WHERE user_id = $1",
  revokeRefreshToken:
    "UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1",
  deleteRefreshToken: "DELETE FROM refresh_tokens WHERE token = $1 RETURNING *",
  // Forgot Password Queries
  storePasswordResetToken: `
    INSERT INTO password_reset_tokens (token, user_id, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '1 hour') -- Token valid for 1 hour
    ON CONFLICT (user_id) DO UPDATE SET -- Update if user_id already has an active token
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW();
`,
  findPasswordResetToken: `
    SELECT user_id, expires_at FROM password_reset_tokens
    WHERE token = $1 AND expires_at > NOW();
`,
  deletePasswordResetToken: `
    DELETE FROM password_reset_tokens WHERE token = $1;
`,
  updateUserPassword: `
    UPDATE Users SET password = $1 WHERE user_id = $2;
`,
};

module.exports = authQueries;