// queries/therapist.queries.js (Create this file if it doesn't exist)
const therapistQueries = {
    getTherapistApplicationDetails: `
        SELECT 
            ta.application_id, 
            ta.submission_date, 
            ta.status as application_status, -- Status from therapist_applications table
            ta.admin_feedback,
            t.status as therapist_account_status, -- Status from therapists table
            t.is_verified,
            u.created_at as user_created_at -- To potentially show user registration date
        FROM therapist_applications ta
        JOIN Therapists t ON ta.therapist_id = t.therapist_id
        JOIN Users u ON t.therapist_id = u.user_id
        WHERE ta.therapist_id = $1
        ORDER BY ta.submission_date DESC
        LIMIT 1; -- Get the latest application
    `,
};

module.exports = therapistQueries;