/* ============================================================
   Exam Runner — timer, navigator, 3 question types

   FIX #1  Answers are graded from what the learner SELECTED.
           "Check Answer" is now optional instant feedback, not a
           precondition for the answer counting. Previously a
           learner could answer every question, hit Finish and
           score 0% because nothing had been "checked".
   FIX #3  Focus mode: one question at a time, question navigator
           collapses into a drawer on small screens, sticky
           touch-friendly action bar.
   FIX #4  Live answered-progress bar with counter + ARIA.
   ============================================================ */
import { loadQuestions, loadMockTest } from './data.js';
import {
    getInProgress, saveInProgress, clearInProgress,
    saveBookmark, removeBookmark, isBookmarked,
    addResult, recordAttempt, getResults,
    getBookmarks as getBookmarkedIds,
} from './storage.js';
import { qs, qsa, escapeHtml, formatTime } from './utils.js';

const DURATION_MIN = 40; // Wolverhampton Taxi Knowledge Test duration

let state = null;        // current exam session
let timerInterval = null;
let keyHandler = null;

/* ------------------------------------------------------------
   Entry point
   ------------------------------------------------------------ */
export async function renderExamRunner(params) {
    const container = qs('#view-exam-runner');
    if (!container) return;

    teardownExamRunner();

    // Resume an interrupted session
    if (params.get('resume')) {
        const existing = getInProgress();
        if (existing && Array.isArray(existing.questions) && existing.questions.length) {
            state = migrateSession(existing);
            renderSession(container);
            return;
        }
        container.innerHTML = emptyState('That session is no longer available.', 'exams', 'Browse Tests');
        return;
    }

    // Practice mode (FIX #6) — a synthetic session built from past mistakes
    const mode = params.get('mode');
    if (mode && mode !== 'exam') {
        let session;
        try {
            session = await buildPracticeSession(mode);
        } catch (e) {
            console.error('Practice session failed:', e);
            container.innerHTML = emptyState('Could not build that practice session.', 'practice', 'Back to Practice');
            return;
        }
        if (!session || !session.questions.length) {
            container.innerHTML = emptyState(
                `No questions available for "${escapeHtml(practiceModeLabel(mode))}" yet.`,
                'practice', 'Back to Practice',
            );
            return;
        }
        state = session;
        saveInProgress(state);
        renderSession(container);
        return;
    }

    // Load mock test by ID from params
    const mockId = params.get('mock');
    if (!mockId) {
        container.innerHTML = emptyState('Select a mock test to start.', 'exams', 'Browse Tests');
        return;
    }

    let mockTest;
    try {
        mockTest = await resolveMockQuestions(await loadMockTest(mockId));
    } catch (e) {
        console.error('Mock test load failed:', e);
        container.innerHTML = emptyState('Could not load that mock test. Check your connection and try again.', 'exams', 'Browse Tests');
        return;
    }

    if (!mockTest || !Array.isArray(mockTest.questions) || !mockTest.questions.length) {
        container.innerHTML = emptyState('That mock test contains no questions.', 'exams', 'Browse Tests');
        return;
    }

    const durationMinutes = mockTest.durationMinutes ?? mockTest.timeLimitMinutes ?? DURATION_MIN;
    const passMark = mockTest.passMark ?? mockTest.passMarkPercent ?? 75;

    state = {
        mockId,
        mode: 'exam',
        durationMinutes,
        passMark,
        questions: mockTest.questions.map(newQuestionState),
        currentIndex: 0,
        startsAt: Date.now(),
        endsAt: Date.now() + durationMinutes * 60 * 1000,
    };

    saveInProgress(state);
    renderSession(container);
}

/** Stop timers/listeners when the router leaves the runner view. */
export function teardownExamRunner() {
    // Bank time for the question on screen, then stop the clock so time
    // away from the runner is not charged to that question.
    if (state && timerInterval) {
        commitQuestionTime();
        state.enteredAt = null;
        persist();
    }

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (keyHandler) {
        document.removeEventListener('keydown', keyHandler);
        keyHandler = null;
    }
    document.body.classList.remove('focus-mode');
}

