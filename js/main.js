// ============================================================
// MAIN APPLICATION FILE
// ============================================================

import { initRouter } from './router.js';
import { initThemeManager } from './theme-manager.js';
import { initDataLayer } from './data.js';
import { accessibility } from './accessibility.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager (handles light/dark modes and color schemes)
    initThemeManager();

    // Initialize data layer (handles loading and caching of JSON data)
    initDataLayer();

    // Initialize router (handles SPA navigation)
    initRouter();

    // Initialize accessibility enhancements
    accessibility.init();

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Handle mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Close mobile nav when clicking a link
    navLinks.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link') && window.innerWidth <= 640) {
            navLinks.classList.remove('open');
        }
    });
});