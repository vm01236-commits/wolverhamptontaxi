// ============================================================
// THEME MANAGER - Handles light/dark modes and color schemes
// ============================================================

export function initThemeManager() {
    const htmlElement = document.documentElement;

    // Load saved preferences
    const savedTheme = localStorage.getItem('wt-theme') || 'light';
    const savedScheme = localStorage.getItem('wt-scheme') || 'default';

    // Apply saved preferences
    htmlElement.setAttribute('data-theme', savedTheme);
    htmlElement.setAttribute('data-scheme', savedScheme);

    // Set up theme toggle listeners (if any UI elements exist)
    setupThemeToggles();

    // Set up global access for views to use
    window.themeManager = {
        applyTheme,
        applyScheme
    };
}

function setupThemeToggles() {
    // Theme toggle buttons (light/dark)
    const themeToggles = document.querySelectorAll('[data-theme-toggle]');
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const newTheme = toggle.getAttribute('data-theme-toggle');
            applyTheme(newTheme);
        });
    });

    // Scheme toggle buttons (color schemes)
    const schemeToggles = document.querySelectorAll('[data-scheme-toggle]');
    schemeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const newScheme = toggle.getAttribute('data-scheme-toggle');
            applyScheme(newScheme);
        });
    });
}

export function applyTheme(theme) {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('wt-theme', theme);
}

export function applyScheme(scheme) {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-scheme', scheme);
    localStorage.setItem('wt-scheme', scheme);
}