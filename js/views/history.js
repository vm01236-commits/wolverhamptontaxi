// ============================================================
// HISTORY VIEW - Chronological exam results
//
// Ported from the Life-in-UK app's history page: a clean card list
// with score dots, PASS/FAIL badges and View/Delete actions, all
// styled via the site's theme / colour-scheme / text-size tokens
// driven from Settings.
// ============================================================

import { getHistory } from '../results.js';
import { deleteResult } from '../storage.js';
import { escapeHtml, formatTime, formatDate } from '../utils.js';

export function init(container) {
    renderHistory(container);
    return Promise.resolve();
}

export function renderHistory(container) {
    const history = getHistory();

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2 class="section-title">History</h2>
                <p>No results yet.</p>
                <p class="empty-sub">Complete a practice test to see your history here.</p>
                <a href="#/exams" class="btn btn-primary" style="margin-top:16px">Take a Test</a>
            </div>`;
        return;
    }

    const sorted = [...history]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = `
        <div class="history-header">
            <h2 class="section-title">Exam History</h2>
            <p class="exams-sub">${history.length} result${history.length > 1 ? 's' : ''} recorded</p>
        </div>
        <div class="history-list">
            ${sorted.map(historyCard).join('')}
        </div>
    `;

    // Delete handlers
    container.querySelectorAll('[data-del]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.dataset.del;
            if (confirm('Delete this result?')) {
                deleteResult(id);
                renderHistory(container);
            }
        });
    });
}

function historyCard(r) {
    const isPractice = r.type === 'practice';
    const timePart = (typeof r.timeTakenSec === 'number' && r.timeTakenSec > 0)
        ? ` &bull; ${formatTime(r.timeTakenSec)}`
        : '';

    return `
        <div class="history-item" data-id="${r.id}">
            <div class="history-item-main">
                <div class="history-score-dot ${r.passed ? 'pass' : 'fail'}">${Math.round(r.percent)}%</div>
                <div class="history-info">
                    <span class="history-title">
                        ${escapeHtml(resultTitle(r))}
                        ${isPractice ? '<span class="badge status-in_progress">Practice</span>' : ''}
                    </span>
                    <span class="history-meta">${formatDate(r.timestamp)}${timePart} &bull; ${r.score}/${r.total} correct</span>
                </div>
                <span class="badge ${r.passed ? 'status-pass' : 'status-fail'}">${r.passed ? 'PASS' : 'FAIL'}</span>
            </div>
            <div class="history-actions">
                <a href="#/results?result=${r.id}" class="btn btn-small btn-outline">View</a>
                <button class="btn btn-small btn-danger-history" data-del="${r.id}">Delete</button>
            </div>
        </div>
    `;
}

/**
 * Human-readable title for a history item. New results store an
 * examTitle; legacy wt-history items only have type/category/mockId.
 */
function resultTitle(r) {
    if (r.examTitle) return r.examTitle;
    if (r.type === 'mock') return r.mockId ? `Mock Test ${r.mockId}` : 'Mock Test';
    return r.category || 'Practice Session';
}
