// ============================================================
// EXAM RUNNER - Handles exam logic and state management
// ============================================================

/**
 * ExamRunner class manages the state and logic for taking exams
 */
export class ExamRunner {
    /**
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object (timeLimit, passMark, etc.)
     */
    constructor(questions, config = {}) {
        this.questions = questions;
        this.config = {
            timeLimitMinutes: config.timeLimitMinutes || 40,
            passMarkPercent: config.passMarkPercent || 75,
            showExplanations: config.showExplanations !== false,
            instantFeedback: config.instantFeedback !== false,
            ...config
        };

        this.reset();
    }

    /**
     * Reset the exam to initial state
     */
    reset() {
        this.currentIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.startTime = null;
        this.endTime = null;
        this.timeLimitMs = this.config.timeLimitMinutes * 60 * 1000;
        this.timerInterval = null;
        this.isSubmitted = false;
        this.results = null;
    }

    /**
     * Start the exam
     */
    start() {
        this.startTime = Date.now();
        this.startTimer();
    }

    /**
     * Start the timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    /**
     * Update timer display and check for timeout
     */
    updateTimer() {
        // This would update the UI timer display
        // Actual implementation would be in the view layer

        if (this.isTimeUp()) {
            this.autoSubmit();
        }
    }

    /**
     * Check if time is up
     * @returns {boolean}
     */
    isTimeUp() {
        if (!this.startTime) return false;
        const elapsed = Date.now() - this.startTime;
        return elapsed >= this.timeLimitMs;
    }

    /**
     * Get remaining time in seconds
     * @returns {number}
     */
    getRemainingTime() {
        if (!this.startTime) return this.timeLimitMs / 1000;
        const elapsed = Date.now() - this.startTime;
        const remaining = this.timeLimitMs - elapsed;
        return Math.max(0, remaining / 1000);
    }

    /**
     * Get elapsed time in seconds
     * @returns {number}
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        const endTime = this.endTime || Date.now();
        return (endTime - this.startTime) / 1000;
    }

    /**
     * Answer a question
     * @param {number} questionIndex - Index of the question
     * @param {Array|number} optionIndexes - Selected option index(es)
     */
    answerQuestion(questionIndex, optionIndexes) {
        if (questionIndex < 0 || questionIndex >= this.questions.length) {
            throw new Error(`Invalid question index: ${questionIndex}`);
        }

        // Normalize to array
        const normalized = Array.isArray(optionIndexes) ? optionIndexes : [optionIndexes];

        // Validate option indexes
        const question = this.questions[questionIndex];
        const maxOptionIndex = question.options.length - 1;

        for (const index of normalized) {
            if (index < 0 || index > maxOptionIndex) {
                throw new Error(`Invalid option index ${index} for question ${questionIndex}`);
            }
        }

        this.answers[questionIndex] = normalized;

        // If instant feedback is enabled, we could show it here
        // Actual implementation would be in the view layer
    }

    /**
     * Navigate to a specific question
     * @param {number} questionIndex - Index to navigate to
     */
    navigateTo(questionIndex) {
        if (questionIndex < 0 || questionIndex >= this.questions.length) {
            throw new Error(`Invalid question index: ${questionIndex}`);
        }
        this.currentIndex = questionIndex;
    }

    /**
     * Go to previous question
     * @returns {boolean} True if navigated, false if already at first question
     */
    previousQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    /**
     * Go to next question
     * @returns {boolean} True if navigated, false if already at last question
     */
    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    /**
     * Submit the exam
     */
    submit() {
        if (this.isSubmitted) return;

        this.isSubmitted = true;
        this.endTime = Date.now();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.calculateResults();
    }

    /**
     * Auto-submit when time runs out
     */
    autoSubmit() {
        this.submit();
    }

    /**
     * Calculate exam results
     */
    calculateResults() {
        let correctCount = 0;
        const questionResults = [];

        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            const correctAnswer = question.correctIndexes;

            // Check if answer is correct
            let isCorrect = false;
            if (userAnswer !== null && correctAnswer !== null) {
                // For single choice, compare directly
                // For multiple choice, check if arrays match (order doesn't matter)
                if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                    const sortedUser = [...userAnswer].sort((a, b) => a - b);
                    const sortedCorrect = [...correctAnswer].sort((a, b) => a - b);
                    isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
                } else {
                    // Handle case where one is array and other isn't (shouldn't happen with valid data)
                    isCorrect = false;
                }
            }

            if (isCorrect) correctCount++;

            questionResults.push({
                questionIndex: index,
                questionId: question.id,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                explanation: question.explanation
            });
        });

        const totalQuestions = this.questions.length;
        const scorePercent = (correctCount / totalQuestions) * 100;
        const passed = scorePercent >= this.config.passMarkPercent;

        this.results = {
            correctCount,
            totalQuestions,
            scorePercent,
            passed,
            questionResults,
            startTime: this.startTime,
            endTime: this.endTime,
            elapsedTime: this.getElapsedTime()
        };
    }

    /**
     * Get exam results
     * @returns {Object|null} Results object or null if not submitted
     */
    getResults() {
        return this.results;
    }

    /**
     * Get current question
     * @returns {Object} Current question object
     */
    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    /**
     * Get current question index
     * @returns {number}
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * Get total number of questions
     * @returns {number}
     */
    getTotalQuestions() {
        return this.questions.length;
    }

    /**
     * Get user answer for a question
     * @param {number} questionIndex
     * @returns {Array|null} User answer or null if not answered
     */
    getAnswer(questionIndex) {
        return this.answers[questionIndex];
    }

    /**
     * Check if exam is submitted
     * @returns {boolean}
     */
    isSubmitted() {
        return this.isSubmitted;
    }

    /**
     * Get progress percentage
     * @returns {number} Progress percentage (0-100)
     */
    getProgressPercent() {
        return ((this.currentIndex + 1) / this.questions.length) * 100;
    }

    /**
     * Get unanswered questions count
     * @returns {number}
     */
    getUnansweredCount() {
        return this.answers.filter(answer => answer === null).length;
    }
}

/**
 * PracticeRunner class - similar to ExamRunner but for practice sessions
 */
export class PracticeRunner {
    constructor(questions, config = {}) {
        this.questions = questions;
        this.config = {
            showExplanations: config.showExplanations !== false,
            instantFeedback: config.instantFeedback !== false,
            shuffleQuestions: config.shuffleQuestions !== false,
            ...config
        };

        this.reset();
    }

    reset() {
        this.currentIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.startTime = Date.now();
        this.endTime = null;
        this.isSubmitted = false;
        this.results = null;

        // Shuffle questions if configured
        if (this.config.shuffleQuestions) {
            this.questionOrder = [...this.questions.keys()].sort(() => Math.random() - 0.5);
        } else {
            this.questionOrder = [...this.questions.keys()];
        }
    }

    // Similar methods to ExamRunner but without timing logic
    // ... (implementation would be similar but simpler)

    getCurrentQuestion() {
        const questionIndex = this.questionOrder[this.currentIndex];
        return this.questions[questionIndex];
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getTotalQuestions() {
        return this.questions.length;
    }

    answerQuestion(questionIndex, optionIndexes) {
        // Find the actual question index in the original array
        const actualIndex = this.questionOrder.indexOf(questionIndex);
        if (actualIndex === -1) {
            throw new Error(`Invalid question index: ${questionIndex}`);
        }

        const normalized = Array.isArray(optionIndexes) ? optionIndexes : [optionIndexes];
        this.answers[actualIndex] = normalized;
    }

    // ... other methods
}

// Export classes for use in other modules
export const examRunner = {
    ExamRunner,
    PracticeRunner
};