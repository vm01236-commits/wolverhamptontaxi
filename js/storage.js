// ============================================================
// STORAGE - Handles saving and loading data from localStorage
// ============================================================

// In-progress exam session
const IN_PROGRESS_KEY = 'wt-in-progress';

// Bookmarks storage
const BOOKMARKS_KEY = 'wt-bookmarks';

// Exam results history
const RESULTS_KEY = 'wt-results';

// Per-question performance stats (drives smart practice)
const QUESTION_STATS_KEY = 'wt-question-stats';

/**
 * Safe JSON read - a corrupted or blocked value falls back instead of
 * crashing whichever view asked for it (private mode / quota errors).
 */
function safeRead(key, fallback) {
    try {
        const json = localStorage.getItem(key);
        return json ? JSON.parse(json) : fallback;
    } catch (e) {
        console.warn(`Corrupted data in "${key}", resetting to default.`, e);
        try { localStorage.removeItem(key); } catch (_) { /* ignore */ }
        return fallback;
    }
}

/**
 * Get the in-progress exam session
 * @returns {Object|null} The in-progress session or null
 */
export function getInProgress() {
    return safeRead(IN_PROGRESS_KEY, null);
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
    return new Set(safeRead(BOOKMARKS_KEY, []));
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
    return safeRead(RESULTS_KEY, []);
}

/**
 * Get per-question performance stats recorded by recordAttempt().
 * Shape: { "<examKey>:<questionId>": {
 *     examKey, questionId, category, timesSeen, timesWrong,
 *     timesCorrect, timesSkipped, lastOutcome, lastSeenAt } }
 * @returns {Object} Stats map keyed by exam:question
 */
export function getQuestionStats() {
    return safeRead(QUESTION_STATS_KEY, {});
}

/**
 * Record an attempt for practice session generation.
 * Folds each finished attempt into per-question stats so smart
 * practice can build "incorrect only" / "repeated mistakes" /
 * "weak areas" pools from real mistake history.
 * @param {string} mockId - The mock/exam ID (or 'practice')
 * @param {Array} gradedQuestions - Graded question objects from finishExam
 */
export function recordAttempt(mockId, gradedQuestions) {
    if (!Array.isArray(gradedQuestions) || gradedQuestions.length === 0) return;

    const stats = safeRead(QUESTION_STATS_KEY, {});

    gradedQuestions.forEach((q) => {
        const id = q.id !== undefined ? q.id : q.questionId;
        if (id === undefined) return;

        // A practice session can mix questions from several mocks,
        // so each question's own examId wins over the session's.
        const examKey = q.examId ?? mockId ?? 'practice';
        const key = `${examKey}:${id}`;
        const prev = stats[key] || {
            examKey,
            questionId: id,
            category: q.category || null,
            timesSeen: 0,
            timesWrong: 0,
            timesCorrect: 0,
            timesSkipped: 0,
            lastOutcome: null,
            lastSeenAt: null,
        };

        if (!prev.category && q.category) prev.category = q.category;

        const outcome = !q.answered ? 'skipped' : q.isCorrect ? 'correct' : 'wrong';
        prev.timesSeen += 1;
        if (outcome === 'correct') prev.timesCorrect += 1;
        else if (outcome === 'wrong') prev.timesWrong += 1;
        else prev.timesSkipped += 1;
        prev.lastOutcome = outcome;
        prev.lastSeenAt = Date.now();

        stats[key] = prev;
    });

    try {
        localStorage.setItem(QUESTION_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn('Could not save question stats:', e);
    }
}

/**
 * Clear all stored data (for testing/debugging)
 */
export function clearAllStorage() {
    localStorage.removeItem(IN_PROGRESS_KEY);
    localStorage.removeItem(BOOKMARKS_KEY);
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem(QUESTION_STATS_KEY);
}

/* ============================================================
   PREFERENCES — theme, colour scheme and text size ("display type")
   Ported from the Life-in-UK app: one JSON blob under wt-prefs
   holding { theme, scheme, fontScale }. Falls back to the legacy
   wt-theme / wt-scheme keys so existing users keep their choice.
   ============================================================ */

const PREFS_KEY = 'wt-prefs';

/** True when localStorage is usable (private mode safe). */
export const storageAvailable = (() => {
    try {
        const probe = '__wt_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
        return true;
    } catch {
        return false;
    }
})();

const DEFAULT_PREFS = {
    theme: 'system',   // 'light' | 'dark' | 'system'
    scheme: 'default', // 'default' | 'warm' | 'cool' | 'contrast' | 'mono'
    fontScale: 100,    // percent — drives the --font-scale CSS variable
};

/**
 * Get user preferences merged over defaults. Migrates the legacy
 * wt-theme/wt-scheme keys on first read so nobody loses their setup.
 * @returns {{theme:string, scheme:string, fontScale:number}}
 */
export function getPrefs() {
    const saved = safeRead(PREFS_KEY, {});
    const legacyTheme = (() => {
        try { return localStorage.getItem('wt-theme'); } catch { return null; }
    })();
    const legacyScheme = (() => {
        try { return localStorage.getItem('wt-scheme'); } catch { return null; }
    })();

    return {
        ...DEFAULT_PREFS,
        ...(legacyTheme === 'light' || legacyTheme === 'dark'
            ? { theme: legacyTheme } : {}),
        ...(legacyScheme ? { scheme: legacyScheme } : {}),
        ...saved,
    };
}

/**
 * Merge a patch into the saved preferences and persist them.
 * @param {Partial<{theme:string, scheme:string, fontScale:number}>} patch
 * @returns {{theme:string, scheme:string, fontScale:number}} The new prefs
 */
export function savePrefs(patch) {
    const next = { ...getPrefs(), ...patch };
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch (e) {
        console.warn('Could not save preferences:', e);
    }
    return next;
}