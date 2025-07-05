/**
 * Formats a 'HH:MM:SS' time string into a 12-hour AM/PM format.
 * Example: "14:30:00" becomes "2:30 PM".
 * @param {string} timeStr - The time string to format (e.g., "HH:MM:SS").
 * @returns {string} The formatted time string, or an empty string if input is invalid.
 */
const formatTime12h = (timeStr) => {
    // Return empty string if the input is null, undefined, or empty
    if (!timeStr) {
        return '';
    }

    // Split the time string to get hours and minutes
    const [hour, minute] = timeStr.split(':');

    // Convert hour part to a number
    let h = parseInt(hour, 10);
    
    // Determine AM or PM
    const ampm = h >= 12 ? 'PM' : 'AM';

    // Convert hour to 12-hour format
    h = h % 12;

    // The hour '0' should be '12' (for midnight)
    if (h === 0) {
        h = 12;
    }

    // Return the formatted string
    return `${h}:${minute} ${ampm}`;
};

/**
 * You can add more helper functions here in the future.
 * For example, a function to format dates consistently:
 *
 * const formatDate = (dateStr) => {
 *     return new Date(dateStr).toLocaleDateString('en-US', {
 *         weekday: 'long',
 *         year: 'numeric',
 *         month: 'long',
 *         day: 'numeric'
 *     });
 * };
 */

// Export the functions so they can be used in other files
module.exports = {
    formatTime12h,
    // formatDate, // Uncomment if you add the formatDate helper
};