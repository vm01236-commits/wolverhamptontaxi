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
                <div class="hero-pattern"></div>
                <div class="hero-content">
                    <div class="hero-badge">Official Practice App</div>
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
                    <h3 class="section-title center">Your Progress</h3>
                    <div class="progress-ring-wrap">
                        <svg class="progress-ring" viewBox="0 0 36 36">
                            <circle class="ring-bg" cx="18" cy="18" r="15.5" fill="none" stroke-width="2"/>
                            <circle class="ring-fg" cx="18" cy="18" r="15.5" fill="none" stroke-width="2"/>
                            <g class="ring-center">
                                <text class="ring-value" x="18" y="20.5" text-anchor="middle" fill="var(--navy)">0%</text>
                                <text class="ring-label" x="18" y="26.5" text-anchor="middle">Questions</text>
                            </g>
                        </svg>
                    </div>
                    <ul class="progress-stats">
                        <li>
                            <span class="p-label">Answered</span>
                            <span class="p-value" id="answeredCount">0</span>
                        </li>
                        <li>
                            <span class="p-label">Correct</span>
                            <span class="p-value" id="correctCount">0</span>
                        </li>
                    </ul>
                </div>

                <div class="quick-card">
                    <h3 class="section-title center">Quick Actions</h3>
                    <div class="quick-item">
                        <div class="quick-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <div class="quick-text">
                            <div class="quick-title">Application Guide</div>
                            <div class="quick-sub">Read the official guide</div>
                        </div>
                    </div>
                    <div class="quick-item">
                        <div class="quick-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="quick-text">
                            <div class="quick-title">Bookmarks</div>
                            <div class="quick-sub">Review saved questions</div>
                        </div>
                    </div>
                    <div class="quick-item">
                        <div class="quick-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div class="quick-text">
                            <div class="quick-title">Weak Areas</div>
                            <div class="quick-sub">Focus your study</div>
                        </div>
                    </div>
                    <div class="quick-item">
                        <div class="quick-icon">
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="quick-text">
                            <div class="quick-title">Settings</div>
                            <div class="quick-sub">Customize your experience</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features -->
            <section class="features">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <h3>Official Content</h3>
                    <p>All questions based on the official Wolverhampton Taxi Driver Handbook</p>
                    <a href="#guide" class="feature-link" data-view="guide">View Guide</a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-balance-scale"></i>
                    </div>
                    <h3>Realistic Practice</h3>
                    <p>Mock tests simulate the actual exam format and timing</p>
                    <a href="#exams" class="feature-link" data-view="exams">Try a Mock Test</a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3>Track Progress</h3>
                    <p>Monitor your improvement with detailed statistics</p>
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
            <div class="stat-icon">
                <i class="fas fa-question-circle"></i>
            </div>
            <div class="stat-info">
                <div class="stat-value">${questions.length}</div>
                <div class="stat-label">Total Questions</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-list-ol"></i>
            </div>
            <div class="stat-info">
                <div class="stat-value">${mocksIndex.mockTests.length}</div>
                <div class="stat-label">Mock Tests</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-book"></i>
            </div>
            <div class="stat-info">
                <div class="stat-value">1</div>
                <div class="stat-label">Application Guide</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-comments"></i>
            </div>
            <div class="stat-info">
                <div class="stat-value">${faqs.length}</div>
                <div class="stat-label">FAQs</div>
            </div>
        </div>
    `;
}

function populateProgressRing() {
    // This would typically come from user's history/localStorage
    // For now, placeholder data
    const ringValue = document.querySelector('.ring-value');
    const ringFg = document.querySelector('.ring-fg');

    // Example: 42% progress
    const progressPercent = 42;
    ringValue.textContent = `${progressPercent}%`;

    // Calculate stroke dashed offset for progress ring
    // Circumference = 2 * π * r = 2 * 3.14159 * 15.5 ≈ 97.3
    const circumference = 97.3;
    const offset = circumference - (progressPercent / 100) * circumference;
    ringFg.style.strokeDashoffset = offset;
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