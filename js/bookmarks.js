// ============================================================
// BOOKMARKS MODULE - Handles saving and reviewing bookmarked questions
// ============================================================

/**
 * Toggle bookmark status for a question
 * @param {string} questionId - ID of the question to bookmark/unbookmark
 * @returns {boolean} New bookmark status (true if bookmarked, false if removed)
 */
export function toggleBookmark(questionId) {
    // Get existing bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('wt-bookmarks') || '[]');

    // Check if question is already bookmarked
    const index = bookmarks.indexOf(questionId);
    let isBookmarked = false;

    if (index === -1) {
        // Not bookmarked, add it
        bookmarks.push(questionId);
        isBookmarked = true;
    } else {
        // Already bookmarked, remove it
        bookmarks.splice(index, 1);
        isBookmarked = false;
    }

    // Save back to localStorage
    localStorage.setItem('wt-bookmarks', JSON.stringify(bookmarks));

    return isBookmarked;
}

/**
 * Check if a question is bookmarked
 * @param {string} questionId - ID of the question to check
 * @returns {boolean} True if bookmarked, false otherwise
 */
export function isBookmarked(questionId) {
    const bookmarks = JSON.parse(localStorage.getItem('wt-bookmarks') || '[]');
    return bookmarks.includes(questionId);
}

/**
 * Get all bookmarked question IDs
 * @returns {Array} Array of bookmarked question IDs
 */
export function getBookmarks() {
    return JSON.parse(localStorage.getItem('wt-bookmarks') || '[]');
}

/**
 * Clear all bookmarks
 */
export function clearBookmarks() {
    localStorage.removeItem('wt-bookmarks');
}

/**
 * Get bookmarked questions with full details
 * @returns {Promise<Array>} Promise that resolves with array of question objects
 */
export async function getBookmarkedQuestions() {
    try {
        const bookmarks = getBookmarks();
        if (bookmarks.length === 0) {
            return [];
        }

        // Load all questions
        const questions = await window.dataLayer.loadQuestions();

        // Filter to only bookmarked questions
        const bookmarkedQuestions = questions.filter(q =>
            bookmarks.includes(q.id)
        );

        return bookmarkedQuestions;
    } catch (error) {
        console.error('Error getting bookmarked questions:', error);
        return [];
    }
}

/**
 * Remove a specific bookmark
 * @param {string} questionId - ID of the question to unbookmark
 * @returns {boolean} True if successfully removed, false if not found
 */
export function removeBookmark(questionId) {
    const bookmarks = JSON.parse(localStorage.getItem('wt-bookmarks') || '[]');
    const index = bookmarks.indexOf(questionId);

    if (index === -1) {
        return false; // Not found
    }

    // Remove the bookmark
    bookmarks.splice(index, 1);
    localStorage.setItem('wt-bookmarks', JSON.stringify(bookmarks));

    return true;
}

/**
 * Get bookmark count
 * @returns {number} Number of bookmarked questions
 */
export function getBookmarkCount() {
    return getBookmarks().length;
}

// Export functions for use in other modules
export const bookmarksModule = {
    toggleBookmark,
    isBookmarked,
    getBookmarks,
    clearBookmarks,
    getBookmarkedQuestions,
    removeBookmark,
    getBookmarkCount
};