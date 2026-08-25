// ============================================================
// THEME MANAGER - Handles light/dark/system modes, color schemes,
// text-size scaling and toasts.
//
// Ported from the Life-in-UK app (FIX #2 + FIX #5):
//   - Themes: 'light' | 'dark' | 'system' (follows the OS setting live)
//   - Schemes: default | warm | cool | contrast | mono (each works in
//     both light and dark mode)
//   - Text size: --font-scale percentage applied to <html>
//
// The initial theme is applied by an inline bootstrap in index.html
// <head> so the page never flashes the wrong colours. This module owns
// everything after that: the toggle, the system preference listener,
// persistence and toasts.
// ============================================================

import { getPrefs, savePrefs } from './storage.js';

export const THEMES = ['light', 'dark', 'system'];

export const SCHEMES = [
    {
        id: 'default',
        name: 'Default',
        description: 'Standard blue and red. Suits most people.',
        swatches: ['#1e3a8a', '#c8102e', '#16a34a', '#f6f7fb'],
    },
    {
        id: 'warm',
        name: 'Warm',
        description: 'Orange and brown tones. Reduces blue light for evening study.',
        swatches: ['#7c2d12', '#c2410c', '#4d7c0f', '#fdf6ec'],
    },
    {
        id: 'cool',
        name: 'Cool',
        description: 'Blues and cyans. Lower glare for bright daytime rooms.',
        swatches: ['#0c4a6e', '#0e7490', '#0d9488', '#f0f7fb'],
    },
    {
        id: 'contrast',
        name: 'High Contrast',
        description: 'Maximum contrast with solid borders. Meets WCAG AAA.',
        swatches: ['#000000', '#a80000', '#006622', '#ffffff'],
    },
    {
        id: 'mono',
        name: 'Monochrome',
        description: 'Greyscale only. For colour blindness and light sensitivity.',
        swatches: ['#1c1c1c', '#5a5a5a', '#9a9a9a', '#f4f4f4'],
    },
];

const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

/** The theme actually rendered, resolving 'system'. */
export function effectiveTheme(pref = getPrefs().theme) {
    if (pref === 'dark' || pref === 'light') return pref;
    return media && media.matches ? 'dark' : 'light';
}

/** Apply prefs to <html>. Safe to call repeatedly. */
export function applyTheme(optionsOrLegacyTheme = {}) {
    // Legacy signature: applyTheme('dark') — persist and switch.
    if (typeof optionsOrLegacyTheme === 'string') {
        return setTheme(optionsOrLegacyTheme);
    }

    const opts = optionsOrLegacyTheme || {};
    const prefs = getPrefs();
    const root = document.documentElement;
    const theme = effectiveTheme(prefs.theme);

    if (opts.animate) {
        root.classList.add('theme-switching');
        window.setTimeout(() => root.classList.remove('theme-switching'), 350);
    }

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-scheme', prefs.scheme);
    root.style.setProperty('--font-scale', `${prefs.fontScale}%`);

    updateToggleUI(theme, prefs.theme);
    return theme;
}

export function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    savePrefs({ theme });
    applyTheme({ animate: true });
}

export function setScheme(scheme) {
    if (!SCHEMES.some((s) => s.id === scheme)) return;
    savePrefs({ scheme });
    applyTheme({ animate: true });
}

export function setFontScale(scale) {
    const value = Number(scale);
    if (!Number.isFinite(value) || value < 75 || value > 150) return;
    savePrefs({ fontScale: value });
    applyTheme();
}

/** Cycle light → dark → light. Explicitly leaves 'system' once used. */
export function toggleTheme() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    toast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
    return next;
}

/** Reflect the current theme on every header toggle (icon + ARIA state). */
function updateToggleUI(theme, preference) {
    document.querySelectorAll('#themeToggle, .theme-toggle').forEach((btn) => {
        const isDark = theme === 'dark';
        const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

        btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title',
            preference === 'system' ? `${label} (following system)` : label);
        btn.setAttribute('aria-pressed', String(isDark));
    });
}

/* ------------------------------------------------------------
   Toast
   ------------------------------------------------------------ */
let toastTimer = null;

export function toast(message) {
    let el = document.getElementById('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
    }

    el.textContent = message;
    el.classList.add('show');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('show'), 3000);
}

/* ------------------------------------------------------------
   Init
   ------------------------------------------------------------ */
export function initTheme() {
    applyTheme();

    document.querySelectorAll('#themeToggle, .theme-toggle').forEach((btn) => {
        // Guard against double-binding if init ever runs twice
        if (btn.dataset.themeToggleBound) return;
        btn.dataset.themeToggleBound = '1';
        btn.addEventListener('click', toggleTheme);
    });

    // Follow the OS setting live, but only while the user is on 'system'.
    if (media) {
        const onChange = () => {
            if (getPrefs().theme === 'system') applyTheme({ animate: true });
        };
        if (media.addEventListener) media.addEventListener('change', onChange);
        else if (media.addListener) media.addListener(onChange); // older Safari
    }

    // Keep multiple open tabs in sync.
    window.addEventListener('storage', (e) => {
        if (e.key === 'wt-prefs') applyTheme({ animate: true });
    });
}

// Backwards-compatible aliases — other modules import these names.
export const initThemeManager = initTheme;

// Shared handle used by views (e.g. settings) that import the theme manager.
export const themeManager = {
    applyTheme,
    applyScheme: setScheme,
    setTheme,
    setScheme,
    setFontScale,
    toggleTheme,
    effectiveTheme,
    toast,
    SCHEMES,
    THEMES,
    initThemeManager,
};