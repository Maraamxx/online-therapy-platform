// src/services/jitsiLogicService.js
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For MD5 hash if using Gravatar

// Load environment variables
const JITSI_APP_ID = process.env.JITSI_APP_ID;
const JITSI_PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY; // Your private key content
const JITSI_KEY_ID = process.env.JITSI_KEY_ID; // The KID from JaaS

/**
 * Generates a unique Jitsi room name for an appointment.
 * @param {string} appointmentId - The ID of the appointment.
 * @returns {string} A unique Jitsi room name.
 */
const generateJitsiRoomName = (appointmentId) => {
    return `teletherapy-app-<span class="math-inline">\{appointmentId\}\-</span>{uuidv4()}`;
};

/**
 * Generates a Jitsi authentication JWT for JaaS.
 * @param {string} roomName - The name of the Jitsi room (e.g., "my-unique-room").
 * @param {object} userInfo - User information (id, name, email).
 * @param {boolean} isModerator - Whether the user should be a moderator.
 * @returns {string} The signed JWT.
 */
const generateJitsiJwt = (roomName, userInfo, isModerator) => {
    if (!JITSI_APP_ID || !JITSI_PRIVATE_KEY || !JITSI_KEY_ID) {
        console.error("Jitsi APP_ID, PRIVATE_KEY, or KEY_ID not configured. JWT cannot be generated.");
        return null;
    }

    // JaaS expects roomName in format "APP_ID/your-room-name"
    const jaasRoomName = `<span class="math-inline">\{JITSI\_APP\_ID\}/</span>{roomName}`;

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

    const payload = {
        iss: "chat", // Hardcoded for JaaS
        aud: "jitsi", // Hardcoded for JaaS
        sub: JITSI_APP_ID, // Your JaaS App ID
        room: jaasRoomName, // The room to join in JaaS format
        nbf: currentTime, // Not Before: current time
        exp: currentTime + (60 * 60), // Expiration: 1 hour from now

        context: {
            user: {
                id: userInfo.userId,
                name: userInfo.name,
                email: userInfo.email,
                avatar: `https://gravatar.com/avatar/${crypto.createHash('md5').update(userInfo.email).digest('hex')}?d=mp`,
                moderator: isModerator ? "true" : "false" // <--- MUST be string "true" or "false"
            },
            features: {
                // Specify features as strings "true" or "false"
                "livestreaming": isModerator ? "true" : "false",
                "outbound-call": isModerator ? "true" : "false",
                "lobby": "true", // Recommended to keep lobby "true"
                "transcribing": isModerator ? "true" : "false",
                "sip-inbound-call": isModerator ? "true" : "false",
                "recording": isModerator ? "true" : "false"
            }
        }
    };

    const header = {
        alg: 'RS256', // JaaS uses RS256
        kid: JITSI_KEY_ID, // The Key ID from JaaS console
        typ: 'JWT'
    };

    const token = jwt.sign(payload, JITSI_PRIVATE_KEY, { algorithm: 'RS256', header: header });
    return token;
};

module.exports = {
    generateJitsiRoomName,
    generateJitsiJwt,
};