// ============================================================
// EXAM RUNNER VIEW - Handles the exam taking interface
// ============================================================

import { renderExamRunner, teardownExamRunner } from '../examRunner.js';

export function init(container) {
    // The exam runner view is handled directly by the examRunner module
    // We just need to provide a container for it to render into
    return Promise.resolve();
}

// This view will be handled specially by the router - the examRunner module
// will handle rendering directly when the route is '/exam-runner'
// We don't need to do anything special here since the examRunner module
// will handle the rendering when activated via hashchange