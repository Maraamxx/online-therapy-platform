const userQueries = {
  getUserProfile: `
  SELECT 
    u.user_id,
    u.name,
    u.email,
    COALESCE(u.gender, 'unspecified') as gender,
    u.phone_number,
    u.date_of_birth,
    u.profile_picture,
    COALESCE(u.is_active, TRUE) as is_active,
    r.role_name, 
    t.therapist_id,
    t.license_number, 
    t.specialization, 
    t.experience_years, 
    t.bio, 
    COALESCE(t.status, 'unknown') as status, 
    COALESCE(t.is_verified, FALSE) as is_verified, 
    COALESCE(t.cancellation_count, 0) as cancellation_count,
    c.client_id,
    c.therapy_goals, 
    c.preferred_therapy_type
  FROM Users u
  LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
  LEFT JOIN Roles r ON ur.role_id = r.role_id
  LEFT JOIN Therapists t ON u.user_id = t.therapist_id
  LEFT JOIN Clients c ON u.user_id = c.client_id
  WHERE u.user_id = $1
`,

  updateUserBasicInfo: `
    UPDATE Users 
    SET name = $2, 
        date_of_birth = $3, 
        profile_picture = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    RETURNING user_id, name, email, date_of_birth, profile_picture
  `,

  updateTherapistInfo: `
    UPDATE Therapists
    SET specialization = $2,
        experience_years = $3,
        bio = $4,
    WHERE therapist_id = $1
    RETURNING *
  `,

  updateClientInfo: `
    UPDATE Clients
    SET therapy_goals = $2,
        preferred_therapy_type = $3
    WHERE client_id = $1
    RETURNING *
  `,

  checkEmailExists: `
  SELECT 1 FROM Users WHERE email = $1
  `,

  updateUserEmail: `
    UPDATE Users 
    SET email = $2,
        is_email_verified = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    RETURNING user_id, email
  `,

  updateUserPassword: `
    UPDATE Users 
    SET password = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
  `,

  createEmailVerificationToken: `
    INSERT INTO email_verification_tokens
    (user_id, token, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '24 hours')
    RETURNING token
  `,

  getEmailVerificationToken: `
    SELECT user_id, expires_at 
    FROM email_verification_tokens
    WHERE token = $1 AND used = FALSE
  `,

  markEmailAsVerified: `
    UPDATE Users 
    SET is_email_verified = TRUE
    WHERE user_id = $1
  `,

  invalidateEmailToken: `
    UPDATE email_verification_tokens
    SET used = TRUE
    WHERE token = $1
  `,
  updateProfilePicture: `
        UPDATE Users
        SET profile_picture = $1
        WHERE user_id = $2;
    `
};

module.exports = userQueries;
