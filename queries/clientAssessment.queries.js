const clientAssessmentQueries = {
    saveClientAssessment: `
        INSERT INTO client_assessments (
            client_id,
            mental_health_concerns,
            preferred_therapist_gender,
            preferred_religion,
            preferred_language,
            age_group_preference
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `,

    // MODIFIED: Target clients table for has_completed_assessment and matched_therapist_id
    markClientAssessmentCompleted: `
        UPDATE clients
        SET has_completed_assessment = true,
            matched_therapist_id = $2
        WHERE client_id = $1;
    `,

    // MODIFIED: Target clients table for checking status
    checkClientAssessmentStatus: `
        SELECT has_completed_assessment, matched_therapist_id
        FROM clients
        WHERE client_id = $1;
    `,

    findTherapistsForMatching: `
        SELECT
            t.therapist_id,
            u.name,
            u.email,
            u.gender,
            t.specialization,
            t.experience_years,
            t.bio,
            t.languages,
            t.religion,
            t.approach_style,
            t.is_verified,
            t.status
        FROM therapists t
        JOIN users u ON t.therapist_id = u.user_id
        WHERE t.is_verified = TRUE
            AND t.status = 'Approved'
            AND (LOWER(t.specialization) = ANY(ARRAY(SELECT LOWER(unnest($1::text[])))) OR $1 IS NULL OR cardinality($1) = 0)
            AND (LOWER(u.gender) = LOWER($2) OR $2 IS NULL)
            AND (LOWER(t.religion) = LOWER($3) OR $3 IS NULL)
            AND (LOWER($4::text) = ANY(ARRAY(SELECT LOWER(unnest(t.languages)))) OR $4 IS NULL OR $4 = '')
        ORDER BY t.experience_years DESC, t.is_verified DESC
    `,
};

module.exports = clientAssessmentQueries;