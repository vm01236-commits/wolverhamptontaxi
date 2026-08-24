// ============================================================
// DASHBOARD VIEW - Progress overview and quick actions
// ============================================================

import { dataLayer } from '../data.js';
import { resultsModule } from '../results.js';
import { bookmarksModule } from '../bookmarks.js';

export function init(container) {
    // Load dashboard view content
    container.innerHTML = `
        <div class="dashboard-view">
            <!-- Hero Section -->
            <section class="hero">
                <div class="hero-pattern" aria-hidden="true"></div>
                <div class="hero-content">
                    <span class="hero-badge">Official Practice App</span>
                    <h1 class="hero-title">Prepare for your <span class="hero-highlight">Wolverhampton Taxi Knowledge Test</span></h1>
                    <p class="hero-subtitle">
                        Comprehensive practice materials including mock tests, topic-based practice, and progress tracking to help you succeed on your licensing exam.
                    </p>
                    <div class="hero-actions">
                        <a href="#exams" class="btn btn-primary" data-view="exams">Start Mock Test</a>
                        <a href="#practice" class="btn btn-secondary" data-view="practice">Topic Practice</a>
                    </div>
                </div>
            </section>

            <!-- Stats Strip -->
            <div class="stats-strip" id="statsStrip">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading statistics...</div>
                </div>
            </div>

            <!-- Progress Section -->
            <section class="progress-section">
                <div class="progress-card">
                    <h2 class="section-title">Your Progress</h2>
                    <div class="progress-ring-wrap">
                        <svg class="progress-ring" viewBox="0 0 120 120">
                            <circle class="ring-bg" cx="60" cy="60" r="52" />
                            <circle class="ring-fg" cx="60" cy="60" r="52" />
                        </svg>
                        <div class="ring-center">
                            <span class="ring-value" id="ringValue">0%</span>
                            <span class="ring-label">overall</span>
                        </div>
                    </div>
                    <ul class="progress-stats">
                        <li><span class="p-label">Answered</span><span class="p-value" id="answeredCount">0</span></li>
                        <li><span class="p-label">Correct</span><span class="p-value" id="correctCount">0</span></li>
                        <li><span class="p-label">Mock Tests</span><span class="p-value" id="mockTestsCount">0</span></li>
                        <li><span class="p-label">Bookmarks</span><span class="p-value" id="bookmarksCount">0</span></li>
                    </ul>
                </div>

                <div class="quick-card">
                    <h2 class="section-title">Quick Actions</h2>
                    <div id="quickActions"></div>
                </div>
            </section>

            <!-- Features -->
            <section class="features">
                <div class="feature-card">
                    <span class="feature-icon">📖</span>
                    <h3>Study</h3>
                    <p>5 chapters with search, progress tracking and bookmarks.</p>
                    <a href="#guide" class="feature-link" data-view="guide">View Guide</a>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🧪</span>
                    <h3>Practice</h3>
                    <p>17 timed tests with 3 question types and instant feedback.</p>
                    <a href="#exams" class="feature-link" data-view="exams">Try a Mock Test</a>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">📊</span>
                    <h3>Track</h3>
                    <p>Results, charts, history and answer review to improve.</p>
                    <a href="#history" class="feature-link" data-view="history">View History</a>
                </div>
            </section>

            <!-- Difficulty Levels -->
            <section class="levels">
                <h2 class="section-title center">Question Distribution</h2>
                <div class="levels-grid" id="levelsGrid">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Loading level distribution...</div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Load data and populate dashboard
    loadDashboardData();

    return Promise.resolve();
}

async function loadDashboardData() {
    try {
        // Load questions data
        const questions = await dataLayer.loadQuestions();

        // Load mock tests index
        const mocksIndex = await dataLayer.loadMockTestsIndex();

        // Load application guide
        const guide = await dataLayer.loadApplicationGuide();

        // Load FAQs
        const faqs = await dataLayer.loadFAQs();

        // Populate stats strip
        populateStatsStrip(questions, mocksIndex, guide, faqs);

        // Populate progress ring (would need user history data)
        populateProgressRing();

        // Populate levels grid
        populateLevelsGrid(questions);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage();
    }
}

function populateStatsStrip(questions, mocksIndex, guide, faqs) {
    const statsStrip = document.getElementById('statsStrip');

    statsStrip.innerHTML = `
        <div class="stat-card">
            <span class="stat-icon">⏱</span>
            <div class="stat-info">
                <span class="stat-value">40</span>
                <span class="stat-label">min per test</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">📚</span>
            <div class="stat-info">
                <span class="stat-value">7</span>
                <span class="stat-label">categories</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">🧪</span>
            <div class="stat-info">
                <span class="stat-value">${mocksIndex.mockTests.length}</span>
                <span class="stat-label">mock tests</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">✅</span>
            <div class="stat-info">
                <span class="stat-value">75%</span>
                <span class="stat-label">pass mark</span>
            </div>
        </div>
    `;
}

function populateProgressRing() {
    // Real progress: overall accuracy across every saved attempt
    const history = resultsModule.getHistory();
    const totals = history.reduce(
        (acc, h) => ({ answered: acc.answered + (h.total || 0), correct: acc.correct + (h.score || 0) }),
        { answered: 0, correct: 0 }
    );
    const progressPercent = totals.answered > 0
        ? Math.round((totals.correct / totals.answered) * 100)
        : 0;

    const ringValue = document.getElementById('ringValue');
    const ringFg = document.querySelector('.ring-fg');
    const answeredEl = document.getElementById('answeredCount');
    const correctEl = document.getElementById('correctCount');
    const mockTestsEl = document.getElementById('mockTestsCount');
    const bookmarksEl = document.getElementById('bookmarksCount');

    if (!ringValue || !ringFg) return;
    if (answeredEl) answeredEl.textContent = totals.answered;
    if (correctEl) correctEl.textContent = totals.correct;
    if (mockTestsEl) mockTestsEl.textContent = history.length; // Number of attempts
    if (bookmarksEl) bookmarksEl.textContent = bookmarksModule.getBookmarkCount(); // Number of bookmarks

    ringValue.textContent = `${progressPercent}%`;

    // Animate the arc drawing in
    const circumference = 2 * Math.PI * 52; // r = 52 -> ~326.73
    ringFg.style.strokeDasharray = circumference.toFixed(2);
    ringFg.style.strokeDashoffset = circumference.toFixed(2);
    const targetOffset =
        circumference - (Math.min(100, Math.max(0, progressPercent)) / 100) * circumference;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            ringFg.style.strokeDashoffset = targetOffset.toFixed(2);
        });
    });
}

function populateLevelsGrid(questions) {
    const levelsGrid = document.getElementById('levelsGrid');

    // Group questions by category
    const categoryCounts = {};
    questions.forEach(q => {
        const category = q.category.trim();
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Create level cards for each category
    levelsGrid.innerHTML = Object.entries(categoryCounts)
        .map(([category, count]) => `
            <div class="level-card">
                <div class="level-dot"></div>
                <div>
                    <div class="level-name">${category}</div>
                    <div class="level-count">${count} questions</div>
                </div>
            </div>
        `)
        .join('');
}

function showErrorMessage() {
    const container = document.querySelector('.dashboard-view');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-title">Error Loading Dashboard</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading the dashboard data. Please try again later or check your connection.
            </div>
            <button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>
        </div>
    `;
}