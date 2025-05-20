import moment from 'moment-timezone';

/**
 * Format a timestamp with timezone adjustment
 * @param {Date|String|Number} timestamp - The timestamp to format
 * @param {String} timezone - Timezone to use (e.g., 'Asia/Kolkata')
 * @param {String} format - Formatting string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {String} Formatted timestamp
 */
export const formatTimestamp = (timestamp, timezone = 'Asia/Kolkata', format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!timestamp) return 'Never';
    return moment(timestamp).tz(timezone).format(format);
};

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param {Date|String|Number} timestamp - The timestamp 
 * @param {String} timezone - Timezone to use
 * @returns {String} Relative time string
 */
export const formatRelativeTime = (timestamp, timezone = 'Asia/Kolkata') => {
    if (!timestamp) return 'Never';
    return moment(timestamp).tz(timezone).fromNow();
};

/**
 * Convert a UTC timestamp to a specific timezone
 * @param {Date|String|Number} timestamp - The timestamp 
 * @param {String} timezone - Target timezone
 * @returns {Date} Date object adjusted to the timezone
 */
export const convertToTimezone = (timestamp, timezone = 'Asia/Kolkata') => {
    if (!timestamp) return null;
    return moment(timestamp).tz(timezone).toDate();
};

/**
 * Get the current time in a specific timezone
 * @param {String} timezone - Target timezone
 * @returns {Date} Current time in specified timezone
 */
export const getCurrentTimeInTimezone = (timezone = 'Asia/Kolkata') => {
    return moment().tz(timezone).toDate();
};

/**
 * Format a duration in a human-readable way
 * @param {Number} milliseconds - Duration in milliseconds
 * @returns {String} Formatted duration
 */
export const formatDuration = (milliseconds) => {
    if (!milliseconds && milliseconds !== 0) return 'Unknown';

    const duration = moment.duration(milliseconds);

    if (duration.asSeconds() < 60) {
        return `${Math.floor(duration.asSeconds())}s`;
    } else if (duration.asMinutes() < 60) {
        return `${Math.floor(duration.asMinutes())}m ${Math.floor(duration.seconds())}s`;
    } else if (duration.asHours() < 24) {
        return `${Math.floor(duration.asHours())}h ${Math.floor(duration.minutes())}m`;
    } else {
        return `${Math.floor(duration.asDays())}d ${Math.floor(duration.hours())}h`;
    }
};

/**
 * Check if a timestamp falls within a time window
 * @param {Date|String|Number} timestamp - The timestamp to check
 * @param {Object} timeWindow - Time window object with start and end properties (HH:MM format)
 * @param {String} timezone - Timezone to use
 * @returns {Boolean} Whether the timestamp is within the window
 */
export const isWithinTimeWindow = (timestamp, timeWindow, timezone = 'Asia/Kolkata') => {
    if (!timeWindow || !timeWindow.start || !timeWindow.end) {
        return true; // If no time window specified, assume always in window
    }

    // Special case: 00:00 to 00:00 means 24/7
    if (timeWindow.start === "00:00" && timeWindow.end === "00:00") {
        return true;
    }

    const time = moment(timestamp).tz(timezone);
    const timeString = time.format('HH:mm');

    return timeString >= timeWindow.start && timeString <= timeWindow.end;
};

/**
 * Check if a timestamp falls on a specified day of week
 * @param {Date|String|Number} timestamp - The timestamp to check
 * @param {Array} daysOfWeek - Array of days (0-6, where 0 is Sunday)
 * @param {String} timezone - Timezone to use
 * @returns {Boolean} Whether the timestamp is on a specified day
 */
export const isOnDayOfWeek = (timestamp, daysOfWeek, timezone = 'Asia/Kolkata') => {
    if (!daysOfWeek || daysOfWeek.length === 0) {
        return true; // If no days specified, assume all days are valid
    }

    const day = moment(timestamp).tz(timezone).day(); // 0-6
    return daysOfWeek.includes(day);
};

export default {
    formatTimestamp,
    formatRelativeTime,
    convertToTimezone,
    getCurrentTimeInTimezone,
    formatDuration,
    isWithinTimeWindow,
    isOnDayOfWeek
};