// ============================================================
// ROUTER - Handles SPA navigation
//
// Routes are plain view names (#exams) or parameterised routes
// (#/exam-runner?mock=mock-1). The leading "/" and the query
// string are stripped before dispatching to the right view.
// ============================================================

import { renderExamRunner, teardownExamRunner } from './examRunner.js';

// Views that map to a nav link (used for active-link highlighting
// and to decide whether an unknown hash might be an in-page anchor).
const KNOWN_VIEWS = new Set([
    'dashboard', 'exams', 'practice', 'history',
    'bookmarks', 'settings', 'guide', 'exam-runner', 'results',
]);

// Parameterised routes highlight a parent nav item instead.
const ACTIVE_LINK_MAP = {
    'exam-runner': 'exams',
    'results': 'history',
};

export function initRouter() {
    const viewContainer = document.getElementById('viewContainer');
    const navLinks = document.querySelectorAll('.nav-link');

    // Handle initial route
    handleLocationChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleLocationChange);

    // Handle nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent default if it's a hash link
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    window.location.hash = view;
                    updateActiveLink(view);
                }
            }
        });
    });

    /**
     * Split the current hash into a route name and its query params.
     * "#", "#/x" and "#x" are all accepted.
     */
    function parseHash() {
        const raw = window.location.hash.replace(/^#\/?/, '');
        if (!raw) return { route: '', query: '' };
        const qIndex = raw.indexOf('?');
        if (qIndex === -1) return { route: raw, query: '' };
        return { route: raw.substring(0, qIndex), query: raw.substring(qIndex + 1) };
    }

    function handleLocationChange() {
        const { route, query } = parseHash();

        if (!route) {
            loadView('dashboard');
            updateActiveLink('dashboard');
            return;
        }

        // If the hash matches an element already on the page (e.g. a guide
        // section anchor like #section-0), scroll to it instead of routing.
        // Never treat parameterised or known-view hashes as anchors.
        if (!query && !KNOWN_VIEWS.has(route)) {
            const anchor = document.getElementById(route);
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }

        loadView(route, query);
        updateActiveLink(route);
    }

    function updateActiveLink(activeView) {
        const target = ACTIVE_LINK_MAP[activeView] || activeView;
        navLinks.forEach(link => {
            const view = link.getAttribute('data-view');
            if (view === target) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async function loadView(viewName, query = '') {
        // Leaving the exam runner? Stop its timers/listeners first.
        if (viewName !== 'exam-runner') {
            teardownExamRunner();
        }

        // Show loading state
        viewContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading ${viewName}...</div>
            </div>
        `;

        try {
            // Import the view module dynamically
            let viewModule;

            switch (viewName) {
                case 'dashboard':
                    viewModule = await import('./views/dashboard.js');
                    break;
                case 'exams':
                    viewModule = await import('./views/exams.js');
                    break;
                case 'practice':
                    viewModule = await import('./views/practice.js');
                    break;
                case 'history':
                    viewModule = await import('./views/history.js');
                    break;
                case 'bookmarks':
                    viewModule = await import('./views/bookmarks.js');
                    break;
                case 'settings':
                    viewModule = await import('./views/settings.js');
                    break;
                case 'guide':
                    viewModule = await import('./views/guide.js');
                    break;
                case 'results':
                    viewModule = await import('./views/results.js');
                    break;
                case 'exam-runner':
                    // The exam runner renders itself into a dedicated
                    // container driven by the examRunner module.
                    viewContainer.innerHTML = '<div id="view-exam-runner"></div>';
                    await renderExamRunner(new URLSearchParams(query));
                    return;
                default:
                    viewModule = await import('./views/dashboard.js');
            }

            // Initialize the view (query passed through for views that
            // need URL params, e.g. #/results?result=<id>)
            if (viewModule && viewModule.init) {
                await viewModule.init(viewContainer, query);
            } else {
                // Fallback if no init function
                viewContainer.innerHTML = `<div class="error">View module not properly initialized</div>`;
            }
        } catch (error) {
            console.error('Error loading view:', error);
            viewContainer.innerHTML = `
                <div class="error">
                    <h2>Error Loading View</h2>
                    <p>We're sorry, but something went wrong loading this view.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>
                </div>
            `;
        }
    }
}