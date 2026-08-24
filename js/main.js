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

    // Install a synchronous-style Promise confirm dialog (replaces the
    // non-existent browser `confirm` so delete/reset actions work)
    window.confirm = async (message) => new Promise((resolve) => {
        const backdrop = document.getElementById('backdrop');
        if (backdrop) backdrop.classList.add('open');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">Confirm</h3>
                <button type="button" class="modal-close" data-confirm-cancel aria-label="Cancel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin:0; line-height:1.6; color:var(--text);">${String(message).replace(/</g, '&lt;')}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-confirm-cancel>Cancel</button>
                <button type="button" class="btn btn-primary" data-confirm-ok>OK</button>
            </div>
        `;

        const close = (value) => {
            if (backdrop) backdrop.classList.remove('open');
            modal.remove();
            document.removeEventListener('keydown', onKey);
            resolve(value);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close(false);
        };

        modal.querySelector('[data-confirm-ok]').addEventListener('click', () => close(true));
        modal.querySelectorAll('[data-confirm-cancel]').forEach(btn => {
            btn.addEventListener('click', () => close(false));
        });
        document.addEventListener('keydown', onKey);

        if (backdrop) {
            backdrop.addEventListener('click', () => close(false), { once: true });
            backdrop.appendChild(modal);
        } else {
            document.body.appendChild(modal);
        }

        const okBtn = modal.querySelector('[data-confirm-ok]');
        if (okBtn) setTimeout(() => okBtn.focus(), 50);
    });

    // Handle mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Close mobile nav when clicking a link
    if (navLinks) {
        navLinks.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link') && window.innerWidth <= 640) {
                navLinks.classList.remove('open');
            }
        });
    }
});