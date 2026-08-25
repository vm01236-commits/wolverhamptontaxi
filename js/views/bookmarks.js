// ============================================================
// BOOKMARKS VIEW - Saved questions for review
//
// Ported from the Life-in-UK app's bookmark page: bookmarked
// questions are grouped by category and shown as full cards with a
// question-type badge, the correct options highlighted, an
// explanation block and a star Remove button. Styled entirely with
// the site's theme / colour-scheme / text-size tokens from Settings.
// ============================================================

import { bookmarksModule } from '../bookmarks.js';
import { escapeHtml } from '../utils.js';

export function init(container) {
    return renderBookmarks(container);
}

async function renderBookmarks(container) {
    const bookmarks = bookmarksModule.getBookmarks();

    if (bookmarks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2 class="section-title">Bookmarks</h2>
                <p>No bookmarks yet.</p>
                <p class="empty-sub">Bookmark questions during an exam to save them here for quick review.</p>
                <a href="#/exams" class="btn btn-primary" style="margin-top:16px">Take a Test</a>
            </div>`;
        return;
    }

    let questions;
    try {
        questions = await window.dataLayer.loadQuestions();
    } catch (error) {
        console.error('Error loading bookmarks data:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h2 class="section-title">Bookmarks</h2>
                <p>Could not load your bookmarks.</p>
                <p class="empty-sub">Please try again later.</p>
            </div>`;
        return;
    }

    // Resolve each stored question id against the question bank,
    // skipping ids that no longer exist in the data.
    const byId = new Map(questions.map((q) => [String(q.id), q]));
    const saved = bookmarks
        .map((id) => byId.get(String(id)))
        .filter((q) => q !== undefined);

    // Group bookmarks by category, mirroring the reference app's
    // "group by exam" layout with a count pill beside the title.
    const grouped = {};
    saved.forEach((q) => {
        const category = q.category || 'General';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(q);
    });

    container.innerHTML = `
        <div class="bookmarks-header">
            <h2 class="section-title">Bookmarks</h2>
            <p class="exams-sub">${saved.length} saved question${saved.length > 1 ? 's' : ''}</p>
        </div>
        ${Object.entries(grouped).map(([category, list]) => `
            <div class="bookmark-group">
                <h3 class="bookmark-group-title">
                    ${escapeHtml(category)}
                    <span class="bookmark-group-count">${list.length}</span>
                </h3>
                <div class="bookmark-list">
                    ${list.map(bookmarkCard).join('')}
                </div>
            </div>`).join('')}
    `;

    // Remove handlers - the star button re-renders after removal.
    container.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
            bookmarksModule.removeBookmark(btn.dataset.remove);
            renderBookmarks(container);
        });
    });
}

function bookmarkCard(q) {
    const correctIndexes = (q.correctIndexes || []).map(Number);

    let optionsHtml = '';
    if (Array.isArray(q.options) && q.options.length) {
        optionsHtml = `<div class="bookmark-options">` + q.options.map((opt, idx) => {
            const isCorrect = correctIndexes.includes(idx);
            return `
                <div class="bookmark-option${isCorrect ? ' correct' : ''}">
                    <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                    ${escapeHtml(opt)}
                </div>`;
        }).join('') + `</div>`;
    }

    return `
        <div class="bookmark-card">
            <div class="bookmark-card-top">
                <span class="question-type-badge ${typeClass(q.type)}">${typeLabel(q.type)}</span>
                <button class="bookmark-remove" type="button" data-remove="${q.id}"><i class="fas fa-star"></i> Remove</button>
            </div>
            <p class="bookmark-question">${escapeHtml(q.question)}</p>
            ${optionsHtml}
            ${q.explanation ? `<div class="bookmark-explanation"><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</div>` : ''}
        </div>`;
}

function typeLabel(type) {
    switch (type) {
        case 'multiple': return 'Multiple Choice';
        case 'boolean': return 'True / False';
        default: return 'Single Choice';
    }
}

function typeClass(type) {
    switch (type) {
        case 'multiple': return 'multiple-choice';
        case 'boolean': return 'true-false';
        default: return 'single-choice';
    }
}
