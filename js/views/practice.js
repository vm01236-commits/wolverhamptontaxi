// ============================================================
// PRACTICE VIEW - Topic-based practice
// ============================================================

import { resultsModule } from '../results.js';
import { bookmarksModule } from '../bookmarks.js';
import { analyzePerformance } from '../analytics.js';
import { getQuestionStats } from '../storage.js';

// Active practice session (module-scope so inline onclick handlers can drive it)
let currentPractice = null;

/* ============================================================
   SMART PRACTICE MODE CARDS - ported from the Life-in-UK app.
   Ad-hoc untimed sessions built from the learner's own mistake
   history instead of forcing full-topic retakes.
   ============================================================ */

/** Sessions are capped so a big question pool stays finishable. */
export const SESSION_CAP = 30;

export const PRACTICE_MODES = [
    {
        id: 'all',
        icon: '🎲',
        label: 'All Questions',
        description: 'A random mix drawn from every topic. Good for general revision.',
    },
    {
        id: 'incorrect',
        icon: '🎯',
        label: 'Incorrect Only',
        description: 'Only the questions you last answered wrong or skipped.',
    },
    {
        id: 'repeated',
        icon: '🔁',
        label: 'Repeated Mistakes',
        description: 'Questions you have missed 2+ times. Highest priority.',
    },
    {
        id: 'weak',
        icon: '📉',
        label: 'Weak Areas',
        description: 'Questions from your lowest-scoring topics.',
    },
];

/** Fisher-Yates shuffle returning a new array. */
function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function init(container) {
    // Load practice view content
    container.innerHTML = `
        <div class="practice-view">
            <!-- Practice Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Topic Practice</h1>
                    <p class="text-muted">
                        Practice specific topics from the Wolverhampton Taxi Driver Handbook to strengthen your knowledge.
                    </p>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item">
                            <i class="fas fa-list-alt"></i>
                            <span>12 topics</span>
                        </div>
                        <div class="exam-meta-item">
                            <i class="fas fa-chart-line"></i>
                            <span>Track progress</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Practice Controls -->
            <div class="practice-controls" id="practiceControls">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading topics...</div>
                </div>
            </div>

            <!-- Practice Content -->
            <div class="practice-content" id="practiceContent" style="display: none;">
                <!-- Practice questions will be injected here -->
            </div>

            <!-- Smart Practice mode cards (ported from Life-in-UK) -->
            <section class="smart-modes-section" id="smartModeSection">
                <h2 class="section-title center">Smart Practice</h2>
                <p class="text-muted center">Target your mistakes instead of retaking whole topics</p>
                <div id="recommendSlot"></div>
                <div id="statsSlot"></div>
                <div class="practice-grid" id="smartModeGrid"></div>
            </section>

            <!-- Smart Practice Section -->
            <section class="smart-practice-view" id="smartPracticeSection" style="display: none;">
                <h2 class="section-title center">Focus Areas</h2>
                <div class="weakness-chart" id="weaknessChart">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Analyzing your performance...</div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Load practice data
    loadPracticeData();

    return Promise.resolve();
}

async function loadPracticeData() {
    try {
        // Load questions data
        const questions = await window.dataLayer.loadQuestions();

        // Get all categories
        const categories = await window.dataLayer.getAllCategories();

                // Load user progress/history for smart practice
        const history = resultsModule.getHistory();

        // Render controls
        renderPracticeControls(categories, questions);

        // Render the smart-practice mode cards (ported from Life-in-UK).
        // Guarded so a failure here can never take down the topic selector.
        try { renderSmartModeCards(questions); }
        catch (err) { console.error('Smart practice cards failed:', err); }

        // Show the existing weakness-chart section if we have history
        if (history.length > 0) {
            document.getElementById('smartPracticeSection').style.display = 'block';
            loadWeaknessChart(history);
        }

    } catch (error) {
        console.error('Error loading practice data:', error);
        showErrorMessage();
    }
}

function renderPracticeControls(categories, questions) {
    const controlsContainer = document.getElementById('practiceControls');

    controlsContainer.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="topicSelect">Select Topic</label>
            <select class="form-select" id="topicSelect">
                <option value="">-- Choose a topic --</option>
                ${categories.map(category => `
                    <option value="${category}">${category} (${questions.filter(q => q.category.trim() === category).length} questions)</option>
                `).join('')}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="questionCount">Number of Questions</label>
            <select class="form-select" id="questionCount">
                <option value="5">5 questions</option>
                <option value="10" selected>10 questions</option>
                <option value="15">15 questions</option>
                <option value="20">20 questions</option>
                <option value="25">25 questions</option>
                <option value="30">30 questions</option>
            </select>
        </div>

        <button class="btn btn-primary" onclick="startPracticeSession()">
            Start Practice
        </button>

        <button class="btn btn-secondary" onclick="startSmartPractice()" id="smartPracticeBtn">
            Smart Practice
        </button>
    `;
}

