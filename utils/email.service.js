// utils/email.service.js
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Create a transporter using SMTP settings from environment variables
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendEmail(to, subject, htmlContent, textContent) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: htmlContent,
                text: textContent, // Plain text alternative
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            // Preview only if sending through ethereal account
            if (process.env.NODE_ENV === 'development' && process.env.EMAIL_HOST === 'smtp.ethereal.email') {
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            }
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error(`Failed to send email to ${to}. Please check email service configuration.`);
        }
    }

    async sendEmailVerification(userEmail, verificationToken) {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const subject = 'Verify Your Email Address';
        const html = `
            <p>Hello,</p>
            <p>Thank you for registering with our service. Please verify your email address by clicking the link below:</p>
            <p><a href="${verificationLink}">Verify My Email</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, no further action is required.</p>
            <p>Regards,</p>
            <p>Your App Team</p>
        `;
        const text = `
            Hello,

            Thank you for registering with our service. Please verify your email address by visiting the following link:

            ${verificationLink}

            This link will expire in 24 hours.

            If you did not create an account, no further action is required.

            Regards,
            Your App Team
        `;
        return this.sendEmail(userEmail, subject, html, text);
    }
}

module.exports = new EmailService(); // Export an instance