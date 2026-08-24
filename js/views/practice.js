// ============================================================
// PRACTICE VIEW - Topic-based practice
// ============================================================

import { resultsModule } from '../results.js';
import { bookmarksModule } from '../bookmarks.js';

// Active practice session (module-scope so inline onclick handlers can drive it)
let currentPractice = null;

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

        // Show smart practice section if we have history
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

function startSmartPractice() {
    // This would be implemented with smart practice logic
    // For now, placeholder
    alert('Smart practice feature coming soon!');
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
window.navigatePracticeQuestion = navigatePracticeQuestion;
window.togglePracticeOption = togglePracticeOption;
window.submitPractice = submitPractice;
window.togglePracticeBookmark = togglePracticeBookmark;