/**
 * Mock files store a list of questionIds rather than full question
 * objects, and some older files use a "wtx-" id prefix while the
 * question bank uses "wtkt-". Resolve every id to a real question:
 *   1. exact id match,
 *   2. match on the numeric suffix (wtx-q016 -> wtkt-q016),
 *   3. top up any leftovers with unused questions so the test can
 *      still run when the bank has fewer questions than referenced.
 */
async function resolveMockQuestions(mockTest) {
    if (!mockTest || !Array.isArray(mockTest.questionIds)) return mockTest;
    if (mockTest.questions && mockTest.questions.length) return mockTest;

    const all = await loadQuestions();
    const byId = new Map(all.map((q) => [q.id, q]));
    const byNumber = new Map(
        all.map((q) => [(String(q.id).match(/(\d+)$/) || [])[1], q]),
    );

    const resolved = [];
    const used = new Set();
    for (const rawId of mockTest.questionIds) {
        let q = byId.get(rawId);
        if (!q) {
            const num = (String(rawId).match(/(\d+)$/) || [])[1];
            q = num ? byNumber.get(num) : undefined;
        }
        if (q && !used.has(q.id)) {
            resolved.push(q);
            used.add(q.id);
        }
    }

    // Top up from questions not already picked (shuffled for variety).
    if (resolved.length < mockTest.questionIds.length) {
        const remaining = all.filter((q) => !used.has(q.id));
        remaining.sort(() => Math.random() - 0.5);
        resolved.push(...remaining.slice(0, mockTest.questionIds.length - resolved.length));
    }

    return { ...mockTest, questions: resolved };
}

function newQuestionState(q) {
    return {
        ...q,
        // The data files call it correctIndexes; the runner works with correctAnswer.
        correctAnswer: q.correctAnswer ?? q.correctIndexes ?? [],
        userAnswers: [],
        checked: false,
        isCorrect: null,
        timeSpentMs: 0,
    };
}

/** Backfill fields on sessions saved by an older build. */
function migrateSession(s) {
    s.mode = s.mode || 'exam';
    s.passMark = s.passMark ?? 75;
    s.questions = (s.questions || []).map((q) => ({
        ...q,
        correctAnswer: q.correctAnswer ?? q.correctIndexes ?? [],
        userAnswers: Array.isArray(q.userAnswers) ? q.userAnswers : [],
        checked: !!q.checked,
        isCorrect: q.isCorrect ?? null,
        timeSpentMs: Number(q.timeSpentMs) || 0,
    }));
    s.currentIndex = Math.min(Math.max(0, s.currentIndex || 0), s.questions.length - 1);
    return s;
}

function emptyState(message, nav, cta) {
    return `
        <div class="empty-state">
            <p>${message}</p>
            <a href="#/${nav}" class="btn btn-primary" style="margin-top:16px">${escapeHtml(cta)}</a>
        </div>`;
}

/* ------------------------------------------------------------
   Answer model  (FIX #1)
   ------------------------------------------------------------ */

/** How many options this question expects. Driven by the data, so
    questions with 3 correct answers work (they previously could
    never be answered because the runner hard-coded a cap of 2). */
function requiredSelections(q) {
    if (q.type === 'multiple') return Math.max(1, (q.correctAnswer || []).length);
    return 1;
}

/** A practice session mixes questions from several exams, so each
    question remembers where it came from. Falls back to the session. */
function questionExamId(q) {
    return q.mockId ?? state?.mockId;
}

/** Answered = the learner selected something. Not "pressed Check". */
function isAnswered(q) {
    return (q.userAnswers || []).length > 0;
}

/** Fully answered = enough options picked to be gradeable. */
function isComplete(q) {
    return (q.userAnswers || []).length === requiredSelections(q);
}

function answeredCount() {
    return state.questions.filter(isAnswered).length;
}

/** Compare a selection against the key. Order-independent. */
function gradeQuestion(q) {
    const user = [...(q.userAnswers || [])].sort((a, b) => a - b);
    const key = [...(q.correctAnswer || [])].sort((a, b) => a - b);
    return user.length === key.length && user.every((v, i) => v === key[i]);
}

/* ------------------------------------------------------------
   Shell
   ------------------------------------------------------------ */