function startPracticeSession() {
    const topicSelect = document.getElementById('topicSelect');
    const questionCountSelect = document.getElementById('questionCount');

    const topic = topicSelect.value;
    const questionCount = parseInt(questionCountSelect.value);

    if (!topic) {
        alert('Please select a topic');
        return;
    }

    // Hide controls, show practice content
    document.getElementById('practiceControls').style.display = 'none';
    document.getElementById('practiceContent').style.display = 'block';

    // Load and start practice session
    loadPracticeQuestions(topic, questionCount);
}

async function loadPracticeQuestions(topic, questionCount) {
    try {
        // Get questions for the selected topic
        const questions = await window.dataLayer.getQuestionsByCategory(topic);

        // Shuffle and limit to requested count
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

        // Initialize practice session
        initPracticeRunner(selected, topic);

    } catch (error) {
        console.error('Error loading practice questions:', error);
        showPracticeError();
    }
}

function initPracticeRunner(questions, topic) {
    const contentContainer = document.getElementById('practiceContent');

    contentContainer.innerHTML = `
        <div class="practice-runner">
            <!-- Practice Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Practice: ${topic}</h1>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item" id="practiceTimer">
                            <i class="fas fa-stopwatch"></i>
                            <span class="timer-value" id="practiceTimerDisplay">00:00</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Practice Progress -->
            <div class="practice-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="practiceProgressFill"></div>
                </div>
                <div class="practice-stats">
                    <span>Question <span id="practiceCurrentQuestion">1</span> of <span id="practiceTotalQuestions">${questions.length}</span></span>
                    <span>Answered: <span id="practiceCorrectCount">0</span></span>
                </div>
            </div>

            <!-- Practice Question -->
            <div class="exam-question" id="practiceQuestionContainer">
                <!-- Question will be injected here -->
            </div>

            <!-- Practice Actions -->
            <div class="practice-actions">
                <button class="btn btn-neutral" id="practicePrevBtn" onclick="navigatePracticeQuestion(-1)">
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <button class="btn btn-primary" id="practiceNextBtn" onclick="navigatePracticeQuestion(1)">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
                <button class="btn btn-success" id="practiceSubmitBtn" style="display: none;" onclick="submitPractice()">
                    Submit Practice
                </button>
            </div>
        </div>
    `;

    // Initialize practice state
    const practiceState = {
        questions: questions,
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        startTime: Date.now(),
        topic: topic
    };
    currentPractice = practiceState;

    // Load first question
    loadPracticeQuestion(practiceState);

    // Initialize timer
    startPracticeTimer(practiceState);
}

