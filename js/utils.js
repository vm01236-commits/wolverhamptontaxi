// ============================================================
// UTILS - Helper functions for DOM manipulation and formatting
// ============================================================

/**
 * Query selector shortcut
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element to search within (optional)
 * @returns {Element|null} The matched element or null
 */
export function qs(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all shortcut
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element to search within (optional)
 * @returns {NodeList} List of matched elements
 */
export function qsa(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 */
export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

/**
 * Format seconds into MM:SS format
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time string (MM:SS)
 */
export function formatTime(seconds) {
    const secs = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format a date/timestamp for display in history (e.g. "25 Aug 2026, 14:30").
 * Ported from the Life-in-UK app's history page.
 * @param {Date|string|number} ts - Date object, ISO string, or epoch ms
 * @returns {string} Localised short date + time
 */
export function formatDate(ts) {
    return new Date(ts).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}