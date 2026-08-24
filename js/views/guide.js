// ============================================================
// APPLICATION GUIDE VIEW - Official guide and FAQs
// ============================================================

export function init(container) {
    // Load guide view content
    container.innerHTML = `
        <div class="guide-view">
            <!-- Guide Header -->
            <header class="exam-header">
                <div class="exam-header-left">
                    <h1 class="section-title">Application Guide</h1>
                    <p class="text-muted">
                        The official Wolverhampton Taxi Driver Handbook - your complete reference for all topics covered in the knowledge test.
                    </p>
                </div>
                <div class="exam-header-right">
                    <div class="exam-meta">
                        <div class="exam-meta-item" id="guideSectionsCount">
                            <i class="fas fa-list"></i>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Guide Content -->
            <div class="guide-content" id="guideContent">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading application guide...</div>
                </div>
            </div>

            <!-- FAQs Section -->
            <section class="faqs-section" id="faqsSection">
                <h2 class="section-title center">Frequently Asked Questions</h2>
                <div class="faqs-container" id="faqsContainer">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Loading FAQs...</div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Load guide and FAQs data
    loadGuideData();

    return Promise.resolve();
}

async function loadGuideData() {
    try {
        // Load application guide
        const guide = await window.dataLayer.loadApplicationGuide();

        // Load FAQs (from faq.json, and supplement with guide-embedded FAQs)
        const faqs = await window.dataLayer.loadFAQs();
        const guideFaqs = (guide && Array.isArray(guide.faqs)) ? guide.faqs : [];
        const allFaqs = (Array.isArray(faqs) ? faqs : [])
            .concat(guideFaqs.filter(f => f && f.question && !(Array.isArray(faqs) && faqs.some(x => x.question === f.question))));

        // Render guide
        renderGuide(guide);

        // Render FAQs
        renderFAQs(allFaqs);

        // Update sections count
        document.getElementById('guideSectionsCount').textContent =
            guide.sections ? guide.sections.length : buildGuideSections(guide).length;

    } catch (error) {
        console.error('Error loading guide data:', error);
        showErrorMessage();
    }
}

// Strip basic markdown formatting (**bold**, *italic*) for plain display
function stripMarkdown(text) {
    return String(text || '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '');
}

// The guide JSON stores content under section keys (badge, plate, ...);
// normalise it into the { sections: [...] } shape the view expects.
function buildGuideSections(guide) {
    if (!guide || typeof guide !== 'object') return [];
    if (Array.isArray(guide.sections)) return guide.sections;

    const sections = Object.entries(guide)
        .filter(([key, value]) => key !== 'faqs' && value && typeof value === 'object')
        .map(([key, value]) => {
            const content = [];
            if (value.renewal_info) content.push({ type: 'paragraph', text: stripMarkdown(value.renewal_info) });
            if (Array.isArray(value.eligibility_checklist) && value.eligibility_checklist.length) {
                content.push({ type: 'list', items: value.eligibility_checklist.map(stripMarkdown) });
            }
            if (Array.isArray(value.process_steps) && value.process_steps.length) {
                content.push({ type: 'list', items: value.process_steps.map(stripMarkdown) });
            }
            if (Array.isArray(value.fees_table) && value.fees_table.length) {
                content.push({ type: 'paragraph', text: value.fees_table.filter(t => t !== '---').join(' | ') });
            }
            return { title: value.title || key, content };
        })
        .filter(section => section.content.length > 0);

    return sections.length ? sections : [];
}

function renderGuide(guide) {
    const contentContainer = document.getElementById('guideContent');

    if (!guide || typeof guide !== 'object') {
        contentContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="empty-title">Guide Not Available</div>
                <div class="empty-subtitle">
                    The application guide could not be loaded. Please try again later.
                </div>
            </div>
        `;
        return;
    }

    const sections = buildGuideSections(guide);

    if (sections.length === 0) {
        contentContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="empty-title">Guide Not Available</div>
                <div class="empty-subtitle">
                    The application guide could not be loaded. Please try again later.
                </div>
            </div>
        `;
        return;
    }

    // Build table of contents
    const tocItems = sections.map((section, index) => `
        <li>
            <a href="#section-${index}">
                <div class="guide-toc-icon">${section.icon || '📖'}</div>
                <span>${section.title}</span>
            </a>
        </li>
    `).join('');

    contentContainer.innerHTML = `
        <!-- Table of Contents -->
        <aside class="guide-toc">
            <h3>Guide Contents</h3>
            <ul>
                ${tocItems}
            </ul>
        </aside>

        <!-- Main Content -->
        <main>
            ${sections.map((section, index) => renderGuideSection(section, index)).join('')}
        </main>
    `;
}

function renderGuideSection(section, index) {
    return `
        <section class="guide-section" id="section-${index}">
            <h2>${section.title}</h2>
            ${section.content.map(block => {
                if (block.type === 'paragraph') {
                    return `<p>${block.text}</p>`;
                } else if (block.type === 'heading') {
                    const tag = block.level >= 4 ? 'h4' : 'h3';
                    return `<${tag} class="guide-subheading">${block.text}</${tag}>`;
                } else if (block.type === 'table') {
                    const head = block.head || [];
                    const rows = block.rows || [];
                    return `
                        <div class="guide-table-wrap">
                            <table class="guide-table">
                                ${head.length ? `<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>` : ''}
                                <tbody>
                                    ${rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                } else if (block.type === 'list') {
                    const listType = block.ordered ? 'ol' : 'ul';
                    const items = block.items.map(item => `<li>${item}</li>`).join('');
                    return `<${listType}>${items}</${listType}>`;
                } else if (block.type === 'note') {
                    return `<div class="guide-note">${block.text}</div>`;
                } else if (block.type === 'warning') {
                    return `<div class="guide-warning">${block.text}</div>`;
                } else if (block.type === 'tip') {
                    return `<div class="guide-tip">${block.text}</div>`;
                } else if (block.type === 'quote') {
                    return `<blockquote>${block.text}<cite>— ${block.author || 'Source'}</cite></blockquote>`;
                }
                return '';
            }).join('')}
        </section>
    `;
}

function renderFAQs(faqs) {
    const faqsContainer = document.getElementById('faqsContainer');

    if (!faqs || faqs.length === 0) {
        faqsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="empty-title">No FAQs Available</div>
                <div class="empty-subtitle">
                    Frequently asked questions are not available at the moment.
                </div>
            </div>
        `;
        return;
    }

    faqsContainer.innerHTML = faqs.map((faq, index) => `
        <div class="faq-item" id="faq-${index}">
            <div class="faq-question" onclick="toggleFAQ(${index})">
                <h3>${faq.question}</h3>
                <div class="faq-question-icon">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="faq-answer">
                ${faq.answer.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('')}
            </div>
        </div>
    `).join('');
}

function toggleFAQ(index) {
    const faqItem = document.getElementById(`faq-${index}`);
    faqItem.classList.toggle('open');
}

function showErrorMessage() {
    const container = document.querySelector('.guide-view');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-title">Error Loading Guide</div>
            <div class="empty-subtitle">
                We're sorry, but there was an error loading the application guide. Please try again later.
            </div>
        </div>
    `;
}
// Expose inline-onclick handlers to the global scope (module functions are
// not otherwise reachable from onclick="...").
window.toggleFAQ = toggleFAQ;