function loadPracticeQuestion(state) {
    const container = document.getElementById('practiceQuestionContainer');
    const question = state.questions[state.currentIndex];
    const answered = state.answers[state.currentIndex] || [];

    // Update progress
    document.getElementById('practiceCurrentQuestion').textContent = state.currentIndex + 1;
    document.getElementById('practiceTotalQuestions').textContent = state.questions.length;
    document.getElementById('practiceCorrectCount').textContent =
        state.answers.filter(a => a !== null).length;

    // Update progress bar
    const progressPercent = ((state.currentIndex + 1) / state.questions.length) * 100;
    document.getElementById('practiceProgressFill').style.width = progressPercent + '%';

    // Instant feedback: reveal correctness + explanation once answered
    const showFeedback = answered.length > 0;
    const isCorrect = showFeedback && examAnswerMatches(answered, question.correctIndexes);

    // Bookmark state for this question
    const bookmarked = bookmarksModule.isBookmarked(question.id);

    // Render question
    container.innerHTML = `
        <div class="exam-question-header">
            <div class="question-number">${state.currentIndex + 1}</div>
            <div class="question-type-badge ${question.type}">
                ${examFormatQuestionType(question.type)}
            </div>
            <button type="button"
                    class="bookmark-btn ${bookmarked ? 'bookmarked' : ''}"
                    onclick="togglePracticeBookmark()"
                    aria-pressed="${bookmarked}"
                    aria-label="${bookmarked ? 'Remove bookmark from this question' : 'Bookmark this question'}"
                    title="${bookmarked ? 'Remove bookmark' : 'Bookmark this question'}">
                <i class="${bookmarked ? 'fas' : 'far'} fa-bookmark"></i>
            </button>
        </div>

        <div class="question-text">${question.question}</div>

        <div class="options-grid" id="practiceOptionsContainer">
            <!-- Options will be injected here -->
        </div>

        <div class="exam-feedback ${showFeedback ? (isCorrect ? 'feedback-correct' : 'feedback-incorrect') : ''}"
             id="practiceFeedback"
             style="display: ${showFeedback ? 'block' : 'none'};">
            ${examBuildFeedbackHtml(question, answered, isCorrect, showFeedback)}
        </div>
    `;

    // Render options
    const optionsContainer = document.getElementById('practiceOptionsContainer');
    question.options.forEach((option, index) => {
        const isSelected = answered.includes(index);
        const isCorrectOption = showFeedback && (question.correctIndexes || []).includes(index);
        const isWrongPick = showFeedback && isSelected && !isCorrectOption;

        const classes = ['option-label'];
        if (isSelected) classes.push('selected');
        if (isCorrectOption) classes.push('correct');
        if (isWrongPick) classes.push('incorrect');

        optionsContainer.innerHTML += `
            <label class="${classes.join(' ')}"
                   onclick="togglePracticeOption(${index})">
                <div class="option-checkbox">
                    <div class="option-checkbox-inner"></div>
                </div>
                <div class="option-text">${option}</div>
            </label>
        `;
    });
}

function examFormatQuestionType(type) {
    switch (type) {
        case 'single-choice': return 'Single Choice';
        case 'multiple-choice':
        case 'multi-choice': return 'Multiple Choice';
        case 'true-false': return 'True / False';
        default: return type;
    }
}

