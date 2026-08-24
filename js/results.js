// ============================================================
// RESULTS MODULE - Handles exam results calculation, storage, and retrieval
// ============================================================

/**
 * Calculate exam results based on questions and user answers
 * @param {Array} questions - Array of question objects
 * @param {Array} answers - Array of user answers (null if unanswered)
 * @param {Object} config - Configuration object (passMarkPercent, etc.)
 * @returns {Object} Results object
 */
export function calculateResults(questions, answers, config = {}) {
    const passMarkPercent = config.passMarkPercent || 75;

    let correctCount = 0;
    const questionResults = [];

    questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correctIndexes;

        // Check if answer is correct
        let isCorrect = false;
        if (userAnswer !== null && correctAnswer !== null) {
            // For single choice, compare directly
            // For multiple choice, check if arrays match (order doesn't matter)
            if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                const sortedUser = [...userAnswer].sort((a, b) => a - b);
                const sortedCorrect = [...correctAnswer].sort((a, b) => a - b);
                isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
            } else {
                // Handle case where one is array and other isn't (shouldn't happen with valid data)
                isCorrect = false;
            }
        }

        if (isCorrect) correctCount++;

        questionResults.push({
            questionIndex: index,
            questionId: question.id,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            explanation: question.explanation
        });
    });

    const totalQuestions = questions.length;
    const scorePercent = (correctCount / totalQuestions) * 100;
    const passed = scorePercent >= passMarkPercent;

    return {
        correctCount,
        totalQuestions,
        scorePercent,
        passed,
        questionResults,
        passMarkPercent
    };
}

/**
 * Save exam result to localStorage
 * @param {Object} result - Result object to save
 * @param {string} type - Type of exam ('mock' or 'practice')
 * @param {string} category - Optional category for practice sessions
 * @param {string} mockId - Optional mock test ID for mock tests
 */
export function saveResult(result, type, category = null, mockId = null) {
    // Get existing history
    const history = JSON.parse(localStorage.getItem('wt-history') || '[]');

    // Create history item
    const historyItem = {
        id: `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        type: type,
        category: category,
        mockId: mockId,
        score: result.correctCount,
        total: result.totalQuestions,
        percent: result.scorePercent,
        passed: result.passed,
        answers: result.questionResults.map(qr => ({
            questionId: qr.questionId,
            userAnswer: qr.userAnswer,
            correctAnswer: qr.correctAnswer,
            isCorrect: qr.isCorrect
        }))
    };

    // Add to history
    history.push(historyItem);

    // Save back to localStorage
    localStorage.setItem('wt-history', JSON.stringify(history));
}

/**
 * Get exam history from localStorage.
 *
 * Attempts are saved in TWO places: the practice/mock views write to
 * 'wt-history' via saveResult(), while the exam runner writes raw
 * result objects to 'wt-results' via storage.addResult(). Merge both
 * stores and normalise the 'wt-results' schema (where `score` holds a
 * percentage) into the history schema (where `score` is a count).
 * @returns {Array} Array of history items
 */
export function getHistory() {
    const legacy = JSON.parse(localStorage.getItem('wt-history') || '[]');

    const stored = JSON.parse(localStorage.getItem('wt-results') || '[]');
    const normalized = stored.map(r => {
        const total = r.total ?? 0;
        const percent = typeof r.score === 'number' ? r.score
            : total > 0 ? Math.round(((r.correct ?? 0) / total) * 100) : 0;
        return {
            id: r.id,
            timestamp: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
            type: (r.mode && r.mode !== 'exam') ? 'practice' : 'mock',
            category: r.category ?? null,
            mockId: r.examId ?? null,
            score: typeof r.correct === 'number' ? r.correct : Math.round((percent / 100) * total),
            total,
            percent,
            passed: !!r.passed,
            answers: Array.isArray(r.questions) ? r.questions : []
        };
    });

    return [...legacy, ...normalized];
}

/**
 * Clear exam history from localStorage
 */
export function clearHistory() {
    localStorage.removeItem('wt-history');
    localStorage.removeItem('wt-results');
}

/**
 * Get statistics from history
 * @returns {Object} Statistics object
 */
export function getStatistics() {
    const history = getHistory();

    if (history.length === 0) {
        return {
            totalTests: 0,
            averageScore: 0,
            passRate: 0,
            bestScore: 0,
            recentTrend: []
        };
    }

    const totalTests = history.length;
    const averageScore = history.reduce((sum, item) => sum + item.percent, 0) / totalTests;
    const passRate = (history.filter(item => item.passed).length / totalTests) * 100;
    const bestScore = Math.max(...history.map(item => item.percent));

    // Get recent trend (last 5 tests)
    const recentTests = [...history]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(item => ({
            date: new Date(item.timestamp).toLocaleDateString(),
            percent: item.percent,
            passed: item.passed
        }));

    return {
        totalTests,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
        recentTrend: recentTests
    };
}

/**
 * Get category-wise performance
 * @returns {Object} Object with category performance data
 */
export function getCategoryPerformance() {
    const history = getHistory();
    const categoryStats = {};

    history.forEach(item => {
        const category = item.category || 'General';
        if (!categoryStats[category]) {
            categoryStats[category] = { correct: 0, total: 0, attempts: 0 };
        }

        categoryStats[category].correct += item.score;
        categoryStats[category].total += item.total;
        categoryStats[category].attempts++;
    });

    // Calculate percentages
    const performance = {};
    Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        const percent = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

        performance[category] = {
            correct: stats.correct,
            total: stats.total,
            percent: Math.round(percent * 10) / 10,
            attempts: stats.attempts
        };
    });

    return performance;
}

/**
 * Export results to CSV format
 * @param {Array} history - History array to export
 * @returns {string} CSV formatted string
 */
export function exportResultsToCSV(history) {
    if (!history || history.length === 0) {
        return 'No data to export';
    }

    // CSV header
    let csv = 'Date,Type,Category,Score,Total,Percentage,Passed\n';

    // Add data rows
    history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const type = item.type === 'mock' ? 'Mock Test' : 'Practice Session';
        const category = item.category || 'N/A';
        const score = item.score;
        const total = item.total;
        const percentage = item.percent.toFixed(1);
        const passed = item.passed ? 'Yes' : 'No';

        csv += `"${date}","${type}","${category}",${score},${total},${percentage},${passed}\n`;
    });

    return csv;
}

/**
 * Import results from CSV format (placeholder for future implementation)
 * @param {string} csvData - CSV formatted string
 * @returns {boolean} Success status
 */
export function importResultsFromCSV(csvData) {
    // This would be implemented in a future version
    // For now, just return false to indicate not implemented
    console.log('CSV import not yet implemented');
    return false;
}

// Export functions for use in other modules
export const resultsModule = {
    calculateResults,
    saveResult,
    getHistory,
    clearHistory,
    getStatistics,
    getCategoryPerformance,
    exportResultsToCSV,
    importResultsFromCSV
};