const nodemailer = require('nodemailer');

// Create a test account if no credentials are provided
const createTestAccount = async () => {
    try {
        console.log('[Email Service] Creating test account...');
        const testAccount = await nodemailer.createTestAccount();
        console.log('[Email Service] Test account created:', {
            user: testAccount.user,
            pass: testAccount.pass,
            smtp: testAccount.smtp
        });
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } catch (error) {
        console.error('[Email Service] Error creating test account:', error);
        throw error;
    }
};

// Initialize transporter
let transporter;
const initializeTransporter = async () => {
    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log('[Email Service] Initializing with Gmail credentials...');
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            // Verify connection configuration
            await transporter.verify();
            console.log('[Email Service] Gmail connection verified successfully');
        } else {
            console.warn('[Email Service] No email credentials found. Using Ethereal test account.');
            transporter = await createTestAccount();
        }
    } catch (error) {
        console.error('[Email Service] Error initializing transporter:', error);
        throw error;
    }
};

// Initialize on module load
initializeTransporter().catch(error => {
    console.error('[Email Service] Failed to initialize:', error);
});

exports.sendMail = async (to, subject, html) => {
    const startTime = Date.now();
    console.log('[Email Service] Starting email send process:', {
        to,
        subject,
        timestamp: new Date().toISOString()
    });

    try {
        if (!transporter) {
            console.error('[Email Service] Transporter not initialized');
            throw new Error('Email service not configured');
        }

        // Log email content preview
        console.log('[Email Service] Email content preview:', {
            subject,
            to,
            contentLength: html.length,
            hasHtml: !!html
        });
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER || 'test@example.com',
            to,
            subject,
            html
        });

        const duration = Date.now() - startTime;
        console.log('[Email Service] Email sent successfully:', {
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info),
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });

        return info;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('[Email Service] Failed to send email:', {
            error: error.message,
            code: error.code,
            command: error.command,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });

        // Log specific error types
        if (error.code === 'EAUTH') {
            console.error('[Email Service] Authentication failed. Check your email credentials.');
        } else if (error.code === 'ESOCKET') {
            console.error('[Email Service] Network error. Check your internet connection.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('[Email Service] Connection timed out.');
        }

        throw error;
    }
};