function examAnswerMatches(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

function examBuildFeedbackHtml(question, answered, isCorrect, showFeedback) {
    if (!showFeedback) return '';
    const correctText = (question.correctIndexes || [])
        .map(ix => question.options[ix]).join(', ');
    return `
        <div class="feedback-head">
            <i class="fas ${isCorrect ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
            <span>${isCorrect ? 'Correct!' : 'Not quite...'}</span>
        </div>
        ${!isCorrect && correctText ? `<div class="feedback-answer">Correct answer: <strong>${correctText}</strong></div>` : ''}
        ${question.explanation ? `<div class="feedback-explanation"><i class="fas fa-lightbulb"></i><span>${question.explanation}</span></div>` : ''}
    `;
}

function togglePracticeBookmark() {
    if (!currentPractice) return;
    const question = currentPractice.questions[currentPractice.currentIndex];
    bookmarksModule.toggleBookmark(question.id);
    loadPracticeQuestion(currentPractice);
}

function togglePracticeOption(optionIndex) {
    if (!currentPractice) return;

    const qIndex = currentPractice.currentIndex;
    const question = currentPractice.questions[qIndex];
    const current = currentPractice.answers[qIndex];

    let selection;
    if (question.type === 'multiple-choice' || question.type === 'multi-choice') {
        const arr = current ? [...current] : [];
        const pos = arr.indexOf(optionIndex);
        if (pos >= 0) arr.splice(pos, 1);
        else arr.push(optionIndex);
        selection = arr;
    } else {
        selection = [optionIndex];
    }

    currentPractice.answers[qIndex] = selection;
    loadPracticeQuestion(currentPractice);
    updatePracticeStats();
}

function navigatePracticeQuestion(direction) {
    if (!currentPractice) return;
    const next = currentPractice.currentIndex + direction;
    if (next < 0) return;
    if (next >= currentPractice.questions.length) {
        // Reveal submit when reaching the end
        document.getElementById('practiceSubmitBtn').style.display = 'block';
        return;
    }
    currentPractice.currentIndex = next;
    loadPracticeQuestion(currentPractice);
}

function updatePracticeStats() {
    if (!currentPractice) return;
    const answered = currentPractice.answers.filter(a => a !== null).length;
    document.getElementById('practiceCorrectCount').textContent = answered;
    if (answered === currentPractice.questions.length) {
        document.getElementById('practiceSubmitBtn').style.display = 'block';
    }
}

function startPracticeTimer(state) {
    const timerDisplay = document.getElementById('practiceTimerDisplay');

    // Update timer every second
    state.timerInterval = setInterval(() => {
        const elapsed = Date.now() - state.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function submitPractice() {
    if (!currentPractice) return;

    document.getElementById('practiceSubmitBtn').style.display = 'none';
    if (currentPractice.timerInterval) clearInterval(currentPractice.timerInterval);

    const questions = currentPractice.questions;
    const answers = currentPractice.answers;

    // Score the session
    let correctCount = 0;
    const questionResults = questions.map((question, index) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correctIndexes;
        let isCorrect = false;

        if (userAnswer && Array.isArray(correctAnswer)) {
            const sortedUser = [...userAnswer].sort((a, b) => a - b);
            const sortedCorrect = [...correctAnswer].sort((a, b) => a - b);
            isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
        }
        if (isCorrect) correctCount++;

        return {
            questionIndex: index,
            questionId: question.id,
            userAnswer,
            correctAnswer,
            isCorrect,
            explanation: question.explanation
        };
    });

    const total = questions.length;
    const percent = (correctCount / total) * 100;
    const result = {
        correctCount,
        totalQuestions: total,
        scorePercent: percent,
        passed: percent >= 75,
        questionResults,
        passMarkPercent: 75,
        elapsedTime: Math.round((Date.now() - currentPractice.startTime) / 1000)
    };

    // Persist to history
    resultsModule.saveResult(result, 'practice', currentPractice.topic);

    const topic = currentPractice.topic;
    currentPractice = null;
    showPracticeResults(result, topic);
}

function showPracticeResults(result, topic) {
    const container = document.getElementById('practiceContent');
    const percent = Math.round(result.scorePercent);

    container.innerHTML = `
        <div class="results-view">
            <div class="results-header">
                <div class="results-summary">
                    <h1 class="section-title ${result.passed ? 'results-title-pass' : 'results-title-fail'}">
                        ${result.passed ? 'Good work!' : 'Keep Practicing'}
                    </h1>
                    <p class="text-muted">
                        Topic: <strong>${topic}</strong> — you scored
                        <strong>${result.correctCount}</strong> out of
                        <strong>${result.totalQuestions}</strong> questions correctly
                        (${percent}%).
                    </p>
                    <div class="results-stats">
                        <div class="stat-card"><div class="stat-value">${result.correctCount}</div><div class="stat-label">Correct</div></div>
                        <div class="stat-card"><div class="stat-value">${result.totalQuestions - result.correctCount}</div><div class="stat-label">Incorrect</div></div>
                        <div class="stat-card"><div class="stat-value">${Math.round(result.elapsedTime || 0)}s</div><div class="stat-label">Time Used</div></div>
                    </div>
                    <div class="results-actions">
                        <button class="btn btn-primary" onclick="window.location.hash = '#practice'">
                            <i class="fas fa-redo"></i> Practice Again
                        </button>
                        <button class="btn btn-secondary" onclick="window.location.hash = '#history'">
                            <i class="fas fa-history"></i> View History
                        </button>
                    </div>
                </div>
            </div>
            <h3 class="section-title center">Answer Review</h3>
            <div class="results-review" id="practiceReview">
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-info-circle"></i></div>
                    <div class="empty-title">Review Saved to History</div>
                    <div class="empty-subtitle">Detailed per-question review is available in the History view.</div>
                </div>
            </div>
        </div>
    `;
}

/** Basic HTML escaping for data-driven strings. */
function esc(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Build the per-mode question pools from mistake history.
 * @param {Array} questions - every question in the data layer
 */
function buildSmartPools(questions) {
    const stats = getQuestionStats();
    const history = resultsModule.getHistory();
    const hasHistory = history.length > 0;

    // Map questionId -> stat entry (first wins regardless of exam key)
    const statByQ = new Map();
    Object.values(stats).forEach((s) => {
        const k = String(s.questionId);
        if (!statByQ.has(k)) statByQ.set(k, s);
    });
    const byId = new Map(questions.map((q) => [String(q.id), q]));

    const incorrect = [];
    const repeated = [];
    statByQ.forEach((s, idStr) => {
        const q = byId.get(idStr);
        if (!q) return;
        if (s.lastOutcome === 'wrong' || s.lastOutcome === 'skipped') incorrect.push(q);
        if ((s.timesWrong || 0) >= 2) repeated.push(q);
    });

    // Weak topics inferred from saved history accuracy
    const catStats = {};
    history.forEach((item) => {
        const c = item.category || 'General';
        if (!catStats[c]) catStats[c] = { correct: 0, total: 0 };
        catStats[c].total += item.total;
        catStats[c].correct += item.score;
    });
    const rankedTopics = Object.entries(catStats)
        .map(([topic, s]) => ({ topic, pct: s.total ? (s.correct / s.total) * 100 : 0 }))
        .sort((a, b) => a.pct - b.pct);
    const weakest = new Set(rankedTopics.slice(0, 3).map((r) => r.topic));

    const wrongCount = (q) => (statByQ.get(String(q.id)) || {}).timesWrong || 0;
    const weak = questions
        .filter((q) => weakest.has(String(q.category || '').trim()))
        .sort((a, b) => wrongCount(b) - wrongCount(a)); // worst-first

    return { all: questions, incorrect, repeated, weak, rankedTopics, hasHistory };
}

/** Render the recommend banner, summary stats and mode cards. */
function renderSmartModeCards(questions) {
    const grid = document.getElementById('smartModeGrid');
    if (!grid) return;

    const pools = buildSmartPools(questions);

        // Recommendation banner + summary stats (only once there is history).
    // Wrapped in try/catch: analytics.analyzePerformance has a latent bug
    // (Array.append) upstream, and the recommendation banner must never
    // take the whole Practice view down because of it.
    const recSlot = document.getElementById('recommendSlot');
    const statsSlot = document.getElementById('statsSlot');
    if (pools.hasHistory && recSlot && statsSlot) {
        let analysis = null;
        try {
            analysis = analyzePerformance(resultsModule.getHistory());
        } catch (err) {
            console.error('Recommendation analysis failed:', err);
        }

        if (analysis) {
            const top = analysis.weakAreas[0];
            const body = top
                ? `${esc(top.category)} is currently at ${Math.round(top.percent)}% accuracy — a focused session will lift it fastest.`
                : esc(analysis.recommendations[0] || 'Keep practising to build on your streak!');

            recSlot.innerHTML = `
                <div class="recommend-card">
                    <span class="recommend-icon" aria-hidden="true">💡</span>
                    <div class="recommend-body">
                        <h3 class="recommend-title">${top ? `Focus on ${esc(top.category)}` : 'You are doing great'}</h3>
                        <p class="recommend-text">${body}</p>
                    </div>
                    <button type="button" class="btn btn-primary recommend-cta"
                            onclick="startModePractice('${top ? 'weak' : 'all'}')">
                        ${top ? 'Start Now' : 'Keep Going'}
                    </button>
                </div>`;
        }

        const scores = resultsModule.getHistory()
            .map((h) => (h.total ? Math.round((h.score / h.total) * 100) : 0));
        const avg = Math.round(scores.reduce((sum2, s2) => sum2 + s2, 0) / scores.length);
        const best = Math.max(...scores);
        const passed = scores.filter((s2) => s2 >= 75).length;
        statsSlot.innerHTML = `
            <div class="practice-stats">
                <div class="pstat"><span class="pstat-value">${scores.length}</span><span class="pstat-label">Sessions taken</span></div>
                <div class="pstat"><span class="pstat-value">${avg}%</span><span class="pstat-label">Average score</span></div>
                <div class="pstat"><span class="pstat-value">${best}%</span><span class="pstat-label">Best score</span></div>
                <div class="pstat"><span class="pstat-value">${passed}</span><span class="pstat-label">Passed (75%+)</span></div>
            </div>`;
    }

    grid.innerHTML = PRACTICE_MODES.map((mode) => smartModeCard(mode, pools)).join('');
}

/** One card in the Smart Practice grid. */
function smartModeCard(mode, pools) {
    const pool = pools[mode.id] || [];
    const count = pool.length;
    const available = count > 0;
    const capped = available && count > SESSION_CAP;

    let meta;
    if (!available) {
        meta = mode.id === 'all' ? 'No questions available'
            : pools.hasHistory ? 'All clear — nothing to practise ✓'
                : 'Take a test first to unlock this';
    } else if (capped) {
        meta = `${count} in pool &bull; ${SESSION_CAP} per session`;
    } else {
        meta = `${count} question${count === 1 ? '' : 's'}`;
    }

    return `
        <div class="practice-card ${available ? '' : 'disabled'}">
            <span class="practice-icon" aria-hidden="true">${mode.icon}</span>
            <h3 class="practice-title">${esc(mode.label)}</h3>
            <p class="practice-desc">${esc(mode.description)}</p>
            <p class="practice-count ${available ? '' : 'muted'}">${meta}</p>
            <button type="button"
                    class="btn ${available ? 'btn-primary' : 'btn-outline'} btn-block"
                    onclick="startModePractice('${mode.id}')"
                    ${available ? '' : 'disabled aria-disabled="true"'}>
                ${available ? 'Start Practice'
                    : pools.hasHistory && mode.id !== 'all' ? 'Nothing to practise' : 'Unavailable'}
            </button>
        </div>`;
}

/**
 * Build an untimed session from one of the smart-practice modes and
 * hand it to the existing runner.
 * @param {'all'|'incorrect'|'repeated'|'weak'} mode
 */
async function startModePractice(mode) {
    try {
        const questions = await window.dataLayer.loadQuestions();
        const pools = buildSmartPools(questions);
        const pool = pools[mode] || [];

        if (!pool.length) {
            toastSafe('Nothing to practise yet.');
            return;
        }

        // "All" is a random sample; targeted modes keep worst-first ordering
        // so the most-missed questions come up even when truncated.
        const ordered = mode === 'all' ? shuffle(pool) : pool;
        const selected = ordered.slice(0, SESSION_CAP);
        const label = (PRACTICE_MODES.find((m) => m.id === mode) || {}).label || 'Smart Practice';

        document.getElementById('practiceControls').style.display = 'none';
        const section = document.getElementById('smartModeSection');
        if (section) section.style.display = 'none';
        document.getElementById('practiceContent').style.display = 'block';

        initPracticeRunner(selected, label);
    } catch (error) {
        console.error('Error starting smart practice:', error);
        showPracticeError();
    }
}

/** Toast with a graceful fallback if the theme module is unavailable. */
function toastSafe(message) {
    if (typeof window.themeManager?.toast === 'function') {
        window.themeManager.toast(message);
    } else {
        alert(message);
    }
}

function startSmartPractice() {
    // The legacy "Smart Practice" button now drives the Weak Areas card
    // (falls back to All Questions when there is no history yet).
    startModePractice(resultsModule.getHistory().length > 0 ? 'weak' : 'all');
}

function loadWeaknessChart(history) {
    const chartContainer = document.getElementById('weaknessChart');

    // Simple weakness analysis based on history (grouped by category,
    // correct count comes from the saved score on each history item)
    const topicStats = {};

    history.forEach(item => {
        const topic = item.category || 'General';
        if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
        }
        topicStats[topic].total += item.total;
        topicStats[topic].correct += item.score;
    });

    // Calculate weakness percentages
    const weaknessData = Object.entries(topicStats).map(([topic, stats]) => ({
        topic,
        weakness: 1 - (stats.correct / stats.total)
    })).sort((a, b) => b.weakness - a.weakness);

    // Render weakness chart
    chartContainer.innerHTML = `
        <h3>Topics to Focus On</h3>
        <div class="weakness-list">
            ${weaknessData.slice(0, 5).map(item => `
                <div class="weakness-item">
                    <div class="weakness-info">
                        <span class="weakness-topic">${item.topic}</span>
                        <span class="weakness-percentage">${Math.round((1 - item.weakness) * 100)}% correct</span>
                    </div>
                    <div class="weakness-bar">
                        <div class="weakness-fill" style="width: ${item.weakness * 100}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary" onclick="startSmartPractice()">
            Start Smart Practice
        </button>
    `;
}

function showErrorMessage() {
    const controlsContainer = document.getElementById('practiceControls');
    controlsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-title">Error Loading Practice</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading the practice data. Please try again later.
            </div>
        </div>
    `;
}

function showPracticeError() {
    const contentContainer = document.getElementById('practiceContent');
    contentContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="empty-title">Error Loading Practice Questions</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading the practice questions. Please try again later.
            </div>
            <button class="btn btn-primary" onclick="window.location.hash = '#practice'">
                Return to Practice
            </button>
        </div>
    `;
}
// Expose inline-onclick handlers to the global scope (module functions are
// not otherwise reachable from onclick="..." attributes).
window.startPracticeSession = startPracticeSession;
window.startSmartPractice = startSmartPractice;
window.startModePractice = startModePractice;
window.navigatePracticeQuestion = navigatePracticeQuestion;
window.togglePracticeOption = togglePracticeOption;
window.submitPractice = submitPractice;
window.togglePracticeBookmark = togglePracticeBookmark;