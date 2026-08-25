// ============================================================
// SETTINGS VIEW - Application settings and preferences
//
// The Appearance / Colour Scheme / Text Size sections are ported
// from the Life-in-UK app (FIX #2 + FIX #5): a segmented theme
// picker (Light/Dark/System), colour-scheme cards with swatches
// and a font-scale display-type control with a live preview.
// ============================================================

import { getPrefs } from '../storage.js';
import {
    SCHEMES, THEMES, setTheme, setScheme, setFontScale,
    effectiveTheme, applyTheme, toast,
} from '../theme-manager.js';

const FONT_SCALES = [
    { value: 90, label: 'Small' },
    { value: 100, label: 'Default' },
    { value: 112, label: 'Large' },
    { value: 125, label: 'Extra Large' },
];

function themeNote(pref) {
    if (pref === 'system') {
        return `Following your device setting — currently ${effectiveTheme()}.`;
    }
    return `Always ${pref}, regardless of your device setting.`;
}

function schemeCard(scheme, selected) {
    return `
        <button class="scheme-card ${selected ? 'selected' : ''}" type="button" role="radio"
                data-scheme-option="${scheme.id}" aria-checked="${selected}">
            <span class="scheme-swatches" aria-hidden="true">
                ${scheme.swatches.map((c) => `<span class="scheme-swatch" style="background:${c}"></span>`).join('')}
            </span>
            <span class="scheme-name">
                ${scheme.name}
                ${selected ? '<span class="scheme-check" aria-hidden="true">✓</span>' : ''}
            </span>
            <span class="scheme-desc">${scheme.description}</span>
        </button>`;
}

export function init(container) {
    // Load settings view content
    const prefs = getPrefs();

    container.innerHTML = `
        <div class="settings-view">
            <!-- Settings Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Settings</h1>
                    <p class="text-muted">
                        Make the site comfortable to read and study in.
                    </p>
                </div>
                <div class="exam-header-right">
                    <!-- Settings actions will go here -->
                </div>
            </header>

            <!-- Appearance -->
            <section class="settings-section" aria-labelledby="setting-theme">
                <h3 class="settings-title" id="setting-theme">Appearance</h3>
                <p class="settings-help">Dark mode reduces glare when studying in low light.</p>
                <div class="segmented" role="radiogroup" aria-labelledby="setting-theme">
                    ${[
                        { id: 'light', label: '☀️ Light' },
                        { id: 'dark', label: '🌙 Dark' },
                        { id: 'system', label: '💻 System' },
                    ].map((t) => `
                        <button class="segment ${prefs.theme === t.id ? 'active' : ''}"
                                type="button" role="radio" data-theme-option="${t.id}"
                                aria-checked="${prefs.theme === t.id}">${t.label}</button>`).join('')}
                </div>
                <p class="settings-note" id="themeNote">${themeNote(prefs.theme)}</p>
            </section>

            <!-- Colour Scheme -->
            <section class="settings-section" aria-labelledby="setting-scheme">
                <h3 class="settings-title" id="setting-scheme">Colour Scheme</h3>
                <p class="settings-help">
                    Each scheme works in both light and dark mode. Status is always
                    shown with a label or icon as well as colour.
                </p>
                <div class="scheme-grid" role="radiogroup" aria-labelledby="setting-scheme">
                    ${SCHEMES.map((s) => schemeCard(s, prefs.scheme === s.id)).join('')}
                </div>
            </section>

            <!-- Text Size (display type) -->
            <section class="settings-section" aria-labelledby="setting-font">
                <h3 class="settings-title" id="setting-font">Text Size</h3>
                <p class="settings-help">Scales body text across the whole site.</p>
                <div class="segmented" role="radiogroup" aria-labelledby="setting-font">
                    ${FONT_SCALES.map((f) => `
                        <button class="segment ${prefs.fontScale === f.value ? 'active' : ''}"
                                type="button" role="radio" data-font-option="${f.value}"
                                aria-checked="${prefs.fontScale === f.value}">${f.label}</button>`).join('')}
                </div>
                <p class="settings-preview" id="fontPreview">
                    The quick brown fox jumps over the lazy dog while you revise for your test.
                </p>
            </section>

            <section class="settings-section">
                <h3 class="section-title">Practice Settings</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <span>Questions per Session</span>
                        <span class="setting-value" id="questionsPerSession">10</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" id="shuffleQuestionsToggle">
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Shuffle Questions</span>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" id="showExplanationsToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Show Explanations</span>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" id="instantFeedbackToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Instant Feedback</span>
                </div>
            </section>

            <section class="settings-section">
                <h3 class="section-title">Mock Test Settings</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <span>Timer Warnings</span>
                        <span class="setting-value" id="timerWarnings">5 min, 1 min</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" id="autoSubmitToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Auto Submit on Time Out</span>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" id="reviewIncorrectToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Review Incorrect Answers</span>
                </div>
            </section>

            <section class="settings-section">
                <h3 class="section-title">Data & Privacy</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <span>Data Usage</span>
                        <span class="setting-value">All data stored locally</span>
                    </div>
                </div>
                <div class="setting-item">
                    <button class="btn btn-outline" onclick="exportData()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
                <div class="setting-item">
                    <button class="btn btn-outline" onclick="importData()">
                        <i class="fas fa-upload"></i> Import Data
                    </button>
                </div>
                <div class="setting-item">
                    <button class="btn btn-error" onclick="clearAllData()">
                        <i class="fas fa-trash"></i> Clear All Data
                    </button>
                </div>
            </section>

            <!-- Reset to Defaults Button -->
            <div class="settings-section">
                <button class="btn btn-warning" onclick="resetToDefaults()">
                    <i class="fas fa-undo"></i> Reset All Settings to Defaults
                </button>
            </div>
        </div>
    `;

    // Load current settings
    loadSettings();

    return Promise.resolve();
}

