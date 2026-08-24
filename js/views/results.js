// ============================================================
// RESULTS VIEW — score summary, topic breakdown, answer review
// Loaded via "#/results?result=<id>"
//
// Layout mirrors the reference design:
//   [ Score card          ] [ Topic Breakdown      ]
//   [ (ring + stats +     ] [ Correct vs Incorrect ]
//   [  action buttons)    ]
//   [ Answer Review  (All / Correct / Incorrect / Skipped filters) ]
// ============================================================

import { getResults, deleteResult } from '../storage.js';
import { loadQuestions } from '../data.js';
import { escapeHtml, formatTime } from '../utils.js';

let currentResult = null;
let currentFilter = 'all';

export function init(container, query = '') {
    const params = new URLSearchParams(query);
    const resultId = params.get('result');
    currentFilter = 'all';
    currentResult = null;

    container.innerHTML = `
        <div class="results-page">
            <div class="results-top" id="resultsTop">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading results...</div>
                </div>
            </div>

            <section class="answer-review" id="answerReview" style="display: none;">
                <div class="review-head">
                    <h2 class="section-title">Answer Review</h2>
                    <div class="review-filters" id="reviewFilters">
                        <button class="filter-pill active" data-filter="all" type="button">All</button>
                        <button class="filter-pill" data-filter="correct" type="button">Correct</button>
                        <button class="filter-pill" data-filter="incorrect" type="button">Incorrect</button>
                        <button class="filter-pill" data-filter="skipped" type="button">Skipped</button>
                    </div>
                </div>
                <div class="review-list" id="reviewList"></div>
            </section>
        </div>
    `;

    loadResult(resultId);

    return Promise.resolve();
}

/* ------------------------------------------------------------
   Data loading
   ------------------------------------------------------------ */
async function loadResult(resultId) {
    const results = getResults();
    currentResult = results.find(r => r.id === resultId) || results[results.length - 1];

    const topEl = document.getElementById('resultsTop');
    if (!currentResult) {
        topEl.innerHTML = `
            <div class="panel-card">
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-file-circle-question"></i></div>
                    <div class="empty-title">No Result Found</div>
                    <div class="empty-subtitle">We couldn't find that test result.</div>
                    <a href="#/history" class="btn btn-primary">View History</a>
                </div>
            </div>
        `;
        return;
    }

    // Older results may lack the category on each graded question —
    // backfill it from the question bank so topic breakdown works.
    const questions = currentResult.questions || [];
    if (questions.some(q => !q.category)) {
        try {
            const bank = await loadQuestions();
            const catById = new Map(bank.map(q => [q.id, q.category]));
            questions.forEach(q => { q.category = q.category || catById.get(q.id) || 'General'; });
        } catch (e) {
            questions.forEach(q => { q.category = q.category || 'General'; });
        }
    }

    renderSummary(topEl);
    renderReview();
    bindFilters();
}

/* ------------------------------------------------------------
   Summary: score card + side panels
   ------------------------------------------------------------ */
