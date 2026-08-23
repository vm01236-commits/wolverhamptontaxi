// ============================================================
// ANALYTICS MODULE - Handles smart practice and performance analysis
// ============================================================

import { resultsModule } from './results.js';

/**
 * Analyze user performance to identify weak areas
 * @param {Array} history - User's test history
 * @returns {Object} Analysis results
 */
export function analyzePerformance(history) {
    if (!history || history.length === 0) {
        return {
            overall: { correct: 0, total: 0, percent: 0 },
            byCategory: {},
            weakAreas: [],
            strongAreas: [],
            recommendations: []
        };
    }

    // Overall performance
    const totalCorrect = history.reduce((sum, item) => sum + item.score, 0);
    const totalQuestions = history.reduce((sum, item) => sum + item.total, 0);
    const overallPercent = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Performance by category
    const categoryStats = {};

    history.forEach(item => {
        const category = item.category || 'General';
        if (!categoryStats[category]) {
            categoryStats[category] = { correct: 0, total: 0 };
        }

        categoryStats[category].correct += item.score;
        categoryStats[category].total += item.total;
    });

    // Calculate percentages and categorize performance
    const byCategory = {};
    const weakAreas = [];
    const strongAreas = [];

    Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        const percent = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

        byCategory[category] = {
            correct: stats.correct,
            total: stats.total,
            percent: Math.round(percent * 10) / 10
        };

        if (percent < 60) {
            weakAreas.push({ category, percent });
        } else if (percent >= 80) {
            strongAreas.push({ category, percent });
        }
    });

    // Sort weak and strong areas
    weakAreas.sort((a, b) => a.percent - b.percent);
    strongAreas.sort((a, b) => b.percent - a.percent);

    // Generate recommendations
    const recommendations = generateRecommendations(weakAreas, byCategory);

    return {
        overall: { correct: totalCorrect, total: totalQuestions, percent: Math.round(overallPercent * 10) / 10 },
        byCategory,
        weakAreas,
        strongAreas,
        recommendations
    };
}

/**
 * Generate study recommendations based on weak areas
 * @param {Array} weakAreas - Array of weak area objects
 * @param {Object} byCategory - Performance by category
 * @returns {Array} Recommendation strings
 */
function generateRecommendations(weakAreas, byCategory) {
    const recommendations = [];

    if (weakAreas.length === 0) {
        recommendations.push("Excellent performance! Keep up the good work.");
        return recommendations;
    }

    // Top 3 weak areas
    const topWeak = weakAreas.slice(0, 3);

    topWeak.forEach(area => {
        recommendations.push(`Focus on ${area.category} - currently at ${area.percent}% accuracy`);
    });

    // Add general recommendations
    if (weakAreas.length > 3) {
        recommendations.push(`You have ${weakAreas.length} areas needing improvement. Start with the top 3.`);
    }

    recommendations.append("Review the Application Guide for detailed explanations.");
    recommendations.append("Use practice mode to strengthen weak areas.");

    return recommendations;
}

/**
 * Get suggested practice session based on weak areas
 * @param {Array} history - User's test history
 * @param {number} questionCount - Number of questions for practice session
 * @returns {Object} Suggested practice session
 */
export function getSuggestedPracticeSession(history, questionCount = 10) {
    const analysis = analyzePerformance(history);

    if (analysis.weakAreas.length === 0) {
        // No weak areas, suggest mixed practice
        return {
            type: 'mixed',
            topic: null,
            questionCount,
            description: 'Mixed practice session covering all topics'
        };
    }

    // Suggest practice on the weakest area
    const weakestArea = analysis.weakAreas[0];

    return {
        type: 'focused',
        topic: weakestArea.category,
        questionCount,
        description: `Focused practice on ${weakestArea.category} (currently ${weakestArea.percent}% accuracy)`
    };
}

/**
 * Track time spent studying
 * @param {string} topic - Topic studied
 * @param {number} minutes - Minutes spent
 */
export function trackStudyTime(topic, minutes) {
    const studyTime = JSON.parse(localStorage.getItem('wt-studyTime') || '{}');
    studyTime[topic] = (studyTime[topic] || 0) + minutes;
    localStorage.setItem('wt-studyTime', JSON.stringify(studyTime));
}

/**
 * Get study time statistics
 * @returns {Object} Study time by topic
 */
export function getStudyTimeStats() {
    return JSON.parse(localStorage.getItem('wt-studyTime') || '{}');
}

/**
 * Get learning velocity (improvement over time)
 * @param {Array} history - User's test history
 * @returns {Object} Learning velocity data
 */
export function getLearningVelocity(history) {
    if (!history || history.length < 2) {
        return { velocity: 0, trend: 'insufficient_data' };
    }

    // Sort by date
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate improvement over time
    const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.score / item.total, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.score / item.total, 0) / secondHalf.length;

    const velocity = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
        velocity: Math.round(velocity * 10) / 10,
        trend: velocity > 5 ? 'improving' : velocity < -5 ? 'declining' : 'stable',
        firstHalfAverage: Math.round(firstAvg * 100 * 10) / 10,
        secondHalfAverage: Math.round(secondAvg * 100 * 10) / 10
    };
}

// Export functions for use in other modules
export const analyticsModule = {
    analyzePerformance,
    generateRecommendations,
    getSuggestedPracticeSession,
    trackStudyTime,
    getStudyTimeStats,
    getLearningVelocity
};