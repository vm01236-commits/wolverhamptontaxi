// ============================================================
// EXAMS VIEW - Mock tests and practice exams
// ============================================================

import { ExamRunner } from '../examRunner.js';

export function init(container) {
    // Load exams view content
    container.innerHTML = `
        <div class="exam-view">
            <!-- Exam Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Mock Tests</h1>
                    <p class="text-muted">
                        Practice with full-length mock tests that simulate the actual Wolverhampton Taxi Knowledge Test.
                    </p>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item">
                            <i class="fas fa-clock"></i>
                            <span>40 minutes per test</span>
                        </div>
                        <div class="exam-meta-item">
                            <i class="fas fa-tasks"></i>
                            <span>28 questions per test</span>
                        </div>
                        <div class="exam-meta-item">
                            <i class="fas fa-check-circle"></i>
                            <span>75% pass mark</span>
                        </div>
                    </div>
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

            <!-- Available when a mock test is selected -->
            <div class="exam-container" id="examContainer" style="display: none;">
                <!-- Exam content will be injected here -->
            </div>
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

    if (!mocksIndex.mockTests || mocksIndex.mockTests.length === 0) {
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
    container.style.display = 'grid';

    container.innerHTML = mocksIndex.mockTests.map(mock => `
        <div class="mock-card" data-mock-id="${mock.id}">
            <div class="mock-header">
                <h3>${mock.title}</h3>
                <div class="mock-meta">
                    <span><i class="fas fa-question-circle"></i> ${mock.totalQuestions} questions</span>
                    <span><i class="fas fa-clock"></i> ${mock.timeLimitMinutes} minutes</span>
                    <span><i class="fas fa-check-circle"></i> ${mock.passMarkPercent}% pass mark</span>
                </div>
            </div>
            <div class="mock-body">
                <p class="mock-description">
                    Practice test covering all topics from the Wolverhampton Taxi Driver Handbook.
                </p>
            </div>
            <div class="mock-footer">
                <button class="btn btn-primary" onclick="startMockTest('${mock.id}')">
                    Start Test
                </button>
            </div>
        </div>
    `).join('');
}

function startMockTest(mockId) {
    // Hide mocks grid, show exam container
    document.getElementById('mocksLoading').style.display = 'none';
    document.getElementById('mocksContainer').style.display = 'none';
    document.getElementById('examContainer').style.display = 'block';

    // Load and start the mock test
    loadMockTestDetail(mockId);
}

async function loadMockTestDetail(mockId) {
    try {
        const mockTest = await window.dataLayer.loadMockTest(mockId);
        loadExamQuestions(mockTest);
    } catch (error) {
        console.error('Error loading mock test detail:', error);
        showExamError();
    }
}

function loadExamQuestions(mockTest) {
    const examContainer = document.getElementById('examContainer');

    // Load all questions for this mock test
    const questionPromises = mockTest.questionIds.map(id =>
        window.dataLayer.getQuestionById(id)
    );

    Promise.all(questionPromises)
        .then(questions => {
            // Filter out any null questions (shouldn't happen with valid data)
            const validQuestions = questions.filter(q => q !== null);

            if (validQuestions.length === 0) {
                showExamError('No questions could be loaded for this test.');
                return;
            }

            // Initialize the exam runner
            initExamRunner(validQuestions, mockTest);
        })
        .catch(error => {
            console.error('Error loading exam questions:', error);
            showExamError();
        });
}

function initExamRunner(questions, mockTest) {
    const examContainer = document.getElementById('examContainer');

    // Create exam runner instance
    const examRunner = new window.examRunner.ExamRunner(questions, {
        timeLimitMinutes: mockTest.timeLimitMinutes,
        passMarkPercent: mockTest.passMarkPercent
    });

    examContainer.innerHTML = `
        <div class="exam-runner">
            <!-- Exam Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">${mockTest.title}</h1>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item" id="examTimer">
                            <i class="fas fa-clock"></i>
                            <span class="timer-value" id="timerDisplay">40:00</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Exam Progress -->
            <div class="exam-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="examProgressFill"></div>
                </div>
                <div class="exam-stats">
                    <span>Question <span id="currentQuestion">1</span> of <span id="totalQuestions">${questions.length}</span></span>
                    <span>Score: <span id="examScore">0</span>/<span id="examTotal">${questions.length}</span></span>
                </div>
            </div>

            <!-- Exam Question -->
            <div class="exam-question" id="examQuestionContainer">
                <!-- Question will be injected here -->
            </div>

            <!-- Exam Navigator -->
            <div class="exam-navigator" id="examNavigator">
                <!-- Navigator buttons will be injected here -->
            </div>

            <!-- Exam Actions -->
            <div class="exam-actions">
                <button class="btn btn-secondary" id="prevBtn" onclick="navigateQuestion(-1)">
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <button class="btn btn-primary" id="nextBtn" onclick="navigateQuestion(1)">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
                <button class="btn btn-success" id="submitBtn" style="display: none;" onclick="submitExam()">
                    Submit Exam
                </button>
            </div>
        </div>
    `;

    // Start the exam
    examRunner.start();

    // Load first question
    loadQuestion(examRunner);

    // Initialize navigator
    initNavigator(examRunner);

    // Start timer updates
    startTimerUpdates(examRunner);
}

function loadQuestion(state) {
    const container = document.getElementById('examQuestionContainer');
    const question = state.questions[state.currentIndex];

    // Update progress
    document.getElementById('currentQuestion').textContent = state.currentIndex + 1;
    document.getElementById('examScore').textContent =
        state.answers.filter(a => a !== null).length;

    // Update progress bar
    const progressPercent = ((state.currentIndex + 1) / state.questions.length) * 100;
    document.getElementById('examProgressFill').style.width = progressPercent + '%';

    // Render question
    container.innerHTML = `
        <div class="exam-question-header">
            <div class="question-number">${state.currentIndex + 1}</div>
            <div class="question-type-badge ${question.type}">
                ${question.type === 'single-choice' ? 'Single Choice' :
                 question.type === 'multiple-choice' ? 'Multiple Choice' :
                 question.type === 'true-false' ? 'True/False' : question.type}
            </div>
        </div>

        <div class="question-text">${question.question}</div>

        <div class="options-grid" id="optionsContainer">
            <!-- Options will be injected here -->
        </div>

        <div class="exam-feedback" id="examFeedback" style="display: none;">
            <!-- Feedback will be shown after submission -->
        </div>
    `;

    // Render options
    const optionsContainer = document.getElementById('optionsContainer');
    question.options.forEach((option, index) => {
        const isSelected = state.answers[state.currentIndex] &&
                          state.answers[state.currentIndex].includes(index);

        optionsContainer.innerHTML += `
            <label class="option-label ${isSelected ? 'selected' : ''}"
                   onclick="toggleOption(${index})">
                <div class="option-checkbox">
                    <div class="option-checkbox-inner"></div>
                </div>
                <div class="option-text">${option}</div>
            </label>
        `;
    });
}

function toggleOption(optionIndex) {
    // This would be implemented with proper exam state management
    // For now, placeholder
    console.log(`Toggling option ${optionIndex}`);
}

function navigateQuestion(direction) {
    // This would be implemented with proper exam state management
    // For now, placeholder
    console.log(`Navigating ${direction}`);
}

function initNavigator(state) {
    const navigator = document.getElementById('examNavigator');
    navigator.innerHTML = state.questions.map((_, index) => `
        <button class="nav-button"
                onclick="navigateToQuestion(${index})"
                ${index === state.currentIndex ? 'class="current"' : ''}
                ${state.answers[index] !== null ? 'class="completed"' : ''}>
            ${index + 1}
        </button>
    `).join('');
}

function navigateToQuestion(index) {
    // This would be implemented with proper exam state management
    // For now, placeholder
    console.log(`Navigating to question ${index}`);
}

function startTimer(state) {
    const timerDisplay = document.getElementById('timerDisplay');

    // Update timer every second
    state.timerInterval = setInterval(() => {
        const elapsed = Date.now() - state.startTime;
        const remaining = state.timeLimit - elapsed;

        if (remaining <= 0) {
            clearInterval(state.timerInterval);
            timerDisplay.textContent = '00:00';
            timerDisplay.classList.add('timer-danger');
            autoSubmitExam();
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Add warning classes
        if (remaining <= 60000) { // 1 minute
            timerDisplay.classList.add('timer-danger');
        } else if (remaining <= 300000) { // 5 minutes
            timerDisplay.classList.add('timer-warning');
        }
    }, 1000);
}

function autoSubmitExam() {
    // Auto-submit when time runs out
    document.getElementById('submitBtn').style.display = 'block';
    submitExam();
}

function submitExam() {
    // This would be implemented with proper exam state management
    // For now, placeholder
    console.log('Exam submitted');
    showResults();
}

function showResults() {
    // This would be implemented with proper exam state management
    // For now, placeholder
    console.log('Showing results');
}

function showExamError(message = 'Unable to load exam. Please try again.') {
    const examContainer = document.getElementById('examContainer');
    examContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="empty-title">Exam Error</div>
            <div class="empty-subtitle">${message}</div>
            <button class="btn btn-primary" onclick="window.location.hash = '#exams'">
                Return to Mock Tests
            </button>
        </div>
    `;
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