function renderSummary(topEl) {
    const r = currentResult;
    const passed = !!r.passed;
    const score = typeof r.score === 'number' ? r.score : 0;
    const incorrect = typeof r.incorrect === 'number'
        ? r.incorrect
        : Math.max(0, (r.total || 0) - (r.correct || 0) - (r.skipped || 0));
    const date = new Date(r.date || Date.now());
    const title = (r.examTitle || 'Practice Session').replace(/^Mock Test mock-/i, 'Mock Test ');

    topEl.innerHTML = `
        <article class="score-card ${passed ? 'passed' : 'failed'}">
            <div class="score-card-head">
                <h1 class="score-title">${escapeHtml(title)}</h1>
                <span class="score-badge ${passed ? 'pass' : 'fail'}">${passed ? 'PASS' : 'FAIL'}</span>
            </div>

            <div class="score-ring-wrap" role="img" aria-label="Score ${score} percent">
                <svg class="score-ring" viewBox="0 0 120 120" aria-hidden="true">
                    <circle class="score-ring-track" cx="60" cy="60" r="52" />
                    <circle class="score-ring-fill ${passed ? 'tone-pass' : 'tone-fail'}" cx="60" cy="60" r="52"
                            id="scoreRingFill" />
                </svg>
                <div class="score-ring-center">
                    <span class="score-ring-pct" id="scoreRingPct">0%</span>
                    <span class="score-ring-label">SCORE</span>
                </div>
            </div>

            <p class="score-message">${passed
                ? 'Great job \u2014 you passed! Keep up the momentum. \uD83C\uDF89'
                : 'Don\u2019t worry \u2014 study more and practice again. You will improve! \uD83D\uDCAA'}</p>

            <div class="score-stats">
                <div class="score-stat"><span class="score-stat-value">${r.correct ?? 0}</span><span class="score-stat-label">Correct</span></div>
                <div class="score-stat"><span class="score-stat-value">${incorrect}</span><span class="score-stat-label">Incorrect</span></div>
                <div class="score-stat"><span class="score-stat-value">${r.skipped ?? 0}</span><span class="score-stat-label">Skipped</span></div>
                <div class="score-stat"><span class="score-stat-value">${formatTime(r.timeTakenSec || 0)}</span><span class="score-stat-label">Time</span></div>
            </div>

            <p class="score-date">${date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>

            <div class="score-actions">
                <button class="btn btn-primary" onclick="retakeExam()" type="button">Retake Exam</button>
                <button class="btn btn-outline" onclick="practiseMistakes()" type="button">Practise My Mistakes</button>
                <button class="btn btn-outline" onclick="smartPractice()" type="button">Smart Practice</button>
                <button class="btn btn-outline" onclick="window.location.hash = '#/dashboard'" type="button">Dashboard</button>
                <button class="btn btn-delete" onclick="deleteThisResult()" type="button">Delete</button>
            </div>
        </article>

        <div class="results-side">
            <section class="panel-card">
                <h3 class="panel-title">Topic Breakdown</h3>
                <div id="topicBreakdown"></div>
            </section>
            <section class="panel-card">
                <h3 class="panel-title">Correct vs Incorrect</h3>
                <div id="correctVsIncorrect"></div>
            </section>
        </div>
    `;

    animateScoreRing(score, passed);
    renderTopicBreakdown(r.questions || []);
    renderCorrectVsIncorrect(r);
}

/** Animate the ring drawing to the final score. */
function animateScoreRing(score, passed) {
    const ring = document.getElementById('scoreRingFill');
    const pctEl = document.getElementById('scoreRingPct');
    if (!ring || !pctEl) return;

    const circumference = 2 * Math.PI * 52;
    ring.style.strokeDasharray = circumference.toFixed(2);
    ring.style.strokeDashoffset = circumference.toFixed(2);
    ring.style.transform = 'rotate(-90deg)';
    ring.style.transformOrigin = 'center';

    const target = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
    const duration = 900;
    const start = performance.now();

    function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        ring.style.strokeDashoffset = (circumference - (circumference - target) * eased).toFixed(2);
        pctEl.textContent = Math.round(score * eased) + '%';
        if (t < 1) requestAnimationFrame(tick);
        else pctEl.textContent = score + '%';
    }
    requestAnimationFrame(tick);
}

/* ------------------------------------------------------------
   Topic Breakdown — accuracy per category
   ------------------------------------------------------------ */
function renderTopicBreakdown(questions) {
    const el = document.getElementById('topicBreakdown');
    if (!el) return;

    const stats = {};
    questions.forEach(q => {
        const cat = q.category || 'General';
        stats[cat] = stats[cat] || { correct: 0, total: 0 };
        stats[cat].total += 1;
        if (q.isCorrect) stats[cat].correct += 1;
    });

    const rows = Object.entries(stats).map(([cat, s]) => {
        const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
        return { cat, pct, ...s };
    }).sort((a, b) => a.pct - b.pct); // weakest topics first

    if (!rows.length) {
        el.innerHTML = '<p class="panel-empty">No topic data for this attempt.</p>';
        return;
    }

    el.innerHTML = rows.map(row => `
        <div class="topic-row">
            <span class="topic-name">${escapeHtml(row.cat)}</span>
            <span class="topic-track">
                <span class="topic-fill ${topicBand(row.pct)}" style="width: ${row.pct}%"></span>
            </span>
            <span class="topic-pct ${topicBand(row.pct)}">${row.pct}%</span>
            <span class="topic-count">${row.correct}/${row.total}</span>
        </div>
    `).join('');
}

function topicBand(pct) {
    if (pct >= 70) return 'band-good';
    if (pct >= 40) return 'band-mid';
    return 'band-bad';
}

/* ------------------------------------------------------------
   Correct vs Incorrect — simple bar chart
   ------------------------------------------------------------ */
