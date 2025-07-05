// services/therapist.service.js (Create this file if it doesn't exist)
const TherapistModel = require("../models/therapist.model");

class TherapistService {
    static async getTherapistApplicationStatus(userId) {
        const applicationDetails = await TherapistModel.getApplicationDetails(userId);

        if (!applicationDetails) {
            // Handle case where no application is found (e.g., therapist not registered yet, or error)
            return {
                applicationId: 'N/A',
                submissionDate: 'N/A',
                applicationStatus: 'No Application Found',
                reviewStages: {
                    submitted: false,
                    documentVerification: false,
                    backgroundCheck: false,
                    finalReview: false,
                    accountActivation: false
                }
            };
        }

        // Determine the current stage based on application_status or therapist_account_status
        // You'll need to define your status progression logic here.
        // For simplicity, let's map application_status to stages.
        let submitted = false;
        let documentVerification = false;
        let backgroundCheck = false;
        let finalReview = false;
        let accountActivation = false;

        switch (applicationDetails.application_status) {
            case 'Pending':
                submitted = true;
                documentVerification = true; // Assumed to be 'In Progress' for Pending
                break;
            case 'Approved':
                submitted = true;
                documentVerification = true;
                backgroundCheck = true;
                finalReview = true;
                accountActivation = true; // All stages complete
                break;
            case 'Rejected':
                submitted = true;
                // You might mark stages as 'completed' up to the point of rejection
                // or just mark the application as rejected.
                break;
            default:
                break;
        }

        // For the 'Pending Review' / 'In Progress' parts as shown in the screenshot,
        // we can use the application_status itself.
        const currentStatus = applicationDetails.application_status === 'Pending' ? 'Pending Review' : applicationDetails.application_status;

        // Calculate dynamic dates for review timeline
        const submissionDate = new Date(applicationDetails.submission_date);
        const reviewStartDate = submissionDate; // Review starts immediately after submission
        const decisionDateMin = new Date(reviewStartDate);
        decisionDateMin.setDate(decisionDateMin.getDate() + 3); // 3 days for "Under Review"

        const decisionDateMax = new Date(reviewStartDate);
        decisionDateMax.setDate(decisionDateMax.getDate() + 5); // 5 days for "Decision Notification"

        return {
            applicationId: applicationDetails.application_id,
            submissionDate: new Date(applicationDetails.submission_date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            applicationStatus: currentStatus,
            reviewStages: {
                submitted,
                documentVerification,
                backgroundCheck,
                finalReview,
                accountActivation
            },
            reviewTimeline: {
                applicationSubmitted: submissionDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                underReviewExpected: `1-3 days`, // Or dynamic: `${new Date().toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'})}-${decisionDateMin.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'})}`
                decisionNotificationExpected: `3-5 days`, // Or dynamic: `${decisionDateMin.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'})}-${decisionDateMax.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric'})}`
                averageReviewTime: `3-5 business days`
            }
        };
    }
}

module.exports = TherapistService;