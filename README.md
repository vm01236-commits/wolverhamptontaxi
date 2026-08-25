# Wolverhampton Taxi Knowledge Test

A web-based mock-exam and practice platform for the Wolverhampton taxi / hackney licence knowledge test. Sit timed mock papers, drill down by topic with Smart Practice, review every answer with explanations, and track your progress across attempts — all in one place.

> **Disclaimer:** This app is for practice purposes only. For official licensing information, please refer to the Wolverhampton City Council licensed vehicle department.

## Features

- **Mock Tests** — Five timed mock papers (28 questions each, 40-minute limit, 75% pass mark) that mirror the real exam format, with instant score and pass/fail feedback.
- **Smart Practice** — Topic-based practice sessions plus four adaptive modes:
  - All Questions
  - Incorrect Only
  - Repeated Mistakes
  - Weak Areas
  with a recommendation banner and per-topic performance statistics.
- **Results & Review** — Detailed score summary with an answer-by-answer review (filter by correct / incorrect / skipped) and full explanations.
- **History** — Chronological record of every attempt with score dots, PASS/FAIL badges, time taken and one-click delete.
- **Bookmarks** — Save challenging questions during an exam and revisit them on a dedicated page grouped by topic, with the correct options highlighted.
- **Personalisation**
  - Light / Dark / System themes
  - Five colour schemes (Default, Warm, Cool, High Contrast, Monochrome)
  - Text-size (display type) scaling across the whole site
- **Dashboard** — Progress overview, statistics, quick actions and feature highlights.
- **Application Guide & FAQs** — A built-in study reference with section navigation.
- **Data tools** — Export and import your results (CSV) plus full control over your stored data.
- **Accessibility** — WCAG 2.1 AA keyboard navigation, focus management, screen-reader announcements and accessible contrast throughout.

## Tech Stack

- **Vanilla HTML5 / CSS3 / JavaScript (ES Modules)** — no frameworks, no build step
- CSS Custom Properties power the entire theming system for instant theme / scheme swaps
- Single-page app with a lightweight hash router
- `localStorage` persistence (progress, results, bookmarks, preferences)
- Font Awesome 6 icons and the Inter typeface

## Getting Started

The app is a static site with no dependencies to install — just serve the folder:

```bash
# Option A — Node
npx serve .

# Option B — Python
python -m http.server 8080
```

Then open <http://localhost:8080>.

You can also open `index.html` directly, though some browsers restrict ES module imports over `file://`, so a local server is recommended for the full experience.

## Project Structure

```
├── index.html            # SPA shell (nav, disclaimer, footer)
├── css/
│   ├── themes.css        # CSS custom properties — light/dark + colour schemes
│   ├── style.css         # Base layout & typography
│   ├── views.css         # Per-view styles
│   └── components.css    # Reusable components (cards, badges, controls)
├── js/
│   ├── main.js           # App bootstrap
│   ├── router.js         # Hash-based SPA routing
│   ├── data.js           # JSON data layer (loading + caching)
│   ├── storage.js        # localStorage persistence + preferences
│   ├── theme-manager.js  # Theme / scheme / text-size engine
│   ├── examRunner.js     # Timed exam + practice runner
│   ├── results.js        # Scoring, history and statistics
│   ├── analytics.js      # Performance analysis & weak-area detection
│   ├── bookmarks.js      # Bookmark data logic
│   ├── accessibility.js  # WCAG 2.1 AA enhancements
│   ├── utils.js          # Shared helpers
│   └── views/            # Dashboard, Exams, Practice, History, Bookmarks,
│                         # Settings, Guide, Results
└── data/
    ├── questions.json    # Question bank (with explanations)
    ├── guide.json        # Application guide content
    ├── faq.json          # Frequently asked questions
    └── mocks/            # Mock test definitions (index + papers)
```

## Data

- **Question bank** — organised by knowledge area (e.g. Driver Responsibilities, Plying for Hire, Disability Awareness), each entry with options, correct answer, question type and an explanation.
- **Mock tests** — five papers defined in `data/mocks/`, each targeting the real-exam format.
- Everything is plain JSON, so the bank is easy to extend or replace without touching any code.

## Feedback

Found a bug or have a feature idea? Open an issue on GitHub.