function renderCorrectVsIncorrect(r) {
    const el = document.getElementById('correctVsIncorrect');
    if (!el) return;

    const correct = r.correct ?? 0;
    const incorrect = typeof r.incorrect === 'number'
        ? r.incorrect
        : Math.max(0, (r.total || 0) - correct - (r.skipped || 0));
    const skipped = r.skipped ?? 0;
    const max = Math.max(correct, incorrect, skipped, 1);

    const bar = (value, cls, label) => `
        <div class="cvb-col">
            <div class="cvb-bar ${cls}" style="height: ${Math.max(4, Math.round((value / max) * 100))}%"></div>
            <span class="cvb-label">${label}</span>
        </div>`;

    el.innerHTML = `
        <div class="cvb-chart">
            ${bar(correct, 'cvb-correct', 'Correct')}
            ${bar(incorrect, 'cvb-incorrect', 'Incorrect')}
            ${bar(skipped, 'cvb-skipped', 'Skipped')}
        </div>
    `;
}

/* ------------------------------------------------------------
   Answer Review — filterable per-question breakdown
   ------------------------------------------------------------ */
function bindFilters() {
    const filtersEl = document.getElementById('reviewFilters');
    if (!filtersEl) return;

    filtersEl.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        currentFilter = pill.dataset.filter;
        filtersEl.querySelectorAll('.filter-pill').forEach(p => {
            p.classList.toggle('active', p === pill);
        });
        renderReview();
    });
}

function renderReview() {
    const reviewSection = document.getElementById('answerReview');
    const listEl = document.getElementById('reviewList');
    if (!reviewSection || !listEl || !currentResult) return;

    const questions = currentResult.questions || [];
    reviewSection.style.display = 'block';

    const filtered = questions.filter(q => {
        if (currentFilter === 'correct') return !!q.isCorrect;
        if (currentFilter === 'incorrect') return !!q.answered && !q.isCorrect;
        if (currentFilter === 'skipped') return !q.answered;
        return true;
    });

    if (!filtered.length) {
        listEl.innerHTML = `
            <div class="panel-card">
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-filter"></i></div>
                    <div class="empty-title">Nothing Here</div>
                    <div class="empty-subtitle">No questions match the "${escapeHtml(currentFilter)}" filter.</div>
                </div>
            </div>
        `;
        return;
    }

    // Number by original position in the attempt (Q1, Q2, ...)
    listEl.innerHTML = filtered.map(q => {
        const originalIndex = questions.indexOf(q);
        const status = !q.answered ? 'skipped' : (q.isCorrect ? 'correct' : 'incorrect');
        const statusLabel = status === 'skipped' ? 'Skipped' : (q.isCorrect ? 'Correct' : 'Incorrect');

        const options = (q.options || []).map((opt, i) => {
            const isCorrectOpt = (q.correctAnswer || []).includes(i);
            const isChosen = (q.userAnswers || []).includes(i);
            const cls = isCorrectOpt ? 'is-correct' : (isChosen ? 'is-wrong' : '');
            const mark = isCorrectOpt ? '<span class="review-mark mark-correct">✓</span>'
                : (isChosen ? '<span class="review-mark mark-wrong">✗</span>' : '');
            return `
                <div class="review-option ${cls}">
                    <span class="option-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
                    <span class="review-option-text">${escapeHtml(opt)}</span>
                    ${mark}
                </div>`;
        }).join('');

        return `
            <article class="review-card">
                <div class="review-card-top">
                    <span class="review-qnum">Q${originalIndex + 1}</span>
                    <span class="review-pill ${status}">${statusLabel}</span>
                </div>
                <h3 class="review-question">${escapeHtml(q.question || '')}</h3>
                <div class="review-options">${options}</div>
                ${q.explanation ? `
                    <div class="review-explanation">
                        <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
                    </div>` : ''}
            </article>`;
    }).join('');
}

/* ------------------------------------------------------------
   Action buttons
   ------------------------------------------------------------ */
function retakeExam() {
    if (!currentResult) return;
    const examId = currentResult.examId;
    if (examId) {
        window.location.hash = `#/exam-runner?mock=${examId}`;
    } else {
        window.location.hash = '#/exams';
    }
}

function practiseMistakes() {
    window.location.hash = '#/exam-runner?mode=wrong';
}

function smartPractice() {
    window.location.hash = '#/exam-runner?mode=weak';
}

async function deleteThisResult() {
    if (!currentResult) return;
    // window.confirm is the async dialog installed by main.js
    if (await window.confirm('Delete this result? This cannot be undone.')) {
        deleteResult(currentResult.id);
        window.location.hash = '#/history';
    }
}

// Expose inline-onclick handlers to the global scope (module functions are
// not otherwise reachable from onclick="...").
window.retakeExam = retakeExam;
window.practiseMistakes = practiseMistakes;
window.smartPractice = smartPractice;
window.deleteThisResult = deleteThisResult;
