// services/email.service.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure your email credentials are in .env

class EmailService {
    constructor() {
        // Configure your email transporter
        // This example uses a Gmail SMTP setup, adjust for your chosen service
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,    // e.g., 'smtp.gmail.com'
            port: process.env.EMAIL_PORT,    // e.g., 587 (for TLS) or 465 (for SSL)
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,    // Your email address
                pass: process.env.EMAIL_PASS     // Your email password or app-specific password
            }
        });
    }

    async sendApprovalEmail(recipientEmail, therapistName) {
        const mailOptions = {
            from: process.env.EMAIL_FROM, // Sender address (e.g., 'Your App Support <support@yourapp.com>')
            to: recipientEmail,
            subject: 'Your Therapist Application Has Been Approved!',
            html: `
                <p>Dear ${therapistName},</p>
                <p>We are thrilled to inform you that your application to join our platform as a therapist has been **approved**!</p>
                <p>You can now log in to your account and access all the features available to approved therapists, including managing your profile, appointments, and connecting with clients.</p>
                <p>Click here to log in: <a href="${process.env.APP_BASE_URL}/api/auth/login">Login to Your Dashboard</a></p>
                <p>We look forward to your contributions to our community.</p>
                <p>Best regards,</p>
                <p>The INNERAURA Team</p>
            `,
            text: `Dear ${therapistName},\n\nWe are thrilled to inform you that your application to join our platform as a therapist has been approved!\n\nYou can now log in to your account and access all the features available to approved therapists, including managing your profile, appointments, and connecting with clients.\n\nLogin to Your Dashboard: ${process.env.APP_BASE_URL}/api/auth/login\n\nWe look forward to your contributions to our community.\n\nBest regards,\nThe [Your App Name] Team`
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Approval email sent successfully to ${recipientEmail}`);
        } catch (error) {
            console.error(`Error sending approval email to ${recipientEmail}:`, error);
            throw new Error(`Failed to send approval email: ${error.message}`);
        }
    }
}

module.exports = new EmailService(); // Export an instance