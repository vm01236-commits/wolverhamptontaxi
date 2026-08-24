// ============================================================
// BOOKMARKS VIEW - Saved questions for review
// ============================================================

import { bookmarksModule } from '../bookmarks.js';
import { resultsModule } from '../results.js';

export function init(container) {
    // Load bookmarks view content
    container.innerHTML = `
        <div class="bookmarks-view">
            <!-- Bookmarks Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Bookmarked Questions</h1>
                    <p class="text-muted">
                        Save questions you find challenging for later review and focused study.
                    </p>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item" id="bookmarksCount">
                            <i class="fas fa-bookmark"></i>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Bookmarks Controls -->
            <div class="bookmarks-filters" id="bookmarksFilters">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading filters...</div>
                </div>
            </div>

            <!-- Bookmarks Grid -->
            <div class="bookmarks-grid" id="bookmarksGrid">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading bookmarks...</div>
                </div>
            </div>

            <!-- Bookmarks Actions -->
            <div class="bookmarks-actions" id="bookmarksActions" style="display: none;">
                <button class="btn btn-outline" onclick="clearAllBookmarks()">
                    <i class="fas fa-trash"></i> Clear All
                </button>
                <button class="btn btn-primary" onclick="startBookmarkReview()">
                    <i class="fas fa-play-circle"></i> Review Bookmarks
                </button>
            </div>
        </div>
    `;

    // Load bookmarks data
    loadBookmarksData();

    return Promise.resolve();
}

async function loadBookmarksData() {
    try {
        // Load bookmarks from bookmarks module
        const bookmarks = bookmarksModule.getBookmarks();

        // Load questions data for detailed information
        const questions = await window.dataLayer.loadQuestions();

        // Render filters
        renderBookmarksFilters(questions);

        // Render bookmarks grid
        renderBookmarksGrid(bookmarks, questions);

        // Update count
        updateBookmarksCount(bookmarks);

        // Show actions if we have bookmarks
        if (bookmarks.length > 0) {
            document.getElementById('bookmarksActions').style.display = 'flex';
        }

    } catch (error) {
        console.error('Error loading bookmarks data:', error);
        showErrorMessage();
    }
}

function renderBookmarksFilters(questions) {
    const filtersContainer = document.getElementById('bookmarksFilters');

    // Get unique categories from questions
    const categories = [...new Set(questions.map(q => q.category.trim()))].sort();

    filtersContainer.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="bookmarksCategoryFilter">Category</label>
            <select class="form-select" id="bookmarksCategoryFilter">
                <option value="all">All Categories</option>
                ${categories.map(category => `
                    <option value="${category}">${category}</option>
                `).join('')}
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="bookmarksDifficultyFilter">Difficulty</label>
            <select class="form-select" id="bookmarksDifficultyFilter">
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
        </div>

        <button class="btn btn-secondary" onclick="applyBookmarksFilters()">
            Apply Filters
        </button>
        <button class="btn btn-outline" onclick="resetBookmarksFilters()">
            Reset
        </button>
    `;
}

function renderBookmarksGrid(bookmarks, questions) {
    const gridContainer = document.getElementById('bookmarksGrid');

    if (bookmarks.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-bookmark"></i>
                </div>
                <div class="empty-title">No Bookmarks Yet</div>
                <div class="empty-subtitle">
                    You haven't bookmarked any questions yet. Bookmark questions during practice or mock tests to save them for later review.
                </div>
            </div>
        `;
        return;
    }

    // Create a map of questions for quick lookup
    const questionsMap = {};
    questions.forEach(q => {
        questionsMap[q.id] = q;
    });

    // Filter bookmarks based on current filters (would be implemented fully)
    const filteredBookmarks = bookmarks; // TODO: implement actual filtering

    gridContainer.innerHTML = filteredBookmarks.map(bookmarkId => {
        const question = questionsMap[bookmarkId];
        if (!question) return ''; // Skip if question not found

        return `
            <div class="bookmark-card">
                <h4>${question.question.substring(0, 60)}${question.question.length > 60 ? '...' : ''}</h4>
                <p>${question.category}</p>
                <div class="bookmark-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewBookmarkQuestion('${bookmarkId}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="removeBookmark('${bookmarkId}')">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateBookmarksCount(bookmarks) {
    const countEl = document.getElementById('bookmarksCount');
    countEl.textContent = bookmarks.length;
}

function applyBookmarksFilters() {
    // This would implement actual filtering logic
    // For now, just show a placeholder
    alert('Filter functionality would be implemented here');
}

function resetBookmarksFilters() {
    // Reset filter dropdowns
    document.getElementById('bookmarksCategoryFilter').value = 'all';
    document.getElementById('bookmarksDifficultyFilter').value = 'all';

    // Re-render bookmarks with no filters
    loadBookmarksData();
}

function viewBookmarkQuestion(questionId) {
    // This would show the full question with options
    alert(`Viewing bookmarked question: ${questionId}`);
}

async function removeBookmark(questionId) {
    if (await confirm('Remove this question from bookmarks?')) {
        const success = bookmarksModule.removeBookmark(questionId);
        if (success) {
            // Re-render bookmarks
            loadBookmarksData();
        } else {
            alert('Failed to remove bookmark');
        }
    }
}

async function clearAllBookmarks() {
    if (await confirm('Are you sure you want to remove all bookmarks?')) {
        // Clear bookmarks
        bookmarksModule.clearBookmarks();

        // Re-render bookmarks
        loadBookmarksData();
    }
}

function startBookmarkReview() {
    // This would start a practice session with only bookmarked questions
    alert('Bookmark review feature would start a practice session with your bookmarked questions');
}

function showErrorMessage() {
    const container = document.querySelector('.bookmarks-view');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-title">Error Loading Bookmarks</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading your bookmarks. Please try again later.
            </div>
        </div>
    `;
}
// Expose inline-onclick handlers to the global scope (module functions are
// not otherwise reachable from onclick="...").
window.clearAllBookmarks = clearAllBookmarks;
window.startBookmarkReview = startBookmarkReview;
window.applyBookmarksFilters = applyBookmarksFilters;
window.resetBookmarksFilters = resetBookmarksFilters;
window.viewBookmarkQuestion = viewBookmarkQuestion;
window.removeBookmark = removeBookmark;