// ============================================================
// DATA LAYER - Handles loading and caching of JSON data
// ============================================================

// Cache for loaded data
const dataCache = {
    questions: null,
    mockTests: null,
    applicationGuide: null,
    faqs: null,
    index: {
        questions: null,
        mocks: null,
        guide: null
    }
};

// Flags to track loading state
const loadingState = {
    questions: false,
    mockTests: false,
    applicationGuide: false,
    faqs: false
};

// Promises for ongoing loads
const loadPromises = {
    questions: null,
    mockTests: null,
    applicationGuide: null,
    faqs: null
};

/**
 * Load questions data from JSON file
 * @returns {Promise<Array>} Promise that resolves with questions array
 */
export function loadQuestions() {
    // Return cached data if available
    if (dataCache.questions !== null) {
        return Promise.resolve(dataCache.questions);
    }

    // Return existing promise if already loading
    if (loadPromises.questions !== null) {
        return loadPromises.questions;
    }

    // Mark as loading
    loadingState.questions = true;

    // Create promise for loading
    loadPromises.questions = fetch('data/questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Cache the data
            dataCache.questions = data;
            loadingState.questions = false;
            return data;
        })
        .catch(error => {
            loadingState.questions = false;
            loadPromises.questions = null;
            console.error('Error loading questions:', error);
            throw error;
        });

    return loadPromises.questions;
}

/**
 * Load mock tests index from JSON file
 * @returns {Promise<Object>} Promise that resolves with mock tests index
 */
export function loadMockTestsIndex() {
    // Return cached data if available
    if (dataCache.mockTests !== null) {
        return Promise.resolve(dataCache.mockTests);
    }

    // Return existing promise if already loading
    if (loadPromises.mockTests !== null) {
        return loadPromises.mockTests;
    }

    // Mark as loading
    loadingState.mockTests = true;

    // Create promise for loading
    loadPromises.mockTests = fetch('data/mocks/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load mock tests index: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Cache the data
            dataCache.mockTests = data;
            loadingState.mockTests = false;
            return data;
        })
        .catch(error => {
            loadingState.mockTests = false;
            loadPromises.mockTests = null;
            console.error('Error loading mock tests index:', error);
            throw error;
        });

    return loadPromises.mockTests;
}

/**
 * Load a specific mock test by ID
 * @param {string} mockId - The ID of the mock test to load (e.g., "mock-1")
 * @returns {Promise<Object>} Promise that resolves with mock test data
 */
export function loadMockTest(mockId) {
    return fetch(`data/mocks/${mockId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load mock test ${mockId}: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`Error loading mock test ${mockId}:`, error);
            throw error;
        });
}

/**
 * Load application guide from JSON file
 * @returns {Promise<Object>} Promise that resolves with application guide data
 */
export function loadApplicationGuide() {
    // Return cached data if available
    if (dataCache.applicationGuide !== null) {
        return Promise.resolve(dataCache.applicationGuide);
    }

    // Return existing promise if already loading
    if (loadPromises.applicationGuide !== null) {
        return loadPromises.applicationGuide;
    }

    // Mark as loading
    loadingState.applicationGuide = true;

    // Create promise for loading
    loadPromises.applicationGuide = fetch('data/guide.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load application guide: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Cache the data
            dataCache.applicationGuide = data;
            loadingState.applicationGuide = false;
            return data;
        })
        .catch(error => {
            loadingState.applicationGuide = false;
            loadPromises.applicationGuide = null;
            console.error('Error loading application guide:', error);
            throw error;
        });

    return loadPromises.applicationGuide;
}

/**
 * Load FAQs from JSON file
 * @returns {Promise<Array>} Promise that resolves with FAQs array
 */
export function loadFAQs() {
    // Return cached data if available
    if (dataCache.faqs !== null) {
        return Promise.resolve(dataCache.faqs);
    }

    // Return existing promise if already loading
    if (loadPromises.faqs !== null) {
        return loadPromises.faqs;
    }

    // Mark as loading
    loadingState.faqs = true;

    // Create promise for loading
    loadPromises.faqs = fetch('data/faqs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load FAQs: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Cache the data
            dataCache.faqs = data;
            loadingState.faqs = false;
            return data;
        })
        .catch(error => {
            loadingState.faqs = false;
            loadPromises.faqs = null;
            console.error('Error loading FAQs:', error);
            throw error;
        });

    return loadPromises.faqs;
}

/**
 * Get a specific question by ID
 * @param {string} questionId - The ID of the question to find
 * @returns {Promise<Object|null>} Promise that resolves with question object or null if not found
 */
export function getQuestionById(questionId) {
    return loadQuestions().then(questions => {
        return questions.find(q => q.id === questionId) || null;
    });
}

/**
 * Get questions by category
 * @param {string} category - The category to filter by
 * @returns {Promise<Array>} Promise that resolves with array of questions in the category
 */
export function getQuestionsByCategory(category) {
    return loadQuestions().then(questions => {
        return questions.filter(q =>
            q.category.trim().toLowerCase() === category.trim().toLowerCase()
        );
    });
}

/**
 * Get all unique categories
 * @returns {Promise<Array>} Promise that resolves with array of unique categories
 */
export function getAllCategories() {
    return loadQuestions().then(questions => {
        // Extract unique categories
        const categories = [...new Set(questions.map(q => q.category.trim()))];
        return categories.sort();
    });
}

/**
 * Clear all cached data
 */
export function clearCache() {
    dataCache.questions = null;
    dataCache.mockTests = null;
    dataCache.applicationGuide = null;
    dataCache.faqs = null;

    loadingState.questions = false;
    loadingState.mockTests = false;
    loadingState.applicationGuide = false;
    loadingState.faqs = false;

    loadPromises.questions = null;
    loadPromises.mockTests = null;
    loadPromises.applicationGuide = null;
    loadPromises.faqs = null;
}

// Create the data layer object
const dataLayer = {
    loadQuestions,
    loadMockTestsIndex,
    loadMockTest,
    loadApplicationGuide,
    loadFAQs,
    getQuestionById,
    getQuestionsByCategory,
    getAllCategories,
    clearCache
};

// Initialization function to set up global access
export function initDataLayer() {
    // Set up global access for views to use
    window.dataLayer = dataLayer;
}

// Export utility functions for use in other modules
export { dataLayer, initDataLayer };