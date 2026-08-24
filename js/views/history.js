// ============================================================
// HISTORY VIEW - Test history and progress tracking
// ============================================================

import { resultsModule } from '../results.js';

export function init(container) {
    // Load history view content
    container.innerHTML = `
        <div class="history-view">
            <!-- History Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Test History</h1>
                    <p class="text-muted">
                        Track your progress over time with detailed statistics from all your practice sessions and mock tests.
                    </p>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item" id="historyTotalTests">
                            <i class="fas fa-history"></i>
                            <span>0</span>
                        </div>
                        <div class="exam-meta-item" id="historyAverageScore">
                            <i class="fas fa-chart-line"></i>
                            <span>0%</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- History Filters -->
            <div class="history-filters" id="historyFilters">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading filters...</div>
                </div>
            </div>

            <!-- History List -->
            <div class="history-list" id="historyList">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading history...</div>
                </div>
            </div>

            <!-- History Charts -->
            <section class="history-charts" id="historyCharts" style="display: none;">
                <h2 class="section-title center">Progress Over Time</h2>
                <div class="chart-container" id="scoreChart">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Loading chart...</div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Load history data
    loadHistoryData();

    return Promise.resolve();
}

async function loadHistoryData() {
    try {
        // Load history from results module
        const history = resultsModule.getHistory();

        // Load questions data for category breakdown
        const questions = await window.dataLayer.loadQuestions();

        // Render filters
        renderHistoryFilters(questions);

        // Render history list
        renderHistoryList(history);

        // Update summary stats
        updateHistorySummary(history);

        // Show charts if we have enough data
        if (history.length >= 2) {
            document.getElementById('historyCharts').style.display = 'block';
            loadHistoryCharts(history);
        }

    } catch (error) {
        console.error('Error loading history data:', error);
        showErrorMessage();
    }
}

function renderHistoryFilters(questions) {
    const filtersContainer = document.getElementById('historyFilters');

    // Get unique categories from questions
    const categories = [...new Set(questions.map(q => q.category.trim()))].sort();

    filtersContainer.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="historyTypeFilter">Type</label>
            <select class="form-select" id="historyTypeFilter">
                <option value="all">All Tests</option>
                <option value="mock">Mock Tests</option>
                <option value="practice">Practice Sessions</option>
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="historyCategoryFilter">Category</label>
            <select class="form-select" id="historyCategoryFilter">
                <option value="all">All Categories</option>
                ${categories.map(category => `
                    <option value="${category}">${category}</option>
                `).join('')}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="historyDateFilter">Date Range</label>
            <select class="form-select" id="historyDateFilter">
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
            </select>
        </div>

        <button class="btn btn-secondary" onclick="applyHistoryFilters()">
            Apply Filters
        </button>
        <button class="btn btn-outline" onclick="resetHistoryFilters()">
            Reset
        </button>
    `;
}

function renderHistoryList(history) {
    const listContainer = document.getElementById('historyList');

    if (history.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="empty-title">No History Yet</div>
                <div class="empty-subtitle">
                    Your test history will appear here once you start taking mock tests or practice sessions.
                </div>
                <a href="#exams" class="btn btn-primary" data-view="exams">
                    Take Your First Test
                </a>
            </div>
        `;
        return;
    }

    // Sort history by date (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listContainer.innerHTML = sortedHistory.map(item => {
        const date = new Date(item.timestamp);
        const dateString = date.toLocaleDateString();
        const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const percentage = Math.round((item.score / item.total) * 100);
        const passed = percentage >= 75;

        return `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-title">${item.type === 'mock' ? 'Mock Test' : 'Practice Session'}</div>
                    <div class="history-item-date">${dateString} ${timeString}</div>
                    ${item.category ? `<div class="history-item-subtitle">${item.category}</div>` : ''}
                </div>
                <div class="history-item-meta">
                    <div class="history-item-score">${item.score}/${item.total}</div>
                    <span class="history-item-status ${passed ? 'passed' : 'failed'}">
                        ${passed ? 'PASSED' : 'FAILED'}
                    </span>
                </div>
                <div class="history-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewHistoryDetails('${item.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deleteHistoryItem('${item.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateHistorySummary(history) {
    const totalTestsEl = document.getElementById('historyTotalTests');
    const averageScoreEl = document.getElementById('historyAverageScore');

    if (history.length === 0) {
        totalTestsEl.textContent = '0';
        averageScoreEl.textContent = '0%';
        return;
    }

    const stats = resultsModule.getStatistics();
    totalTestsEl.textContent = stats.totalTests;
    averageScoreEl.textContent = `${stats.averageScore}%`;
}

function loadHistoryCharts(history) {
    const chartContainer = document.getElementById('scoreChart');

    // Sort history by date (oldest first for chart)
    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Prepare data for chart
    const labels = sortedHistory.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleDateString();
    });

    const scores = sortedHistory.map(item =>
        Math.round((item.score / item.total) * 100)
    );

    // Create a simple chart using CanvasJS or similar would go here
    // For simplicity, we'll just show a text representation
    chartContainer.innerHTML = `
        <div class="chart-placeholder">
            <h3>Score Progress</h3>
            <div class="chart-grid">
                ${scores.map((score, index) => `
                    <div class="chart-bar">
                        <div class="chart-bar-fill" style="height: ${score}%"></div>
                        <div class="chart-bar-label">${labels[index]}<br>${score}%</div>
                    </div>
                `).join('')}
            </div>
            <p class="chart-caption">Your scores over time (higher is better)</p>
        </div>
    `;
}

function applyHistoryFilters() {
    // This would implement actual filtering logic
    // For now, just show a placeholder
    alert('Filter functionality would be implemented here');
}

function resetHistoryFilters() {
    // Reset filter dropdowns
    document.getElementById('historyTypeFilter').value = 'all';
    document.getElementById('historyCategoryFilter').value = 'all';
    document.getElementById('historyDateFilter').value = 'all';

    // Re-render history with no filters
    loadHistoryData();
}

function viewHistoryDetails(id) {
    // This would show detailed view of a specific history item
    alert(`Viewing details for history item: ${id}`);
}

async function deleteHistoryItem(id) {
    if (await confirm('Are you sure you want to delete this history item?')) {
        // Get existing history
        const history = JSON.parse(localStorage.getItem('wt-history') || '[]');

        // Remove item with matching ID
        const updatedHistory = history.filter(item => item.id !== id);

        // Save back to localStorage
        localStorage.setItem('wt-history', JSON.stringify(updatedHistory));

        // Re-render history
        loadHistoryData();
    }
}

function showErrorMessage() {
    const container = document.querySelector('.history-view');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-title">Error Loading History</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading your history. Please try again later.
            </div>
        </div>
    `;
}
// Expose inline-onclick handlers to the global scope (module functions are
// not otherwise reachable from onclick="...").
window.applyHistoryFilters = applyHistoryFilters;
window.resetHistoryFilters = resetHistoryFilters;
window.viewHistoryDetails = viewHistoryDetails;
window.deleteHistoryItem = deleteHistoryItem;