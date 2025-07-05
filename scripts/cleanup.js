const cron = require('node-cron');
const db = require('../config/database'); // Adjust path if needed

// Schedule cleanup: Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    console.log(`🗑️ Deleted ${result.rowCount} expired refresh tokens`);
  } catch (error) {
    console.error('❌ Failed to clean up tokens:', error.message);
  }
});

console.log('🔄 Token cleanup job scheduled');
