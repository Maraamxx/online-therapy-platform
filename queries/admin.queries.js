const adminQueries = {
  // Existing queries
  getUserProfileById: `
        SELECT 
            u.user_id, u.name, u.email, u.gender, u.phone_number, u.date_of_birth, u.profile_picture, u.is_active,
            r.role_name, 
            t.license_number, t.specialization, t.experience_years, t.bio, t.status, t.is_verified, t.cancellation_count,
            c.therapy_goals, c.preferred_therapy_type
        FROM Users u
        LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        LEFT JOIN Therapists t ON u.user_id = t.therapist_id
        LEFT JOIN Clients c ON u.user_id = c.client_id
        WHERE u.user_id = $1
    `,
  getAllUsers: `
        SELECT u.user_id, u.name, u.email, u.is_active, u.gender, u.phone_number, u.date_of_birth,
          STRING_AGG(r.role_name, ', ') as roles
        FROM Users u
        LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        GROUP BY u.user_id, u.name, u.email, u.is_active, u.gender, u.phone_number, u.date_of_birth
        ORDER BY u.user_id
    `,
  getPendingTherapistApplications: `
        SELECT 
            ta.application_id, 
            ta.therapist_id, 
            ta.submission_date, 
            ta.status as application_status, 
            ta.admin_feedback, 
            ta.reviewed_by, 
            ta.reviewed_at, 
            ta.application_link,
            u.name as therapist_name,
            u.email as therapist_email,
            t.license_number,
            t.specialization,
            t.experience_years,
            t.bio,
            t.status as therapist_account_status 
        FROM therapist_applications ta
        JOIN Therapists t ON ta.therapist_id = t.therapist_id
        JOIN Users u ON t.therapist_id = u.user_id
        WHERE ta.status = 'Pending' 
        ORDER BY ta.submission_date ASC;
    `,
  updateTherapistAccountStatus: `
        UPDATE Therapists
        SET status = $2
        WHERE therapist_id = $1
        RETURNING therapist_id, status;
    `,
  updateTherapistApplicationStatus: `
        UPDATE therapist_applications
        SET status = $2,
            admin_feedback = $3,
            reviewed_by = $4,
            reviewed_at = CURRENT_TIMESTAMP
        WHERE therapist_id = $1 AND status = 'Pending' 
        RETURNING application_id, status;
    `,
  // Modified queries to include names from Users table for frontend display
  viewAppointments: `
        SELECT
    a.appointment_id,
    u_client.name AS patientName,
    u_therapist.name AS therapistName,
    a.date_time AS date,
    TO_CHAR(a.date_time, 'HH24:MI') AS time,
    a.duration,
    a.status,
    a.session_type AS type,
    a.notes,
    a.cancellation_reason,
    a.price,
    a.subscription_id,
    a.updated_at,
    a.rescheduled_from,
    a.created_at,
    a.reschedule_initiated_by,
    a.decline_reason,
    a.declined_at,
    a.accepted_at,
    a.jitsi_room_name,
    a.cancellation_initiated_by
FROM public.appointments a
JOIN Users u_client ON a.client_id = u_client.user_id
JOIN Users u_therapist ON a.therapist_id = u_therapist.user_id
ORDER BY a.date_time DESC;
    `,
  getAllPayments: `
        SELECT
            p.payment_id,
            p.client_id,
            u_client.name AS clientName,
            p.therapist_id,
            u_therapist.name AS therapistName,
            p.amount,
            p.currency,
            p.payment_method,
            p.status,
            p.transaction_date,
            p.payment_type,
            p.appointment_id,
            p.refund_amount,
            p.refund_reason
        FROM public.payments p
        LEFT JOIN Users u_client ON p.client_id = u_client.user_id
        LEFT JOIN Users u_therapist ON p.therapist_id = u_therapist.user_id
        ORDER BY p.transaction_date DESC;
    `,
  getAllSubscriptionPayments: `
        SELECT
            spay.subscriptions_payment_id,
            spay.subscription_id,
            spay.client_id,
            u.name AS userName, -- Alias to 'userName' for EJS
            splan.plan_name AS planName, -- Alias to 'planName' for EJS
            spay.amount,
            spay.currency,
            spay.payment_method,
            spay.status,
            spay.transaction_date AS payment_date, -- Alias to 'payment_date' for EJS
            cs.end_date AS next_due_date, -- Assuming end_date is relevant for next due date
            spay.refund_reason
        FROM public.subscription_payments spay
        JOIN public.client_subscriptions cs ON spay.subscription_id = cs.subscription_id
        JOIN public.subscription_plans splan ON cs.plan_id = splan.plan_id
        JOIN public.Users u ON spay.client_id = u.user_id
        ORDER BY spay.transaction_date DESC;
    `,
  getAllSessions: `
        SELECT
            s.session_id,
            s.date_time,
            s.duration,
            s.status,
            s.session_url,
            s.notes,
            s.end_time,
            s.appointment_id,
            s.session_type,
            u_client.name AS patientName,
            u_therapist.name AS therapistName
        FROM public.sessions s
        LEFT JOIN public.appointments a ON s.appointment_id = a.appointment_id
        LEFT JOIN public.Users u_client ON a.client_id = u_client.user_id
        LEFT JOIN public.Users u_therapist ON a.therapist_id = u_therapist.user_id
        ORDER BY s.date_time DESC;
    `,
  getPlanSubscribedUsersCount: `
        SELECT
            sp.plan_name,
            COUNT(cs.client_id) AS subscriber_count -- Changed alias for consistency with EJS
        FROM public.subscription_plans sp
        LEFT JOIN public.client_subscriptions cs ON sp.plan_id = cs.plan_id
        GROUP BY sp.plan_name, sp.plan_id
        ORDER BY sp.plan_id;
    `,

  // NEW ADMIN QUERIES for summary data
  countApprovedTherapistApplications: `
        SELECT COUNT(*) FROM therapist_applications WHERE status = 'Approved';
    `,
  countRejectedTherapistApplications: `
        SELECT COUNT(*) FROM therapist_applications WHERE status = 'Rejected';
    `,
  getPaymentSummary: `
        SELECT 
            COUNT(payment_id) as total_payments,
            SUM(amount) as total_revenue,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_payments_count,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_payments_count,
            COUNT(CASE WHEN status = 'Failed' THEN 1 END) as failed_payments_count
        FROM payments;
    `,

  // Existing and other NEW ADMIN QUERIES
  getAdminUserByEmail: `
        SELECT 
            u.user_id, 
            u.email, 
            u.password, 
            STRING_AGG(r.role_name, ',') as roles
        FROM Users u
        JOIN User_Roles ur ON u.user_id = ur.user_id
        JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.email = $1 AND r.role_name = 'admin'
        GROUP BY u.user_id, u.email, u.password;
    `,
  getUserRoles: `
        SELECT r.role_name
        FROM User_Roles ur
        JOIN Roles r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1;
    `,
  getActiveTherapists: `
        SELECT u.user_id, u.name, u.email, t.specialization, t.status, t.experience_years, t.license_number, u.is_active
        FROM Users u
        JOIN Therapists t ON u.user_id = t.therapist_id
        WHERE t.status = 'Approved' AND u.is_active = TRUE;
    `,
  getInactiveUsers: `
        SELECT u.user_id, u.name, u.email, STRING_AGG(r.role_name, ', ') as roles, u.is_active, u.gender, u.phone_number, u.date_of_birth
        FROM Users u
        LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.is_active = FALSE
        GROUP BY u.user_id, u.name, u.email, u.is_active, u.gender, u.phone_number, u.date_of_birth
        ORDER BY u.user_id;
    `,
  deactivateUser: `
        UPDATE Users
        SET is_active = FALSE
        WHERE user_id = $1
        RETURNING user_id, is_active;
    `,
  activateUser: `
        UPDATE Users
        SET is_active = TRUE
        WHERE user_id = $1
        RETURNING user_id, is_active;
    `,
  getAllTherapists: `
        SELECT u.user_id, u.name, u.email, u.is_active, 
                t.specialization, t.experience_years, t.status as therapist_status, t.is_verified, t.license_number
        FROM Users u
        JOIN Therapists t ON u.user_id = t.therapist_id
        ORDER BY u.user_id;
    `,
  // Query to get all clients
  getAllClients: `
        SELECT u.user_id, u.name, u.email, u.is_active, u.gender, u.phone_number,
                c.therapy_goals, c.preferred_therapy_type
        FROM Users u
        JOIN Clients c ON u.user_id = c.client_id
        ORDER BY u.user_id;
    `,
};

module.exports = adminQueries;
