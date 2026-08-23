// ============================================================
// ROUTER - Handles SPA navigation
// ============================================================

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

    function handleLocationChange() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        loadView(hash);
        updateActiveLink(hash);
    }

    function updateActiveLink(activeView) {
        navLinks.forEach(link => {
            const view = link.getAttribute('data-view');
            if (view === activeView) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async function loadView(viewName) {
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
                default:
                    viewModule = await import('./views/dashboard.js');
            }

            // Initialize the view
            if (viewModule && viewModule.init) {
                await viewModule.init(viewContainer);
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