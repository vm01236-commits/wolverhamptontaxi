// ============================================================
// ACCESSIBILITY ENHANCEMENTS - WCAG 2.1 AA compliance
// ============================================================

/**
 * Initialize accessibility enhancements
 */
export function initAccessibility() {
    // Add ARIA labels where needed
    enhanceFormLabels();
    enhanceNavigation();
    enhanceDynamicContent();
    enhanceKeyboardNavigation();
    enhanceFocusManagement();
}

/**
 * Enhance form labels for screen readers
 */
function enhanceFormLabels() {
    // Ensure all form inputs have associated labels
    document.querySelectorAll('input, select, textarea').forEach(element => {
        // If element doesn't have an associated label, try to create/find one
        const id = element.id;
        if (!id) {
            // Generate an ID if none exists
            const newId = `${element.type}-${Math.random().toString(36).substr(2, 9)}`;
            element.id = newId;
        }

        // Check if there's a label for this element
        let label = document.querySelector(`label[for="${element.id}"]`);

        // If no label exists, try to find one nearby
        if (!label) {
            // Look for a label that precedes or follows the element
            const potentialLabel = element.previousElementSibling || element.nextElementSibling;
            if (potentialLabel && potentialLabel.tagName.toLowerCase() === 'label') {
                label = potentialLabel;
            }
        }

        // If still no label, create one based on placeholder or aria-label
        if (!label) {
            const placeholder = element.getAttribute('placeholder');
            const ariaLabel = element.getAttribute('aria-label');
            const labelText = placeholder || ariaLabel || 'Form field';

            label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = labelText;
            label.className = 'sr-only'; // Screen reader only

            // Insert label before the element
            element.parentNode.insertBefore(label, element);
        }
    });
}

/**
 * Enhance navigation for screen readers and keyboard users
 */
function enhanceNavigation() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '0';
    skipLink.style.background = '#000';
    skipLink.style.color = '#fff';
    skipLink.style.padding = '8px';
    skipLink.style.zIndex = '1000';
    skipLink.style.borderRadius = '4px';

    skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('main-content')?.focus();
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Show skip link when focused
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    // Enhance navigation menus
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        // Add role and aria-current for active state
        link.setAttribute('role', 'menuitem');

        // Add keyboard navigation
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });

    // Add ARIA labels to nav toggle
    const navToggle = document.getElementById('navToggle');
    if (navToggle) {
        navToggle.setAttribute('aria-label', 'Toggle navigation menu');
        navToggle.setAttribute('aria-expanded', 'false');

        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
            navToggle.setAttribute('aria-expanded', String(!expanded));
        });
    }
}

/**
 * Enhance dynamic content announcements
 */
function enhanceDynamicContent() {
    // Create live region for announcements
    let liveRegion = document.querySelector('[aria-live]');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.position = 'absolute';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
    }

    // Function to announce changes
    window.announce = function(message) {
        if (liveRegion) {
            liveRegion.textContent = '';
            // Trigger screen reader read by briefly removing and re-adding text
            setTimeout(() => {
                liveRegion.textContent = message;
            }, 100);
        }
    };
}

/**
 * Enhance keyboard navigation throughout the app
 */
function enhanceKeyboardNavigation() {
    // Trap focus in modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.classList.contains('open')) {
                    modal.classList.remove('open');
                    const backdrop = document.querySelector('.backdrop');
                    if (backdrop) backdrop.classList.remove('open');
                }
            });
        }

        // Handle tab navigation in modals
        if (e.key === 'Tab') {
            const modal = document.querySelector('.modal.open');
            if (modal) {
                e.preventDefault();
                // Get all focusable elements in modal
                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (document.activeElement === lastElement && !e.shiftKey) {
                    firstElement.focus();
                } else if (document.activeElement === firstElement && e.shiftKey) {
                    lastElement.focus();
                }
            }
        }
    });
}

/**
 * Enhance focus management
 */
function enhanceFocusManagement() {
    // Focus first interactive element when opening a modal/view
    document.addEventListener('click', (e) => {
        const modalTarget = e.target.closest('[data-modal-target]');
        if (modalTarget) {
            const targetId = modalTarget.getAttribute('data-modal-target');
            const modal = document.getElementById(targetId);
            if (modal) {
                // When modal opens, focus first interactive element
                setTimeout(() => {
                    const firstInteractive = modal.querySelector(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (firstInteractive) {
                        firstInteractive.focus();
                    }
                }, 100);
            }
        }
    });

    // Manage focus when closing modals
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                // Store previously focused element to return focus when closing
                modal.dataset.previousFocus = document.activeElement ? document.activeElement.outerHTML : '';
            }
        }
    });

    // Restore focus when modal closes
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close')) {
            setTimeout(() => {
                // Try to restore focus to element that opened modal
                const trigger = document.querySelector('[data-modal-target][aria-expanded="false"]');
                if (trigger) {
                    trigger.focus();
                }
            }, 100);
        }
    });
}

/**
 * Add screen reader only class CSS
 */
function addSrOnlyStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }

        .sr-only.focusable:active,
        .sr-only.focusable:focus {
            position: static;
            width: auto;
            height: auto;
            margin: 0;
            overflow: visible;
            clip: auto;
        }

        /* Skip link styles */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: #fff;
            padding: 8px;
            z-index: 1000;
            border-radius: 4px;
            transition: top 0.3s ease;
        }

        .skip-link:focus {
            top: 0;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Run all accessibility enhancements when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    addSrOnlyStyles();
    initAccessibility();
});

// Export functions for use in other modules
export const accessibility = {
    init: initAccessibility,
    enhanceFormLabels,
    enhanceNavigation,
    enhanceDynamicContent,
    enhanceKeyboardNavigation,
    enhanceFocusManagement
};