function renderSession(container) {
    const total = state.questions.length;
    const isPractice = state.mode && state.mode !== 'exam';

    container.innerHTML = `
        <div class="runner-topbar">
            <button class="runner-drawer-btn" id="drawerBtn" aria-label="Show question list"
                    aria-expanded="false" aria-controls="runnerSidebar">
                <span aria-hidden="true">☰</span>
                <span class="drawer-btn-text">Questions</span>
            </button>
            <div class="runner-exam-info">
                <span class="runner-exam-title">${escapeHtml(state.mockId ? `Mock Test ${String(state.mockId).replace(/^mock-/i, '')}` : 'Practice Session')}</span>
                <span class="runner-question-count">
                    ${isPractice ? `${escapeHtml(practiceModeLabel(state.mode))} &bull; ` : ''}${total} question${total === 1 ? '' : 's'}
                </span>
            </div>
            <div class="timer ${state.endsAt ? '' : 'timer-untimed'}" id="runnerTimer" role="timer" aria-live="off"
                 aria-label="${state.endsAt ? 'Time remaining' : 'Untimed session'}">${state.endsAt ? formatTime(remainingSeconds()) : 'Untimed'}</div>
        </div>

        <!-- FIX #4: answered-progress, distinct from the time pace bar -->
        <div class="answer-progress" id="answerProgress">
            <div class="answer-progress-head">
                <span class="answer-progress-label" id="progressCounter">0 of ${total} answered</span>
                <span class="answer-progress-pct" id="progressPct">0%</span>
            </div>
            <div class="answer-progress-track" role="progressbar" id="progressBar"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
                 aria-label="Test completion">
                <div class="answer-progress-fill" id="progressFill"></div>
            </div>
        </div>

        <div class="runner-pace-bar" title="Time elapsed" aria-hidden="true">
            <div class="runner-pace-fill" id="paceFill"></div>
        </div>

        <div class="runner-body">
            <div class="runner-overlay" id="runnerOverlay" hidden></div>
            <aside class="runner-sidebar" id="runnerSidebar" aria-label="Question navigator">
                <div class="runner-sidebar-head">
                    <h4 class="runner-nav-title">Questions</h4>
                    <button class="drawer-close" id="drawerClose" aria-label="Close question list">✕</button>
                </div>
                <div class="runner-nav-grid" id="runnerNavGrid"></div>
                <div class="runner-legend">
                    <span class="legend-item"><i class="legend-dot current"></i> Current</span>
                    <span class="legend-item"><i class="legend-dot answered"></i> Answered</span>
                    <span class="legend-item"><i class="legend-dot correct"></i> Correct</span>
                    <span class="legend-item"><i class="legend-dot wrong"></i> Incorrect</span>
                </div>
                <button class="btn btn-primary btn-block" id="finishBtnSidebar" type="button">Finish Exam</button>
            </aside>

            <div class="runner-main">
                <div class="question-card" id="questionCard" tabindex="-1"></div>
                <!-- Controls and the per-question indicator travel together
                     so the indicator stays under the buttons on mobile,
                     where this whole footer is sticky. -->
                <div class="runner-footer">
                    <div class="runner-controls">
                        <button class="btn btn-outline" id="prevBtn" type="button">&larr; Previous</button>
                        <button class="btn btn-outline btn-finish-inline" id="finishBtn" type="button">Finish</button>
                        <button class="btn btn-primary" id="nextBtn" type="button">Next &rarr;</button>
                    </div>

                    <div class="qtimer" id="qTimer">
                        <div class="qtimer-head">
                            <span class="qtimer-label"><span aria-hidden="true">⏱</span> Time on this question</span>
                            <span class="qtimer-value" id="qTimerValue">00:00</span>
                        </div>
                        <div class="qtimer-track" id="qTimerTrack" role="progressbar"
                             aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
                             aria-label="Time spent on the current question">
                            <div class="qtimer-fill tone-ok" id="qTimerFill"></div>
                        </div>
                        <span class="qtimer-hint tone-ok" id="qTimerHint"></span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.classList.add('focus-mode');

    renderCurrentQuestion();
    renderNavigator();
    updateProgress();

    qs('#prevBtn').addEventListener('click', () => navigate(-1));
    qs('#nextBtn').addEventListener('click', () => navigate(1));
    qs('#finishBtn').addEventListener('click', confirmFinish);
    qs('#finishBtnSidebar').addEventListener('click', confirmFinish);

    bindDrawer();
    bindKeyboard();
    startTimer();
}

/* ------------------------------------------------------------
   Drawer (FIX #3)
   ------------------------------------------------------------ */
function bindDrawer() {
    const btn = qs('#drawerBtn');
    const sidebar = qs('#runnerSidebar');
    const overlay = qs('#runnerOverlay');
    const close = qs('#drawerClose');
    if (!btn || !sidebar || !overlay) return;

    btn.addEventListener('click', () => setDrawer(!sidebar.classList.contains('open')));
    overlay.addEventListener('click', () => setDrawer(false));
    close?.addEventListener('click', () => setDrawer(false));
}

function setDrawer(open) {
    const sidebar = qs('#runnerSidebar');
    const overlay = qs('#runnerOverlay');
    const btn = qs('#drawerBtn');
    if (!sidebar || !overlay) return;

    sidebar.classList.toggle('open', open);
    overlay.hidden = !open;
    btn?.setAttribute('aria-expanded', String(open));
    // Stop the page behind the drawer from scrolling on touch devices.
    document.body.classList.toggle('drawer-open', open);

    if (open) qs('.nav-cell.current')?.focus();
}

/* ------------------------------------------------------------
   Keyboard navigation (accessibility)
   ------------------------------------------------------------ */
function bindKeyboard() {
    keyHandler = (e) => {
        if (!state) return;
        // Never hijack typing or modified shortcuts.
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (e.key === 'ArrowRight') { navigate(1); }
        else if (e.key === 'ArrowLeft') { navigate(-1); }
        else if (e.key === 'Escape') { setDrawer(false); }
    };
    document.addEventListener('keydown', keyHandler);
}

/* ------------------------------------------------------------
   Timers

   Two independent clocks:
     - the whole-test countdown (exams only), and
     - the per-question timer, which runs in every mode including
       untimed practice. The interval therefore always starts.
   ------------------------------------------------------------ */
function remainingSeconds() {
    if (!state || !state.endsAt) return 0;
    return Math.max(0, Math.floor((state.endsAt - Date.now()) / 1000));
}

/** Suggested pace for one question, used as the indicator's target. */
function perQuestionTargetSec() {
    const count = state.questions.length || 1;
    if (state.durationMinutes) {
        return Math.max(20, Math.round((state.durationMinutes * 60) / count));
    }
    return 90; // untimed practice — a sensible study pace
}

/** Milliseconds banked on the current question, including this visit. */
function currentQuestionMs() {
    const q = state.questions[state.currentIndex];
    const banked = q?.timeSpentMs || 0;
    return banked + (state.enteredAt ? Date.now() - state.enteredAt : 0);
}

/**
 * Bank the time spent on the question being left. Called before every
 * index change, on finish, and when the router leaves the runner, so
 * time is never double-counted or lost.
 */
function commitQuestionTime() {
    if (!state || !state.enteredAt) return;
    const q = state.questions[state.currentIndex];
    if (q) q.timeSpentMs = (q.timeSpentMs || 0) + (Date.now() - state.enteredAt);
    state.enteredAt = Date.now();
}

function startTimer() {
    state.enteredAt = Date.now();
    tickTimer();
    timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
    if (!state) return;
    updateCountdown();
    // updateCountdown() can auto-submit when time runs out, which ends
    // the session and clears `state` — so re-check before continuing.
    if (!state) return;
    updateQuestionTimer();
}

function updateCountdown() {
    // Untimed practice keeps its static "Untimed" label.
    if (!state.endsAt) return;

    const secs = remainingSeconds();
    const timerEl = qs('#runnerTimer');

    if (timerEl) {
        timerEl.textContent = formatTime(secs);
        timerEl.classList.toggle('timer-danger', secs <= 300);
        timerEl.classList.toggle('timer-warn', secs > 300 && secs <= 600);
    }

    // Keep the elapsed-time pace bar in sync.
    const paceFill = qs('#paceFill');
    if (paceFill) {
        if (state.endsAt && state.startsAt) {
            const total = state.endsAt - state.startsAt;
            const pct = total > 0 ? Math.min(100, ((Date.now() - state.startsAt) / total) * 100) : 0;
            paceFill.style.width = pct + '%';
        }
    }

    if (secs <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        finishExam(true);
    }
}

/** The per-question process indicator beneath the navigation buttons. */
function updateQuestionTimer() {
    const valueEl = qs('#qTimerValue');
    if (!state || !valueEl) return;

    const elapsedSec = Math.floor(currentQuestionMs() / 1000);
    const target = perQuestionTargetSec();
    const pct = Math.min(100, (elapsedSec / target) * 100);
    const over = elapsedSec - target;

    valueEl.textContent = formatTime(elapsedSec);

    // ok -> warn at 75% of budget -> over once the budget is spent
    const tone = over > 0 ? 'over' : pct >= 75 ? 'warn' : 'ok';

    const fill = qs('#qTimerFill');
    if (fill) {
        fill.style.width = pct + '%';
        fill.className = `qtimer-fill tone-${tone}`;
    }

    const track = qs('#qTimerTrack');
    if (track) {
        track.setAttribute('aria-valuenow', String(Math.round(pct)));
        track.setAttribute('aria-valuetext',
            `${formatTime(elapsedSec)} spent on this question, target ${formatTime(target)}`);
    }

    const hint = qs('#qTimerHint');
    if (hint) {
        hint.textContent = over > 0
            ? `${formatTime(over)} over the ${formatTime(target)} target`
            : `Target ${formatTime(target)} per question`;
        hint.className = `qtimer-hint tone-${tone}`;
    }

    const wrap = qs('#qTimer');
    if (wrap) wrap.classList.toggle('is-over', over > 0);
}

/* ------------------------------------------------------------
   Question rendering
   ------------------------------------------------------------ */
function renderCurrentQuestion() {
    const card = qs('#questionCard');
    if (!card || !state) return;

    const q = state.questions[state.currentIndex];
    const bookmarked = isBookmarked(questionExamId(q), q.id);
    const required = requiredSelections(q);
    const locked = q.checked;

    let optionsHtml;
    if (q.type === 'boolean') {
        optionsHtml = `
            <div class="boolean-options" role="group" aria-label="Answer options">
                ${['True', 'False'].map((label, i) => `
                    <button class="bool-btn ${isSelected(q, i) ? 'selected' : ''} ${locked ? optionState(q, i) : ''}"
                            type="button" data-opt="${i}" ${locked ? 'disabled' : ''}
                            aria-pressed="${isSelected(q, i)}">${label}</button>`).join('')}
            </div>`;
    } else {
        const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
        optionsHtml = `
            <div class="option-list" role="group" aria-label="Answer options">
                ${(q.options || []).map((opt, i) => `
                    <label class="option-item ${optionState(q, i)} ${isSelected(q, i) ? 'is-selected' : ''}">
                        <input type="${inputType}" name="qopt-${state.currentIndex}" data-opt="${i}"
                               ${isSelected(q, i) ? 'checked' : ''} ${locked ? 'disabled' : ''} />
                        <span class="option-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
                        <span class="option-text">${escapeHtml(opt)}</span>
                        ${locked ? optionResultIcon(q, i) : ''}
                    </label>`).join('')}
            </div>`;
    }

    card.innerHTML = `
        <div class="question-top">
            <div class="question-top-left">
                <span class="question-position">Question ${state.currentIndex + 1} of ${state.questions.length}</span>
                <span class="question-type-badge">${typeLabel(q.type)}</span>
            </div>
            <button class="bookmark-btn ${bookmarked ? 'active' : ''}" id="bookmarkToggle" type="button"
                    aria-pressed="${bookmarked}">${bookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
        </div>

        <p class="question-text">${escapeHtml(q.question)}</p>

        ${required > 1 ? `<p class="question-hint">Select ${required} answers.</p>` : ''}

        ${optionsHtml}

        ${locked ? `
            <div class="explanation-card ${q.isCorrect ? 'explain-correct' : 'explain-wrong'}">
                <strong>${q.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
                <p>${escapeHtml(q.explanation || '')}</p>
            </div>` : ''}

        <div class="question-check-row">
            <button class="btn btn-outline" id="checkBtn" type="button" ${isComplete(q) && !locked ? '' : 'disabled'}>
                ${locked ? 'Answer checked' : 'Check Answer'}
            </button>
            ${!locked ? `<span class="check-hint">Optional — your answer is saved either way.</span>` : ''}
        </div>
    `;

    bindQuestionEvents(card, q);
}

function bindQuestionEvents(card, q) {
    qsa('input[data-opt]', card).forEach((input) => {
        input.addEventListener('change', () => {
            if (q.checked) return;
            handleOptionChange(q, input);
            persist();
            renderCurrentQuestion();
            renderNavigator();
            updateProgress();
        });
    });

    qsa('.bool-btn', card).forEach((btn) => {
        btn.addEventListener('click', () => {
            if (q.checked) return;
            q.userAnswers = [Number(btn.dataset.opt)];
            persist();
            renderCurrentQuestion();
            renderNavigator();
            updateProgress();
        });
    });

    qs('#checkBtn', card)?.addEventListener('click', () => {
        if (!isComplete(q) || q.checked) return;
        checkQuestion(q);
        renderCurrentQuestion();
        renderNavigator();
        updateProgress();
    });

    qs('#bookmarkToggle', card)?.addEventListener('click', () => {
        toggleBookmark(q);
        renderCurrentQuestion();
    });
}

function handleOptionChange(q, input) {
    const idx = Number(input.dataset.opt);
    if (q.type !== 'multiple') {
        q.userAnswers = [idx];
        return;
    }

    const required = requiredSelections(q);
    if (input.checked) {
        if (q.userAnswers.includes(idx)) return;
        // Keep the newest selections when the learner exceeds the limit.
        q.userAnswers = [...q.userAnswers, idx].slice(-required);
    } else {
        q.userAnswers = q.userAnswers.filter((a) => a !== idx);
    }
}

function isSelected(q, idx) {
    return (q.userAnswers || []).includes(idx);
}

function optionState(q, i) {
    if (!q.checked) return '';
    const isCorrectOpt = (q.correctAnswer || []).includes(i);
    const isChosen = (q.userAnswers || []).includes(i);
    if (isCorrectOpt) return 'correct';
    if (isChosen) return 'wrong';
    return 'dimmed';
}

function optionResultIcon(q, i) {
    const isCorrectOpt = (q.correctAnswer || []).includes(i);
    const isChosen = (q.userAnswers || []).includes(i);
    if (isCorrectOpt) return '<span class="result-icon correct" aria-label="Correct answer">✓</span>';
    if (isChosen) return '<span class="result-icon wrong" aria-label="Your incorrect answer">✗</span>';
    return '';
}

function typeLabel(type) {
    switch (type) {
        case 'multiple': return 'Multiple Choice';
        case 'boolean': return 'True / False';
        default: return 'Single Choice';
    }
}

function checkQuestion(q) {
    q.checked = true;
    q.isCorrect = gradeQuestion(q);
    persist();
}

function persist() {
    if (state) saveInProgress(state);
}

/* ------------------------------------------------------------
   Navigation
   ------------------------------------------------------------ */
function navigate(dir) {
    if (!state) return;
    const next = state.currentIndex + dir;
    if (next < 0 || next >= state.questions.length) return;
    goTo(next);
}

function goTo(index) {
    if (!state || index === state.currentIndex) return;

    // Bank the time spent on the question we are leaving.
    commitQuestionTime();
    state.currentIndex = index;
    persist();

    renderCurrentQuestion();
    renderNavigator();
    updateProgress();
    updateQuestionTimer();
    focusQuestion();
}

/** Bring the question into view and move focus for screen readers. */
function focusQuestion() {
    const card = qs('#questionCard');
    if (!card) return;
    const top = qs('#view-exam-runner')?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: 'smooth' });
    card.focus({ preventScroll: true });
}

function renderNavigator() {
    const grid = qs('#runnerNavGrid');
    if (!grid || !state) return;

    grid.innerHTML = state.questions.map((q, i) => {
        let cls = 'nav-cell';
        let status = 'Not answered';
        if (q.checked && q.isCorrect) { cls += ' correct'; status = 'Correct'; }
        else if (q.checked && !q.isCorrect) { cls += ' wrong'; status = 'Incorrect'; }
        else if (isAnswered(q)) { cls += ' answered'; status = 'Answered'; }
        if (i === state.currentIndex) cls += ' current';

        return `<button class="${cls}" type="button" data-idx="${i}"
                        aria-label="Question ${i + 1}, ${status}"
                        ${i === state.currentIndex ? 'aria-current="true"' : ''}>${i + 1}</button>`;
    }).join('');

    qsa('.nav-cell', grid).forEach((cell) => {
        cell.addEventListener('click', () => {
            goTo(Number(cell.dataset.idx));
            // On mobile the navigator is a drawer — close it after picking.
            if (window.matchMedia('(max-width: 900px)').matches) setDrawer(false);
        });
    });
}

/* ------------------------------------------------------------
   Progress bar (FIX #4)
   ------------------------------------------------------------ */
function updateProgress() {
    if (!state) return;
    const total = state.questions.length;
    const done = answeredCount();
    const pct = total ? Math.round((done / total) * 100) : 0;

    const fill = qs('#progressFill');
    const bar = qs('#progressBar');
    const counter = qs('#progressCounter');
    const pctEl = qs('#progressPct');

    if (fill) {
        fill.style.width = pct + '%';
        // Colour stages: 0-25 / 25-50 / 50-75 / 75-100
        const stage = pct >= 75 ? 4 : pct >= 50 ? 3 : pct >= 25 ? 2 : 1;
        fill.className = `answer-progress-fill stage-${stage}`;
    }
    if (bar) {
        bar.setAttribute('aria-valuenow', String(pct));
        bar.setAttribute('aria-valuetext', `${done} of ${total} questions answered`);
    }
    if (counter) counter.textContent = `${done} of ${total} answered`;
    if (pctEl) {
        pctEl.textContent = pct === 100 ? '100% ✓' : pct + '%';
        // Brief pulse so the change is noticeable without being distracting.
        pctEl.classList.remove('bump');
        void pctEl.offsetWidth;
        pctEl.classList.add('bump');
    }

    // Next/Previous availability
    const prev = qs('#prevBtn');
    const next = qs('#nextBtn');
    if (prev) prev.disabled = state.currentIndex === 0;
    if (next) next.disabled = state.currentIndex === total - 1;
}

/* ------------------------------------------------------------
   Bookmarks
   ------------------------------------------------------------ */
function toggleBookmark(q) {
    const examId = questionExamId(q);
    if (isBookmarked(examId, q.id)) {
        removeBookmark(examId, q.id);
        return;
    }
    saveBookmark({
        examId,
        examTitle: q.examTitle || (state.mockId ? `Mock Test ${state.mockId}` : 'Practice Session'),
        questionId: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        userAnswer: q.userAnswers,
        type: q.type,
    });
}

/* ------------------------------------------------------------
   Finish  (FIX #1)
   ------------------------------------------------------------ */
async function confirmFinish() {
    if (!state) return;

    const unanswered = state.questions.filter((q) => !isAnswered(q)).length;
    const partial = state.questions.filter((q) => isAnswered(q) && !isComplete(q)).length;

    const parts = [];
    if (unanswered > 0) parts.push(`${unanswered} unanswered question${unanswered === 1 ? '' : 's'}`);
    if (partial > 0) parts.push(`${partial} partly answered question${partial === 1 ? '' : 's'}`);

    const msg = parts.length
        ? `You have ${parts.join(' and ')}. They will be marked incorrect.\n\nFinish anyway?`
        : 'Finish and see your results?';

    // window.confirm is replaced by an async dialog in main.js, so the
    // Promise must be awaited — otherwise "Cancel" would still submit.
    if (await window.confirm(msg)) finishExam(false);
}

function finishExam(auto) {
    if (!state) return;

    // Bank the final question's time before the session is torn down.
    commitQuestionTime();

    // Snapshot then null the session immediately so a double-click,
    // or the timer firing mid-submit, cannot submit twice.
    const session = state;
    state = null;
    teardownExamRunner();
    clearInProgress();

    // Grade EVERY question from its selection — this is the actual
    // FIX #1: scoring no longer depends on "Check Answer" being used.
    const graded = session.questions.map((q) => {
        const answered = (q.userAnswers || []).length > 0;
        return {
            id: q.id,
            examId: q.mockId ?? session.mockId,
            examTitle: q.mockId ? `Mock Test ${q.mockId}` : session.mockId ? `Mock Test ${session.mockId}` : 'Practice Session',
            category: q.category || 'General',
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswers: q.userAnswers || [],
            type: q.type,
            answered,
            checked: !!q.checked,
            isCorrect: answered && gradeQuestion(q),
            timeSpentSec: Math.round((q.timeSpentMs || 0) / 1000),
            explanation: q.explanation,
        };
    });

    const total = graded.length;
    const correct = graded.filter((q) => q.isCorrect).length;
    const answeredTotal = graded.filter((q) => q.answered).length;
    const score = total ? Math.round((correct / total) * 100) : 0;
    const passMark = session.passMark ?? 75;
    const timeTakenSec = Math.max(1, Math.floor((Date.now() - session.startsAt) / 1000));

    let result;
    try {
        result = addResult({
            examId: session.mockId,
            examTitle: session.mockId ? `Mock Test ${session.mockId}` : 'Practice Session',
            mode: session.mode || 'exam',
            score,
            passed: score >= passMark,
            passMark,
            correct,
            incorrect: answeredTotal - correct,
            skipped: total - answeredTotal,
            total,
            timeTakenSec,
            date: Date.now(),
            auto: !!auto,
            questions: graded,
        });

        // Feed the practice engine (FIX #6).
        recordAttempt(session.mockId, graded);
    } catch (e) {
        console.error('Could not save result:', e);
        alert('Your result could not be saved, but here is your score: '
            + `${score}% (${correct}/${total}).`);
    }

    window.location.hash = result ? `#/results?result=${result.id}` : '#/history';
}

/* ------------------------------------------------------------
   Practice Mode Helpers
   ------------------------------------------------------------ */
function practiceModeLabel(mode) {
    switch (mode) {
        case 'wrong': return 'Incorrect questions';
        case 'bookmarked': return 'Bookmarked questions';
        case 'weak': return 'Weak areas';
        default: return mode;
    }
}

async function buildPracticeSession(mode) {
    // Load all questions
    const allQuestions = await loadQuestions();

    let questions = [];
    switch (mode) {
        case 'wrong':
            // Get incorrectly answered questions from history
            const history = await getHistory();
            const wrongQuestionIds = new Set();
            history.forEach(attempt => {
                attempt.questions.forEach(q => {
                    if (!q.isCorrect) wrongQuestionIds.add(q.id);
                });
            });
            questions = allQuestions.filter(q => wrongQuestionIds.has(q.id));
            break;

        case 'bookmarked':
            // Get bookmarked questions
            const bookmarks = await getBookmarks();
            questions = allQuestions.filter(q => bookmarks.has(q.id));
            break;

        case 'weak':
            // Get questions from weak categories (simplified - could be enhanced)
            const weakCategories = await getWeakCategories();
            questions = allQuestions.filter(q => weakCategories.has(q.category));
            break;

        default:
            questions = allQuestions;
    }

    // Shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);

    return {
        mode,
        questions: questions.slice(0, 20).map(newQuestionState), // Limit to 20 questions for practice
        passMark: 75,
        startedAt: Date.now(),
    };
}

// Helper functions feeding buildPracticeSession — backed by real
// localStorage data so "Practise My Mistakes" / "Smart Practice" work.

async function getHistory() {
    return getResults();
}

async function getBookmarks() {
    return getBookmarkedIds(); // Set of bookmarked question ids (storage.js)
}

async function getWeakCategories() {
    // Categories where the learner scores below 70% across saved attempts
    const stats = {};
    for (const result of getResults()) {
        for (const q of (result.questions || [])) {
            const cat = q.category || 'General';
            stats[cat] = stats[cat] || { correct: 0, total: 0 };
            stats[cat].total += 1;
            if (q.isCorrect) stats[cat].correct += 1;
        }
    }
    return new Set(
        Object.entries(stats)
            .filter(([, s]) => s.total > 0 && (s.correct / s.total) < 0.7)
            .map(([cat]) => cat)
    );
}