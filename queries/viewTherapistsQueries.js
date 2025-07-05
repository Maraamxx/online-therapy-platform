// queries/viewTherapistsQueries.js
const viewTherapistsQueries = {
  // Base query for getting all therapists. The WHERE clause will be built in the service.
  GET_ALL_THERAPISTS_BASE: `
    SELECT
        u.user_id,
        u.name,
        u.profile_picture,
        u.gender,
        t.therapist_id,
        t.license_number,
        t.specialization,
        t.experience_years,
        t.bio,
        t.status,
        t.is_verified,
        t.price_per_session,
        t.cancellation_count,
        t.level,
        t.languages,
        t.approach_style,
        t.religion
    FROM
        public.users AS u
    INNER JOIN
        public.therapists AS t ON u.user_id = t.therapist_id
    WHERE t.status = 'Approved'
  `,

  GET_THERAPIST_BY_ID: `
    SELECT
        u.user_id,
        u.name,
        u.email,
        u.phone_number,
        u.profile_picture,
        u.gender,
        t.therapist_id,
        t.license_number,
        t.specialization,
        t.experience_years,
        t.bio,
        t.status,
        t.is_verified,
        t.price_per_session,
        t.cancellation_count,
        t.level,
        t.languages,
        t.approach_style,
        t.religion
    FROM
        public.users AS u
    INNER JOIN
        public.therapists AS t ON u.user_id = t.therapist_id
    WHERE
        u.user_id = $1;
  `,
};

module.exports = viewTherapistsQueries;
