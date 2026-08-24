// ============================================================
// STORAGE - Handles saving and loading data from localStorage
// ============================================================

// In-progress exam session
const IN_PROGRESS_KEY = 'wt-in-progress';

// Bookmarks storage
const BOOKMARKS_KEY = 'wt-bookmarks';

// Exam results history
const RESULTS_KEY = 'wt-results';

/**
 * Get the in-progress exam session
 * @returns {Object|null} The in-progress session or null
 */
export function getInProgress() {
    const json = localStorage.getItem(IN_PROGRESS_KEY);
    return json ? JSON.parse(json) : null;
}

/**
 * Save the in-progress exam session
 * @param {Object} session - The session to save
 */
export function saveInProgress(session) {
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(session));
}

/**
 * Clear the in-progress exam session
 */
export function clearInProgress() {
    localStorage.removeItem(IN_PROGRESS_KEY);
}

/**
 * Save a bookmark
 * @param {Object} bookmark - The bookmark to save
 */
export function saveBookmark(bookmark) {
    const bookmarks = getBookmarks();
    bookmarks.add(bookmark.questionId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
}

/**
 * Remove a bookmark
 * @param {string} examId - The exam ID
 * @param {string} questionId - The question ID
 */
export function removeBookmark(examId, questionId) {
    const bookmarks = getBookmarks();
    bookmarks.delete(questionId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
}

/**
 * Check if a question is bookmarked
 * @param {string} examId - The exam ID
 * @param {string} questionId - The question ID
 * @returns {boolean} True if bookmarked
 */
export function isBookmarked(examId, questionId) {
    const bookmarks = getBookmarks();
    return bookmarks.has(questionId);
}

/**
 * Get all bookmarked question IDs
 * @returns {Set} Set of bookmarked question IDs
 */
export function getBookmarks() {
    const json = localStorage.getItem(BOOKMARKS_KEY);
    if (!json) return new Set();
    return new Set(JSON.parse(json));
}

/**
 * Add a result to history
 * @param {Object} result - The result to add
 * @returns {string} The ID of the added result
 */
export function addResult(result) {
    const results = getResults();
    const id = `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    result.id = id;
    results.push(result);
    // Keep only last 100 results
    if (results.length > 100) {
        results.splice(0, results.length - 100);
    }
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    return id;
}

/**
 * Remove a single result by id
 * @param {string} id - The result id
 * @returns {boolean} True if the result was found and removed
 */
export function deleteResult(id) {
    const results = getResults();
    const index = results.findIndex(r => r.id === id);
    if (index === -1) return false;
    results.splice(index, 1);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    return true;
}

/**
 * Get all results
 * @returns {Array} Array of result objects
 */
export function getResults() {
    const json = localStorage.getItem(RESULTS_KEY);
    return json ? JSON.parse(json) : [];
}

/**
 * Record an attempt for practice session generation
 * @param {string} mockId - The mock ID
 * @param {Array} gradedQuestions - The graded questions from the attempt
 */
export function recordAttempt(mockId, gradedQuestions) {
    // This is used for the practice engine to track weak areas
    // Implementation can be expanded as needed
    console.log(`Recording attempt for mock ${mockId}`, gradedQuestions.length, 'questions');
}

/**
 * Clear all stored data (for testing/debugging)
 */
export function clearAllStorage() {
    localStorage.removeItem(IN_PROGRESS_KEY);
    localStorage.removeItem(BOOKMARKS_KEY);
    localStorage.removeItem(RESULTS_KEY);
}