// ============================================================
// DASHBOARD VIEW - Progress overview and quick actions
// ============================================================

import { dataLayer } from '../data.js';
import { resultsModule } from '../results.js';
import { bookmarksModule } from '../bookmarks.js';

// ------------------------------------------------------------
// Hero decorative SVGs (inline so they theme via currentColor
// and inherit font-size / no extra HTTP requests). All three
// are decorative — the host elements set aria-hidden="true".
// ------------------------------------------------------------
const HERO_SKYLINE_SVG = `
<svg class="hero-skyline-svg" viewBox="0 0 600 220" preserveAspectRatio="xMidYEnd slice" aria-hidden="true">
    <g fill="currentColor" opacity="0.18">
        <rect x="40"  y="110" width="60"  height="110" rx="2"/>
        <rect x="110" y="80"  width="40"  height="140" rx="2"/>
        <rect x="160" y="130" width="50"  height="90"  rx="2"/>
        <polygon points="245,90 270,70 295,90 295,220 245,220"/>
        <rect x="310" y="100" width="45"  height="120" rx="2"/>
        <rect x="365" y="120" width="35"  height="100" rx="2"/>
        <polygon points="415,80 440,55 465,80 465,220 415,220"/>
        <rect x="480" y="105" width="50"  height="115" rx="2"/>
        <rect x="540" y="135" width="40"  height="85"  rx="2"/>
    </g>
    <g fill="currentColor" opacity="0.10">
        <rect x="0"   y="170" width="600" height="50"/>
    </g>
</svg>`;

const HERO_PIN_SVG = `
<svg class="hero-pin-svg" viewBox="0 0 64 84" aria-hidden="true">
    <defs>
        <filter id="heroPinShadow" x="-30%" y="-10%" width="160%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0b1d3f" flood-opacity="0.28"/>
        </filter>
    </defs>
    <g filter="url(#heroPinShadow)">
        <path d="M32 4 C16 4 6 16 6 30 C6 48 32 78 32 78 C32 78 58 48 58 30 C58 16 48 4 32 4 Z"
              fill="#ffffff" stroke="#cfe0ff" stroke-width="1.5"/>
        <circle cx="32" cy="29" r="9" fill="#1769e8"/>
        <circle cx="32" cy="29" r="3.5" fill="#ffffff"/>
    </g>
</svg>`;

const HERO_TAXI_SVG = `
<svg class="hero-taxi-svg" viewBox="0 0 320 180" aria-hidden="true">
    <defs>
        <linearGradient id="taxiBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#ffffff"/>
            <stop offset="55%"  stop-color="#f3f5fa"/>
            <stop offset="100%" stop-color="#dbe1ec"/>
        </linearGradient>
        <linearGradient id="taxiBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#2a3245"/>
            <stop offset="100%" stop-color="#0f1626"/>
        </linearGradient>
        <filter id="taxiShadow" x="-15%" y="-15%" width="130%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0b1d3f" flood-opacity="0.35"/>
        </filter>
    </defs>
    <g filter="url(#taxiShadow)">
        <!-- Mounting posts -->
        <rect x="60"  y="118" width="6" height="22" rx="2" fill="#1c2233"/>
        <rect x="254" y="118" width="6" height="22" rx="2" fill="#1c2233"/>
        <!-- Base / bottom plate -->
        <rect x="30"  y="138" width="260" height="22" rx="6" fill="url(#taxiBase)"/>
        <rect x="30"  y="138" width="260" height="6"  rx="3" fill="#0a0f1c" opacity="0.6"/>
        <!-- Main body -->
        <rect x="40"  y="40"  width="240" height="100" rx="22" fill="url(#taxiBody)" stroke="#c9d2e0" stroke-width="1.5"/>
        <!-- TAXI text -->
        <text x="160" y="108" text-anchor="middle"
              font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
              font-weight="900" font-size="62" letter-spacing="4"
              fill="#0f1e3d">TAXI</text>
        <!-- Top highlight -->
        <rect x="48"  y="48"  width="224" height="6" rx="3" fill="#ffffff" opacity="0.6"/>
    </g>
</svg>`;

