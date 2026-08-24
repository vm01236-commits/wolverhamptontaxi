// ============================================================
// EXAMS VIEW - Mock tests grouped by difficulty tier
// ============================================================

import { getResults, getInProgress } from '../storage.js';
import { escapeHtml } from '../utils.js';

// Difficulty tiers in display order. Mocks without a difficulty
// field fall back to the first tier.
const TIERS = [
    { key: 'foundation', label: 'Foundation' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
];

export function init(container) {
    // Load exams view content
    container.innerHTML = `
        <div class="exam-view">
            <!-- Exam Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Mock Tests</h1>
                    <p class="text-muted" id="mocksSubtitle">
                        Practice with full-length mock tests that simulate the actual Wolverhampton Taxi Knowledge Test.
                    </p>
                </div>
            </header>

            <!-- Mock Tests Grid -->
            <section class="mocks-grid">
                <div class="loading" id="mocksLoading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading mock tests...</div>
                </div>
                <div class="mocks-container" id="mocksContainer"></div>
            </section>
        </div>
    `;

    // Load mock tests data
    loadMockTests();

    return Promise.resolve();
}

async function loadMockTests() {
    try {
        const mocksIndex = await window.dataLayer.loadMockTestsIndex();
        renderMockTestsGrid(mocksIndex);
    } catch (error) {
        console.error('Error loading mock tests:', error);
        showErrorMessage();
    }
}

function renderMockTestsGrid(mocksIndex) {
    const loadingEl = document.getElementById('mocksLoading');
    const container = document.getElementById('mocksContainer');

    const mocks = mocksIndex.mockTests || [];
    if (mocks.length === 0) {
        loadingEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="empty-title">No Mock Tests Available</div>
                <div class="empty-subtitle">
                    Mock tests could not be loaded. Please try again later.
                </div>
            </div>
        `;
        return;
    }

    loadingEl.style.display = 'none';

    // Subtitle line: "5 timed tests • 40 minutes each • 75% to pass"
    const first = mocks[0];
    const subtitle = document.getElementById('mocksSubtitle');
    if (subtitle) {
        subtitle.textContent = `${mocks.length} timed test${mocks.length === 1 ? '' : 's'}`
            + ` • ${first.timeLimitMinutes ?? 40} minutes each`
            + ` • ${first.passMarkPercent ?? 75}% to pass`;
    }

    // Per-mock progress from localStorage: best score + active session
    const bestScores = {};
    for (const r of getResults()) {
        if (!r.examId) continue;
        const pct = typeof r.score === 'number' ? r.score : 0;
        bestScores[r.examId] = Math.max(bestScores[r.examId] ?? -1, pct);
    }
    const inProgress = getInProgress();

    // Group mocks into tiers, keeping the defined display order
    const groups = TIERS.map(tier => ({
        ...tier,
        mocks: mocks.filter(m => (m.difficulty || TIERS[0].key) === tier.key),
    })).filter(g => g.mocks.length > 0);

    // Global test numbering across sections (TEST 1, TEST 2, ...)
    let counter = 0;

    container.innerHTML = groups.map(group => `
        <section class="mock-section">
            <div class="mock-section-head">
                <span class="mock-section-dot tier-${group.key}" aria-hidden="true"></span>
                <h2 class="mock-section-title">${group.label}</h2>
                <span class="mock-section-count">${group.mocks.length} test${group.mocks.length === 1 ? '' : 's'}</span>
            </div>
            <div class="mock-grid">
                ${group.mocks.map(mock => {
                    counter += 1;
                    const best = bestScores[mock.id];
                    const resumable = !!(inProgress && inProgress.mockId === mock.id);
                    return `
                    <article class="mock-card" data-mock-id="${escapeHtml(mock.id)}">
                        <div class="mock-card-top">
                            <span class="mock-label">Test ${counter}</span>
                            <span class="mock-tier tier-${group.key}">${group.label}</span>
                        </div>
                        <h3 class="mock-title">${escapeHtml(mock.title)}</h3>
                        <p class="mock-meta-line">${mock.totalQuestions} questions &bull; ${mock.timeLimitMinutes} min</p>
                        ${best !== undefined ? `<p class="mock-best">Best: ${best}%</p>` : ''}
                        <div class="mock-card-footer">
                            <span class="mock-status ${resumable ? 'in-progress' : ''}">${resumable ? 'In Progress' : 'Not Started'}</span>
                            ${resumable
                                ? `<button class="btn btn-primary btn-start" onclick="resumeMockTest()">Resume</button>`
                                : `<button class="btn btn-primary btn-start" onclick="startMockTest('${escapeHtml(mock.id)}')">Start</button>`}
                        </div>
                    </article>`;
                }).join('')}
            </div>
        </section>
    `).join('');
}

function startMockTest(mockId) {
    // The router picks this up and hands it to the exam runner
    window.location.hash = `#/exam-runner?mock=${mockId}`;
}

function resumeMockTest() {
    // Resume the saved in-progress session (examRunner supports the
    // "resume" parameter)
    window.location.hash = '#/exam-runner?resume=1';
}

function showErrorMessage() {
    const loadingEl = document.getElementById('mocksLoading');
    loadingEl.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-title">Error Loading Mock Tests</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading the mock tests. Please try again later.
            </div>
        </div>
    `;
}

// Expose inline-onclick handlers to the global scope. ES module top-level
// functions are module-scoped, so without this the onclick="..." attributes
// in rendered HTML would throw ReferenceError.
window.startMockTest = startMockTest;
window.resumeMockTest = resumeMockTest;