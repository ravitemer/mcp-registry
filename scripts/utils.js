/**
 * Utility functions for the MCP Registry
 */

/**
 * Get current Unix timestamp
 * @returns {number} Current Unix timestamp in seconds
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Validate if a string is a valid server ID (alphanumeric and underscores only, min 3 chars)
 * @param {string} id - Server ID to validate
 * @returns {boolean} True if valid
 */
export function isValidServerId(id) {
  return /^[a-zA-Z0-9_]{3,}$/.test(id);
}

/**
 * Sanitize a string to create a valid server ID
 * @param {string} name - Display name to convert
 * @returns {string} Valid server ID with alphanumeric and underscores only
 */
export function sanitizeToId(name) {
  return name
    .replace(/[^a-zA-Z0-9_\s-]/g, '') // Keep only alphanumeric, underscore, spaces, and hyphens
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}


