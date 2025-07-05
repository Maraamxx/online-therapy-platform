const db = require("../config/database");
const queries = require("../queries/admin.queries"); // Make sure this path is correct

class AdminModel {
    static async getUserProfileById(userId) {
        const { rows } = await db.query(queries.getUserProfileById, [userId]);
        return rows;
    }

    static async getAllUsers() {
        const { rows } = await db.query(queries.getAllUsers);
        return rows;
    }

    static async getAllAppointments() {
        const { rows } = await db.query(queries.viewAppointments); // Now uses the joined query
        return rows;
    }
    static async getAllSessions() {
        const { rows } = await db.query(queries.getAllSessions); // Now uses the joined query
        return rows;
    }
    static async getAllPayments() {
        const { rows } = await db.query(queries.getAllPayments); // Now uses the joined query
        return rows;
    }
    static async getAllSubscriptionPayments() {
        const { rows } = await db.query(queries.getAllSubscriptionPayments); // Now uses the joined query
        return rows;
    }
    static async getPlanSubscribedUsersCount() {
        const { rows } = await db.query(queries.getPlanSubscribedUsersCount);
        return rows;
    }

    // NEW ADMIN MODEL METHODS (for summary data)
    static async countApprovedTherapistApplications() {
        const { rows } = await db.query(queries.countApprovedTherapistApplications);
        return rows[0].count; // COUNT(*) returns a single row with 'count' column
    }

    static async countRejectedTherapistApplications() { // Changed from Declined to Rejected for consistency
        const { rows } = await db.query(queries.countRejectedTherapistApplications);
        return rows[0].count; // COUNT(*) returns a single row with 'count' column
    }

    static async getPaymentSummary() {
        const { rows } = await db.query(queries.getPaymentSummary);
        return rows[0]; // Returns a single row with summary counts/sums
    }

    // Existing NEW ADMIN MODEL METHODS
    static async getAdminUserByEmail(email) {
        const { rows } = await db.query(queries.getAdminUserByEmail, [email]);
        return rows[0];
    }

    static async getUserRoles(userId) {
        const { rows } = await db.query(queries.getUserRoles, [userId]);
        return rows.map(row => row.role_name);
    }

    static async getPendingTherapistApplications() {
        const { rows } = await db.query(queries.getPendingTherapistApplications);
        return rows;
    }

    static async updateTherapistAccountStatus(therapistId, newStatus) {
        const { rows } = await db.query(queries.updateTherapistAccountStatus, [therapistId, newStatus]);
        return rows[0];
    }

    static async updateTherapistApplicationStatus(therapistId, newStatus, feedback, adminId) {
        const { rows } = await db.query(queries.updateTherapistApplicationStatus, [therapistId, newStatus, feedback, adminId]);
        return rows[0];
    }

    static async getActiveTherapists() {
        const { rows } = await db.query(queries.getActiveTherapists);
        return rows;
    }

    static async getInactiveUsers() {
        const { rows } = await db.query(queries.getInactiveUsers);
        return rows;
    }

    static async deactivateUser(userId) {
        const { rows } = await db.query(queries.deactivateUser, [userId]);
        return rows[0];
    }

    static async activateUser(userId) {
        const { rows } = await db.query(queries.activateUser, [userId]);
        return rows[0];
    }

    static async getAllTherapists() {
        const { rows } = await db.query(queries.getAllTherapists);
        return rows;
    }

    static async getAllClients() {
        const { rows } = await db.query(queries.getAllClients);
        return rows;
    }
}

// <<<<<<< HEAD
// class Appointment {
//   constructor({
//     appointment_id,
//     therapist_id,
//     client_id,
//     date_time,
//     duration,
//     status,
//     session_type,
//     notes,
//     cancellation_reason,
//     price,
//     subscription_id,
//     updated_at,
//     rescheduled_from,
//     created_at,
//     reschedule_initiated_by,
//     decline_reason,
//     declined_at,
//     accepted_at,
//     jitsi_room_name,
//     cancellation_initiated_by,
//   }) {
//     this.appointment_id = appointment_id;
//     this.therapist_id = therapist_id;
//     this.client_id = client_id;
//     this.date_time = date_time;
//     this.duration = duration;
//     this.status = status;
//     this.session_type = session_type;
//     this.notes = notes;
//     this.cancellation_reason = cancellation_reason;
//     this.price = price;
//     this.subscription_id = subscription_id;
//     this.updated_at = updated_at;
//     this.rescheduled_from = rescheduled_from;
//     this.created_at = created_at;
//     this.reschedule_initiated_by = reschedule_initiated_by;
//     this.decline_reason = decline_reason;
//     this.declined_at = declined_at;
//     this.accepted_at = accepted_at;
//     this.jitsi_room_name = jitsi_room_name;
//     this.cancellation_initiated_by = cancellation_initiated_by;
//   }
// }