function loadSettings() {
    // ---- Theme (segmented Light / Dark / System) ----
    document.querySelectorAll('[data-theme-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.themeOption;
            setTheme(value);
            syncThemeControls(value);
            toast(`Appearance set to ${value}`);
        });
    });

    // ---- Colour scheme cards ----
    document.querySelectorAll('[data-scheme-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.schemeOption;
            setScheme(value);
            syncSchemeControls(value);
            const scheme = SCHEMES.find((s) => s.id === value);
            toast(`🎨 Scheme changed to ${scheme ? scheme.name : value}`);
        });
    });

    // ---- Text size (display type) ----
    document.querySelectorAll('[data-font-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const value = Number(btn.dataset.fontOption);
            setFontScale(value);
            syncFontControls(value);
            const label = (FONT_SCALES.find((f) => f.value === value) || {}).label;
            toast(`Text size: ${label || value + '%'}`);
        });
    });

    // Practice & mock test settings
    setupSettingsListeners();
}

/** Reflect the chosen theme preference on the segmented control + note. */
function syncThemeControls(pref) {
    document.querySelectorAll('[data-theme-option]').forEach((b) => {
        const on = b.dataset.themeOption === pref;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', String(on));
    });
    const note = document.getElementById('themeNote');
    if (note) note.textContent = themeNote(pref);
}

/** Reflect the chosen scheme on the cards (border tint + ✓ badge). */
function syncSchemeControls(schemeId) {
    document.querySelectorAll('[data-scheme-option]').forEach((b) => {
        const on = b.dataset.schemeOption === schemeId;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', String(on));
        const name = b.querySelector('.scheme-name');
        const check = b.querySelector('.scheme-check');
        if (on && !check && name) {
            name.insertAdjacentHTML('beforeend',
                '<span class="scheme-check" aria-hidden="true">✓</span>');
        } else if (!on && check) {
            check.remove();
        }
    });
}

/** Reflect the chosen font scale on the segmented control. */
function syncFontControls(value) {
    document.querySelectorAll('[data-font-option]').forEach((b) => {
        const on = Number(b.dataset.fontOption) === value;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', String(on));
    });
}