export function init(container) {
    // Load dashboard view content
    container.innerHTML = `
        <div class="dashboard-view">
            <!-- Hero Section -->
            <section class="hero hero-premium" aria-labelledby="heroTitle">
                <div class="hero-bg" aria-hidden="true">
                    <div class="hero-skyline">${HERO_SKYLINE_SVG}</div>
                    <div class="hero-pin">${HERO_PIN_SVG}</div>
                    <div class="hero-taxi">${HERO_TAXI_SVG}</div>
                </div>
                <div class="hero-inner">
                    <div class="hero-content">
                        <div class="hero-disclaimer" role="note" aria-label="Disclaimer">
                            <span class="hero-disclaimer-icon" aria-hidden="true">
                                <i class="fas fa-info"></i>
                            </span>
                            <span class="hero-disclaimer-text">Practice only — see Wolverhampton City Council for official licensing.</span>
                        </div>
                        <p class="hero-eyebrow">Prepare for your</p>
                        <h1 class="hero-title" id="heroTitle">
                            <span class="hero-title-line-1">Wolverhampton</span>
                            <span class="hero-title-line-2">Taxi Knowledge Test</span>
                        </h1>
                        <p class="hero-subtitle">
                            Mock tests, topic practice and progress tracking to help you pass the Wolverhampton licensing exam.
                        </p>
                        <ul class="hero-features" aria-label="Key features">
                            <li class="hero-feature hero-feature--navy">
                                <span class="hero-feature-icon" aria-hidden="true">
                                    <i class="fas fa-clipboard-list"></i>
                                </span>
                                <span class="hero-feature-text">
                                    <span class="hero-feature-title">Mock Tests</span>
                                    <span class="hero-feature-sub">Real exam simulation</span>
                                </span>
                            </li>
                            <li class="hero-feature hero-feature--green">
                                <span class="hero-feature-icon" aria-hidden="true">
                                    <i class="fas fa-book-open"></i>
                                </span>
                                <span class="hero-feature-text">
                                    <span class="hero-feature-title">Topic Practice</span>
                                    <span class="hero-feature-sub">Focused learning</span>
                                </span>
                            </li>
                            <li class="hero-feature hero-feature--purple">
                                <span class="hero-feature-icon" aria-hidden="true">
                                    <i class="fas fa-chart-line"></i>
                                </span>
                                <span class="hero-feature-text">
                                    <span class="hero-feature-title">Track Progress</span>
                                    <span class="hero-feature-sub">Monitor improvement</span>
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div class="hero-actions">
                        <a class="hero-cta hero-cta--primary" href="#exams" data-view="exams">
                            <span class="hero-cta-icon" aria-hidden="true">
                                <i class="fas fa-arrow-right"></i>
                            </span>
                            <span>Start Mock Test</span>
                        </a>
                        <a class="hero-cta hero-cta--secondary" href="#practice" data-view="practice">
                            <span class="hero-cta-icon" aria-hidden="true">
                                <i class="fas fa-book-open"></i>
                            </span>
                            <span>Topic Practice</span>
                        </a>
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
                    <div class="progress-card-head">
                        <h2 class="section-title">Your Progress</h2>
                        <a href="#history" data-view="history" class="progress-view-details">View Details</a>
                    </div>
                    <div class="progress-ring-wrap">
                        <svg class="progress-ring" viewBox="0 0 120 120" aria-hidden="true">
                            <defs>
                                <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="var(--navy-2)" />
                                    <stop offset="100%" stop-color="var(--green)" />
                                </linearGradient>
                            </defs>
                            <circle class="ring-bg" cx="60" cy="60" r="52" />
                            <circle class="ring-fg" cx="60" cy="60" r="52" />
                        </svg>
                        <div class="ring-center">
                            <span class="ring-value" id="ringValue">0%</span>
                            <span class="ring-label">overall</span>
                        </div>
                    </div>
                    <ul class="progress-stats">
                        <li>
                            <span class="p-stat-icon p-stat-icon--answered" aria-hidden="true"><i class="fas fa-list-check"></i></span>
                            <span>
                                <span class="p-label">Answered</span>
                                <span class="p-value" id="answeredCount">0</span>
                            </span>
                        </li>
                        <li>
                            <span class="p-stat-icon p-stat-icon--correct" aria-hidden="true"><i class="fas fa-circle-check"></i></span>
                            <span>
                                <span class="p-label">Correct</span>
                                <span class="p-value" id="correctCount">0</span>
                            </span>
                        </li>
                        <li>
                            <span class="p-stat-icon p-stat-icon--mocks" aria-hidden="true"><i class="fas fa-file-pen"></i></span>
                            <span>
                                <span class="p-label">Mock Tests</span>
                                <span class="p-value" id="mockTestsCount">0</span>
                            </span>
                        </li>
                        <li>
                            <span class="p-stat-icon p-stat-icon--bookmarks" aria-hidden="true"><i class="fas fa-bookmark"></i></span>
                            <span>
                                <span class="p-label">Bookmarks</span>
                                <span class="p-value" id="bookmarksCount">0</span>
                            </span>
                        </li>
                    </ul>
                </div>

                <div class="quick-card">
                    <h2 class="section-title">Quick Actions</h2>
                    <div id="quickActions"></div>
                </div>
            </section>

            <!-- Question Distribution -->
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

    // Quick Actions are static — render synchronously so the row is ready
    // before async data finishes.
    populateQuickActions();

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
            <span class="stat-icon"><i class="fas fa-stopwatch"></i></span>
            <div class="stat-info">
                <span class="stat-value">40</span>
                <span class="stat-label">min per test</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon"><i class="fas fa-layer-group"></i></span>
            <div class="stat-info">
                <span class="stat-value">7</span>
                <span class="stat-label">categories</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon"><i class="fas fa-list-check"></i></span>
            <div class="stat-info">
                <span class="stat-value">${mocksIndex.mockTests.length}</span>
                <span class="stat-label">mock tests</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon"><i class="fas fa-bullseye"></i></span>
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

    // Stable order: use the order in which categories first appear in the data.
    // Tones cycle through the 4 brand tints (navy/green/amber/red) so the row
    // strip matches the rest of the dashboard while staying theme-portable.
    const toneOrder = ['navy', 'green', 'amber', 'red'];
    const entries = Object.entries(categoryCounts);

    levelsGrid.innerHTML = entries
        .map(([category, count], idx) => {
            const meta = categoryMeta(category);
            const tone = toneOrder[idx % toneOrder.length];
            const escaped = category.replace(/[<>&"']/g, ch => ({
                '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
            }[ch]));
            return `
                <a class="level-card" href="#practice" data-view="practice" data-category="${escaped}">
                    <span class="icon-chip icon-chip--md icon-chip--${tone} level-icon" aria-hidden="true">
                        <i class="fas ${meta.icon}"></i>
                    </span>
                    <div>
                        <div class="level-name">${escaped}</div>
                        <div class="level-count">${count} ${count === 1 ? 'question' : 'questions'}</div>
                    </div>
                </a>
            `;
        })
        .join('');
}

const CATEGORY_ICONS = [
    { match: 'driver',           icon: 'fa-solid fa-steering-wheel' },
    { match: 'plying',           icon: 'fa-solid fa-taxi' },
    { match: 'disab',            icon: 'fa-solid fa-wheelchair' },
    { match: 'law',              icon: 'fa-solid fa-scale-balanced' },
    { match: 'route',            icon: 'fa-solid fa-route' },
    { match: 'customer',         icon: 'fa-solid fa-user' },
    { match: 'vehicle',          icon: 'fa-solid fa-car' },
    { match: 'safe',             icon: 'fa-solid fa-shield-halved' },
];

function categoryMeta(name) {
    const lower = name.toLowerCase();
    const hit = CATEGORY_ICONS.find(entry => lower.includes(entry.match));
    return { icon: hit ? hit.icon : 'fa-bookmark' };
}

function populateQuickActions() {
    const target = document.getElementById('quickActions');
    if (!target) return;

    const actions = [
        { title: 'Start Mock Test', sub: 'Take a full mock test',           icon: 'fa-cloud-bolt',   tone: 'navy',  view: 'exams' },
        { title: 'Topic Practice',  sub: 'Practice by category',            icon: 'fa-layer-group',  tone: 'green', view: 'practice' },
        { title: 'Study Guide',     sub: 'Read study materials',            icon: 'fa-book-open',    tone: 'amber', view: 'guide' },
        { title: 'View History',    sub: 'See your performance',            icon: 'fa-chart-line',   tone: 'red',   view: 'history' },
    ];

    target.innerHTML = `
        <div class="qa-list">
            ${actions.map(a => `
                <a class="qa-item" href="#${a.view}" data-view="${a.view}">
                    <span class="icon-chip icon-chip--sm icon-chip--${a.tone}" aria-hidden="true">
                        <i class="fas ${a.icon}"></i>
                    </span>
                    <span class="qa-item-body">
                        <span class="qa-item-title">${a.title}</span>
                        <span class="qa-item-sub">${a.sub}</span>
                    </span>
                    <span class="qa-chevron" aria-hidden="true">&rsaquo;</span>
                </a>
            `).join('')}
        </div>
    `;
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