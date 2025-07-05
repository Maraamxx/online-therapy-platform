const availabilityQueries = {
    GET_THERAPIST_BY_ID: `
    SELECT therapist_id FROM public.therapists WHERE therapist_id = $1;
  `,
    CREATE_AVAILABILITY: `
    INSERT INTO public.availability(therapist_id, is_booked, start_timestamp, end_timestamp)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `,
  GET_AVAILABILITY_BY_THERAPIST_ID: `
    SELECT availability_id, therapist_id, is_booked, start_timestamp, end_timestamp
    FROM public.availability
    WHERE therapist_id = $1;
  `,

}

module.exports = availabilityQueries;