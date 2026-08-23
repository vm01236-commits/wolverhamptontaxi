// ============================================================
// SETTINGS VIEW - Application settings and preferences
// ============================================================

import { themeManager } from '../theme-manager.js';

export function init(container) {
    // Load settings view content
    container.innerHTML = `
        <div class="settings-view">
            <!-- Settings Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Settings</h1>
                    <p class="text-muted">
                        Customize your Wolverhampton Taxi Knowledge Test experience.
                    </p>
                </div>
                <div class="exam-header-right">
                    <!-- Settings actions will go here -->
                </div>
            </header>

            <!-- Settings Sections -->
            <section class="settings-section">
                <h3 class="section-title">Appearance</h3>
                <div class="setting-item">
                    <div class="setting-label">
                        <span>Theme</span>
                        <span class="setting-value" id="currentTheme">Light</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" id="darkModeToggle">
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Dark Mode</span>
                </div>
                <div class="setting-item">
                    <div class="setting-label">
                        <span>Color Scheme</span>
                        <span class="setting-value" id="currentScheme">Default</span>
                    </div>
                </div>
                <div class="setting-item">
                    <span>Scheme:</span>
                    <div class="scheme-options">
                        <button class="scheme-btn" data-scheme="default">Default</button>
                        <button class="scheme-btn" data-scheme="warm">Warm</button>
                        <button class="scheme-btn" data-scheme="cool">Cool</button>
                        <button class="scheme-btn" data-scheme="high-contrast">High Contrast</button>
                        <button class="scheme-btn" data-scheme="monochrome">Monochrome</button>
                    </div>
                </div>
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
    // Load theme settings
    const savedTheme = localStorage.getItem('wt-theme') || 'light';
    const savedScheme = localStorage.getItem('wt-scheme') || 'default';

    document.getElementById('currentTheme').textContent =
        savedTheme === 'light' ? 'Light' : 'Dark';
    document.getElementById('darkModeToggle').checked = savedTheme === 'dark';
    document.getElementById('currentScheme').textContent =
        savedScheme.charAt(0).toUpperCase() + savedScheme.slice(1).replace('-', ' ');

    // Highlight current scheme button
    document.querySelectorAll('.scheme-btn').forEach(btn => {
        if (btn.dataset.scheme === savedScheme) {
            btn.classList.add('active');
        }
    });

    // Load practice settings
    const questionsPerSession = localStorage.getItem('wt-questionsPerSession') || '10';
    document.getElementById('questionsPerSession').textContent = questionsPerSession;
    document.getElementById('shuffleQuestionsToggle').checked =
        localStorage.getItem('wt-shuffleQuestions') === 'true';
    document.getElementById('showExplanationsToggle').checked =
        localStorage.getItem('wt-showExplanations') !== 'false';
    document.getElementById('instantFeedbackToggle').checked =
        localStorage.getItem('wt-instantFeedback') !== 'false';

    // Load mock test settings
    document.getElementById('timerWarnings').textContent =
        localStorage.getItem('wt-timerWarnings') || '5 min, 1 min';
    document.getElementById('autoSubmitToggle').checked =
        localStorage.getItem('wt-autoSubmit') !== 'false';
    document.getElementById('reviewIncorrectToggle').checked =
        localStorage.getItem('wt-reviewIncorrect') !== 'false';

    // Set up event listeners
    setupSettingsListeners();
}

function setupSettingsListeners() {
    // Theme toggle
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        themeManager.applyTheme(theme);
        document.getElementById('currentTheme').textContent =
            theme === 'light' ? 'Light' : 'Dark';
    });

    // Scheme buttons
    document.querySelectorAll('.scheme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scheme = btn.dataset.scheme;
            themeManager.applyScheme(scheme);
            document.getElementById('currentScheme').textContent =
                scheme.charAt(0).toUpperCase() + scheme.slice(1).replace('-', ' ');

            // Update active button
            document.querySelectorAll('.scheme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

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

function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This includes history, bookmarks, and settings. This action cannot be undone.')) {
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

function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
        // Reset to default values
        localStorage.setItem('wt-theme', 'light');
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