function setupSettingsListeners() {
    // Practice settings
    document.getElementById('questionsPerSession').addEventListener('click', () => {
        const newValue = prompt('Enter number of questions per practice session (5-50):',
                               document.getElementById('questionsPerSession').textContent);
        if (newValue !== null) {
            const num = parseInt(newValue);
            if (!isNaN(num) && num >= 5 && num <= 50) {
                localStorage.setItem('wt-questionsPerSession', num);
                document.getElementById('questionsPerSession').textContent = num;
            } else {
                alert('Please enter a number between 5 and 50');
            }
        }
    });

    document.getElementById('shuffleQuestionsToggle').addEventListener('change', (e) => {
        localStorage.setItem('wt-shuffleQuestions', e.target.checked);
    });

    document.getElementById('showExplanationsToggle').addEventListener('change', (e) => {
        localStorage.setItem('wt-showExplanations', e.target.checked);
    });

    document.getElementById('instantFeedbackToggle').addEventListener('change', (e) => {
        localStorage.setItem('wt-instantFeedback', e.target.checked);
    });

    // Mock test settings
    document.getElementById('timerWarnings').addEventListener('click', () => {
        const newValue = prompt('Enter timer warnings (e.g., "5 min, 1 min"):',
                               document.getElementById('timerWarnings').textContent);
        if (newValue !== null) {
            localStorage.setItem('wt-timerWarnings', newValue);
            document.getElementById('timerWarnings').textContent = newValue;
        }
    });

    document.getElementById('autoSubmitToggle').addEventListener('change', (e) => {
        localStorage.setItem('wt-autoSubmit', e.target.checked);
    });

    document.getElementById('reviewIncorrectToggle').addEventListener('change', (e) => {
        localStorage.setItem('wt-reviewIncorrect', e.target.checked);
    });
}

function exportData() {
    // Export user data (history, bookmarks, settings)
    const data = {
        history: JSON.parse(localStorage.getItem('wt-history') || '[]'),
        bookmarks: JSON.parse(localStorage.getItem('wt-bookmarks') || '[]'),
        settings: {
            theme: localStorage.getItem('wt-theme') || 'light',
            scheme: localStorage.getItem('wt-scheme') || 'default',
            questionsPerSession: localStorage.getItem('wt-questionsPerSession') || '10',
            shuffleQuestions: localStorage.getItem('wt-shuffleQuestions') || 'false',
            showExplanations: localStorage.getItem('wt-showExplanations') || 'true',
            instantFeedback: localStorage.getItem('wt-instantFeedback') || 'true',
            timerWarnings: localStorage.getItem('wt-timerWarnings') || '5 min, 1 min',
            autoSubmit: localStorage.getItem('wt-autoSubmit') || 'true',
            reviewIncorrect: localStorage.getItem('wt-reviewIncorrect') || 'true'
        },
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `wolvtest-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Data exported successfully!');
}

function importData() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // Validate data structure
                if (data.history !== undefined) {
                    localStorage.setItem('wt-history', JSON.stringify(data.history));
                }
                if (data.bookmarks !== undefined) {
                    localStorage.setItem('wt-bookmarks', JSON.stringify(data.bookmarks));
                }
                if (data.settings !== undefined) {
                    // Apply settings
                    Object.keys(data.settings).forEach(key => {
                        localStorage.setItem(`wt-${key}`, data.settings[key]);
                    });
                }

                // Reload settings to reflect changes
                loadSettings();

                alert('Data imported successfully!');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing data. Please make sure the file is valid.');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

async function clearAllData() {
    if (await confirm('Are you sure you want to clear ALL data? This includes history, bookmarks, and settings. This action cannot be undone.')) {
        // Clear all localStorage items related to the app
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('wt-')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reload the page to apply cleared settings
        alert('All data has been cleared. The page will now reload.');
        window.location.reload();
    }
}

async function resetToDefaults() {
    if (await confirm('Are you sure you want to reset all settings to their default values?')) {
                // Reset appearance preferences to the defaults
        try { localStorage.removeItem('wt-prefs'); } catch (_) { /* ignore */ }
        localStorage.setItem('wt-theme', 'light');
        localStorage.setItem('wt-scheme', 'default');
        applyTheme({ animate: true });

        // Reset to default values
        localStorage.setItem('wt-scheme', 'default');
        localStorage.setItem('wt-questionsPerSession', '10');
        localStorage.setItem('wt-shuffleQuestions', 'false');
        localStorage.setItem('wt-showExplanations', 'true');
        localStorage.setItem('wt-instantFeedback', 'true');
        localStorage.setItem('wt-timerWarnings', '5 min, 1 min');
        localStorage.setItem('wt-autoSubmit', 'true');
        localStorage.setItem('wt-reviewIncorrect', 'true');

        // Reload settings to reflect changes
        loadSettings();

        alert('Settings have been reset to defaults');
    }
}
// Expose inline-onclick handlers to the global scope (module functions are
// not otherwise reachable from onclick="...").
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.resetToDefaults = resetToDefaults;