// class Payment {
//   constructor({
//     payment_id,
//     client_id,
//     therapist_id,
//     amount,
//     currency,
//     payment_method,
//     status,
//     transaction_date,
//     payment_type,
//     appointment_id,
//     refund_amount,
//     refund_reason,
//   }) {
//     this.payment_id = payment_id;
//     this.client_id = client_id;
//     this.therapist_id = therapist_id;
//     this.amount = amount;
//     this.currency = currency;
//     this.payment_method = payment_method;
//     this.status = status;
//     this.transaction_date = transaction_date;
//     this.payment_type = payment_type;
//     this.appointment_id = appointment_id;
//     this.refund_amount = refund_amount;
//     this.refund_reason = refund_reason;
//   }
// }

// class Session {
//   constructor({
//     session_id,
//     date_time,
//     duration,
//     status,
//     session_url,
//     notes,
//     end_time,
//     appointment_id,
//     session_type,
//   }) {
//     this.session_id = session_id;
//     this.date_time = date_time;
//     this.duration = duration;
//     this.status = status;
//     this.session_url = session_url;
//     this.notes = notes;
//     this.end_time = end_time;
//     this.appointment_id = appointment_id;
//     this.session_type = session_type;
//   }
// }

// class Subscription {
//   constructor({
//     subscriptions_payment_id,
//     subscription_id,
//     client_id,
//     amount,
//     currency,
//     payment_method,
//     status,
//     transaction_date,
//     refund_reason,
//   }) {
//     this.subscriptions_payment_id = subscriptions_payment_id;
//     this.subscription_id = subscription_id;
//     this.client_id = client_id;
//     this.amount = amount;
//     this.currency = currency;
//     this.payment_method = payment_method;
//     this.status = status;
//     this.transaction_date = transaction_date;
//     this.refund_reason = refund_reason;
//   }
// }

// class ClientSubscription {
//   constructor({
//     subscription_id,
//     client_id,
//     plan_id,
//     remaining_sessions,
//     start_date,
//     end_date,
//     status,
//     refunded_amount,
//   }) {
//     this.subscription_id = subscription_id;
//     this.client_id = client_id;
//     this.plan_id = plan_id;
//     this.remaining_sessions = remaining_sessions;
//     this.start_date = start_date;
//     this.end_date = end_date;
//     this.status = status;
//     this.refunded_amount = refunded_amount;
//   }
// }

// class SubscriptionPlan {
//   constructor({
//     plan_id,
//     plan_name,
//     description,
//     price,
//     currency,
//     session_limit,
//     duration_days,
//     created_at,
//     is_active,
//   }) {
//     this.plan_id = plan_id;
//     this.plan_name = plan_name;
//     this.description = description;
//     this.price = price;
//     this.currency = currency;
//     this.session_limit = session_limit;
//     this.duration_days = duration_days;
//     this.created_at = created_at;
//     this.is_active = is_active;
//   }
// }

// class User {
//   constructor({
//     user_id,
//     name,
//     email,
//     password,
//     date_of_birth,
//     profile_picture,
//     created_at,
//     updated_at,
//     last_login,
//     phone_number,
//     is_active,
//     gender,
//     is_email_verified
//   }) {
//     this.user_id = user_id;
//     this.name = name;
//     this.email = email;
//     this.password = password;
//     this.date_of_birth = date_of_birth;
//     this.profile_picture = profile_picture;
//     this.created_at = created_at;
//     this.updated_at = updated_at;
//     this.last_login = last_login;
//     this.phone_number = phone_number;
//     this.is_active = is_active;
//     this.gender = gender;
//     this.is_email_verified = is_email_verified;
//   }
// }

// class UserRole {
//   constructor({ user_id, role_id }) {
//     this.user_id = user_id;
//     this.role_id = role_id;
//   }
// }

// class Role {
//   constructor({ role_id, role_name }) {
//     this.role_id = role_id;
//     this.role_name = role_name;
//   }
// }

// (module.exports = AdminModel
//   // Appointment,
//   // Payment,
//   // Session,
//   // Subscription,
//   // ClientSubscription,
//   // SubscriptionPlan,
//   // User,
//   // UserRole,
//   // Role;
module.exports = AdminModel;
