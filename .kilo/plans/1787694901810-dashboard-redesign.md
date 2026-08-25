# WolvTest Hero — Premium SaaS/EdTech Redesign

## Goal
Replace the current two-column hero in `js/views/dashboard.js:14-31` and its CSS
in `css/style.css:153-269` (+ responsive blocks at `:673-:760`) with a premium
EdTech landing-page hero that matches the reference image
(`C:\Users\Habib\Desktop\ChatGPT Image Aug 25, 2026, 11_37_26 PM.png`).

Implementation rules: **vanilla HTML + CSS only**, no new framework, no new JS
runtime, no new build step, no external assets. Reuse the existing hash-router
(`js/router.js`), the existing button classes (`.btn`, `.btn-primary`,
`.btn-secondary`), the existing Font Awesome 6.4 library, and the existing
theme token system in `css/themes.css`.

## Reference vs. Current State
- Reference (image): light-to-blue gradient hero, 28-32px radius, left content
  ~58% with disclaimer pill → eyebrow "Prepare for your" → two-line bold title
  ("Wolverhampton" navy + "Taxi Knowledge Test" blue gradient) → subtitle →
  three feature highlights (Mock Tests / Topic Practice / Track Progress); right
  panel ~42% with taxi sign + pin + skyline, two large pill CTAs.
- Current (`dashboard.js:14-31`): dark navy hero (theme-dependent), one
  eyebrow + one bold title + one subtitle, two stacked CTAs in a right column,
  no taxi visual, no feature row.
- `css/style.css:153-269`: the entire HERO block uses `var(--navy/-2/-3)` for a
  full-bleed dark gradient and `var(--on-hero-*)` for white text. The new design
  inverts this: left side is light (`var(--bg)` / `var(--card)`), right side is
  a blue gradient using `var(--navy-2)` family. Hero text colors must switch
  from `var(--on-hero*)` to `var(--text)` and `var(--navy)`.

## Decisions Made
- **Inline SVG, no new assets.** The taxi roof sign, the location pin, the
  skyline, the radial gradient overlay, and the dot grid are all inline SVG /
  CSS in the template. This is themable (uses `currentColor` and CSS
  custom-property fills) and zero-cost to ship.
- **Theme fidelity over colour fidelity.** Reference image uses fixed brand
  blues (`#10264F`, `#1475E8`, `#1769E8`, `#EAF3FF`). The site has 5 colour
  schemes + 2 themes, each redefining `--navy/-2/-3` and the tints. The
  redesigned hero will **derive its colours from tokens** so it stays
  accessible across all 10 themes. The "Taxi Knowledge Test" line uses a CSS
  `linear-gradient(...)` that resolves the two endpoint colours at paint time
  from `--navy-2` and `--blue` (or `--navy-3` fallback). This is the correct
  trade-off — pixel-faithful would break dark mode, warm scheme, contrast
  scheme, etc.
- **Existing `.features` block is removed** in the dashboard view. The new
  in-hero feature row replaces it (it duplicates the same content). The CSS
  rules for `.features` / `.feature-card` in `style.css:555-608` are left in
  place (other views don't use them today, but removing them is out of scope).
- **CTAs are real router links** using the existing pattern
  `<a href="#exams" data-view="exams">` — `js/router.js:34-46` already
  intercepts these and calls `loadView('exams')`.
- **Animations are subtle and gated by `prefers-reduced-motion`.** The site
  already sets `data-theme` / `data-scheme` on `<html>` before first paint
  (`index.html:32-53`); the hero animation will check
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` once and
  add a `.no-motion` class to the hero.
- **No new components / no new files.** All changes go in:
  - `js/views/dashboard.js` — replace the `<section class="hero">` template
    block at lines 14-31.
  - `css/style.css` — replace the HERO block (lines 153-269) and the
    responsive overrides for it (lines 673-760).
  - `index.html` — no change.
  - `css/themes.css` — no change (existing tokens are sufficient).

## Target Layout (desktop ≥ 1024px)

```
+--------------------------------------------------------------+
|  ⓘ Practice only — see Wolverhampton City Council...         |
|                                                              |
|  Prepare for your                              [decorative]  |
|  Wolverhampton                       ╭─────────────────╮     |
|  Taxi Knowledge Test                 │     📍 pin      │     |
|                                      │   ░░ skyline    │     |
|  Mock tests, topic practice and      │   ░░░░░░░       │     |
|  progress tracking to help you       │  ┌─────────┐    │     |
|  pass the Wolverhampton licensing    │  │  TAXI   │    │     |
|  exam.                                │  └─────────┘    │     |
|                                      ╰─────────────────╯     |
|  🗒 Mock Tests  📖 Topic Practice  📈 Track Progress          |
|                                          [→ Start Mock Test]  |
|                                          [▣ Topic Practice]   |
+--------------------------------------------------------------+
```

Two columns: left ~58% (disclaimer, eyebrow, title, subtitle, features),
right ~42% (visual panel with taxi sign, pin, skyline, CTAs). Hero height
~540px, padding 56px left / 48px right.

## Token Usage Map
| Reference | Token | Notes |
|---|---|---|
| White (#FFFFFF) | `var(--card)` | Hero left background (light area) |
| Light blue (#EAF3FF) | `var(--tint-navy)` | Mid-gradient stop |
| Right blue (#1769E8) | `var(--navy-2)` | Right gradient end |
| Deep blue (#1248B8) | `var(--navy-3)` | Right gradient deepest stop |
| Title dark (#10264F) | `var(--navy)` | "Wolverhampton" line |
| Title bright blue (#1475E8) | `linear-gradient(90deg, var(--navy-2), var(--blue))` | "Taxi Knowledge Test" |
| Slate text | `var(--text-muted)` | Subtitle |
| Pill border | `var(--border)` | Disclaimer pill |
| Pill background | `var(--tint-navy-soft)` | Disclaimer pill background |
| Feature icon blue | `var(--tint-navy)` + `var(--navy-2)` | Reuse `.icon-chip--navy` |
| Feature icon green | `var(--tint-green)` + `var(--green)` | New `.icon-chip--green` |
| Feature icon purple | New `--tint-purple` + `--purple` (already defined `themes.css:654-655` for default light + dark only — **falls back to `--tint-navy` + `--navy-2` in warm/cool/contrast/mono** to stay themable) |

## Tasks (ordered)

### 1. Hero template (replace `js/views/dashboard.js:14-31`)
- New `<section class="hero hero-premium">` with:
  - `<div class="hero-bg" aria-hidden="true">` — contains:
    - radial gradient overlay (CSS background, no SVG)
    - dot grid (CSS background-image, 24px tile, 1.5px dots)
    - inline SVG skyline (5 building silhouettes, faint, ~12% opacity)
    - inline SVG location pin (drop-shadow, scale-on-hover)
    - inline SVG taxi roof sign (rounded rectangle body, dark "TAXI" lettering, 3D shadow, optional floating animation)
  - `<div class="hero-inner">` — two-column grid:
    - `<div class="hero-content">`:
      - `<div class="hero-disclaimer">` (icon + text, same copy as today)
      - `<p class="hero-eyebrow">Prepare for your</p>`
      - `<h1 class="hero-title">` with two `<span>`s: `<span class="hero-title-line-1">Wolverhampton</span>` and `<span class="hero-title-line-2">Taxi Knowledge Test</span>`
      - `<p class="hero-subtitle">Mock tests, topic practice and progress tracking to help you pass the Wolverhampton licensing exam.</p>`
      - `<ul class="hero-features">` with three `<li>` items, each with a 48px square icon container (clipboard / book / chart) + title + sub
    - `<div class="hero-actions">`:
      - `<a class="hero-cta hero-cta--primary" href="#exams" data-view="exams">` with arrow icon + "Start Mock Test"
      - `<a class="hero-cta hero-cta--secondary" href="#practice" data-view="practice">` with book icon + "Topic Practice"
- Total template size: ~120 lines (most of it SVG markup). All decorative
  elements have `aria-hidden="true"`. Buttons use real `<a>` tags so they
  work with the existing keyboard / router plumbing.

### 2. CSS (replace `css/style.css:153-269` + responsive blocks at 673-760)
- `.hero` / `.hero-premium`: full-bleed, position relative, border-radius
  `var(--radius)` (16px) bumped to 28px via a new local `--hero-radius: 28px`,
  overflow hidden, min-height 540px, `box-shadow: var(--shadow-lg)`. Background:
  a layered gradient `linear-gradient(95deg, var(--card) 0%, var(--tint-navy) 55%, var(--navy-2) 100%)` so the left is light and the right is brand blue.
- `.hero-bg` (decorative layer, `position: absolute; inset: 0; z-index: 0;
  pointer-events: none;`): holds the radial gradient overlay, dot grid
  background, and inline SVG.
- `.hero-bg::before` — radial gradient hot-spot behind the taxi sign (white
  blur centered ~60% from left, 50% from top).
- `.hero-bg::after` — 24px-tile dot pattern in `rgba(255,255,255,0.12)`.
- `.hero-skyline`, `.hero-pin`, `.hero-taxi` — wrapper divs for the inline
  SVGs. `.hero-taxi` has a `transform: translateY(0)` floating keyframe
  (3s ease-in-out infinite), skipped under `prefers-reduced-motion`.
- `.hero-inner` — `position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 32px; padding: 56px 48px; min-height: 540px;`.
- `.hero-content` — `display: flex; flex-direction: column; gap: 20px;`.
- `.hero-disclaimer` — pill, `var(--tint-navy-soft)` background, `var(--border)`
  border, `var(--navy-2)` text, 0.82rem, weight 500, padding 10px 16px, 999px radius.
- `.hero-eyebrow` — 1.05rem, weight 600, `var(--text-muted)`, no margin.
- `.hero-title` — wrapper; display flex; flex-direction column; gap 4px; line-height 1; margin 0.
- `.hero-title-line-1` — 3.2rem desktop (clamp 2.4rem → 4.5rem via `clamp()`),
  weight 800, `var(--navy)`, letter-spacing -0.025em, line-height 1.0.
- `.hero-title-line-2` — 3.2rem desktop, weight 800, background-image
  `linear-gradient(90deg, var(--navy-2) 0%, var(--blue) 100%)`, `-webkit-background-clip: text; background-clip: text; color: transparent;`, line-height 1.0.
- `.hero-subtitle` — 1.05rem, weight 500, `var(--text-muted)`, line-height 1.55,
  max-width 540px.
- `.hero-features` — flex row, gap 28px, list-style none, padding 0, margin 0.
  Each item is `<li class="hero-feature">` with a 48×48 icon container (16px
  radius) + a text block.
- `.hero-feature-icon` — 48×48, 16px radius, `var(--tint-{tone})` background,
  `var(--{tone})` color, 1.1rem Font Awesome glyph, flex-centered.
  Three tones: navy (clipboard), green (book), purple-fallback-to-navy (chart).
- `.hero-feature-text` — title (0.95rem / weight 700 / `var(--navy)`) + sub
  (0.8rem / weight 500 / `var(--text-muted)`).
- Vertical divider between features: `border-right: 1px solid var(--border)` on
  `li + li` inside the flex row (omit on the last item). Hidden on mobile.
- `.hero-actions` — `display: flex; flex-direction: column; gap: 16px; align-self: end; min-width: 280px;`.
- `.hero-cta` — base: 64px height, 999px radius, display flex, align-items center,
  justify-content center (or flex-start with gap 12px), font-size 1.05rem, weight 700,
  no underline, transition `transform 0.2s ease, box-shadow 0.2s ease`.
- `.hero-cta--primary` — `background: linear-gradient(135deg, var(--blue) 0%, var(--navy-2) 100%)`, color white, `box-shadow: 0 8px 24px rgba(30, 58, 138, 0.25)`. Hover: `transform: translateY(-2px); box-shadow: 0 12px 32px rgba(30, 58, 138, 0.32)`.
- `.hero-cta--secondary` — `background: rgba(255,255,255,0.16); color: white; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(8px)`. Hover: `background: rgba(255,255,255,0.24)`.
- Focus-visible: `outline: 3px solid rgba(255,255,255,0.8); outline-offset: 3px`.
- `@media (max-width: 1024px)`: title lines drop to 2.6rem, padding 48px 36px, min-height auto.
- `@media (max-width: 900px)`: switch to single column (`grid-template-columns: 1fr`), the
  visual panel becomes the second row, taxi sign is hidden, CTAs sit
  side-by-side full width. Hero min-height auto.
- `@media (max-width: 640px)`: padding 32px 24px, title 2rem, features become
  3-column compact row (icons + text stacked), CTAs stack full width, dot
  grid + skyline hidden.
- `.no-motion .hero-taxi` — `animation: none;` and `.no-motion .hero-inner`
  children skip the page-load fade.

### 3. Page-load animation (CSS only, no JS)
- `@keyframes hero-fade-in` — opacity 0→1, translateY 8px→0, 600ms ease-out.
- Apply to `.hero-disclaimer`, `.hero-eyebrow`, `.hero-title-line-1`,
  `.hero-title-line-2`, `.hero-subtitle`, `.hero-features`, `.hero-actions`
  with staggered `animation-delay` 0ms / 80ms / 160ms / 240ms / 320ms /
  400ms / 480ms.
- Respect `prefers-reduced-motion: reduce` via media query that disables all
  hero animations.

### 4. Taxi sign + pin + skyline SVG (inline in template)
- **Skyline (background):** 5 rectangles of varying height with simple roof
  shapes, `fill="rgba(255,255,255,0.10)"`, no strokes, positioned at the
  bottom of the right panel. ~600×220 viewBox. Hidden on mobile.
- **Location pin:** teardrop shape (circle + triangle), 60×80 viewBox,
  `fill="white"`, with a 1px stroke and a small drop-shadow filter. Floats
  above the taxi sign.
- **Taxi sign:** classic 2-tone taxi roof sign.
  - White/off-white rounded body with a thin dark bottom plate.
  - Bold "TAXI" lettering in dark navy.
  - 3D shadow under the body.
  - Small antenna/posts that make it look roof-mounted.
  - Subtle floating animation (translateY -4px → 4px over 4s).
- All three are emitted by a single template helper at the top of
  `dashboard.js`:
  ```js
  const HERO_TAXI_SVG = `<svg ...>...</svg>`;  // ~40 lines
  const HERO_PIN_SVG = `<svg ...>...</svg>`;     // ~10 lines
  const HERO_SKYLINE_SVG = `<svg ...>...</svg>`; // ~15 lines
  ```

### 5. Remove the now-redundant `.features` section from the dashboard template
- `js/views/dashboard.js:103-122` (the existing `<section class="features">` with
  three cards) — delete it. Its content overlaps the new in-hero features.
- Keep the CSS for `.features` / `.feature-card` in `style.css:555-608` (no
  other view uses it today, so the rules are dead but harmless; removing
  them is out of scope).

### 6. Files Touched
- `js/views/dashboard.js` — replace hero template (lines 14-31), delete the
  existing `<section class="features">` block (lines 103-122). Add the three
  SVG constants near the top of the file.
- `css/style.css` — replace HERO block (lines 153-269) and its responsive
  overrides (lines 673-760). Add `@media (prefers-reduced-motion: reduce)`
  rule for hero animations. Add `--hero-radius: 28px` under the comment in
  the HERO block (no new token in `themes.css`).

### 7. Validation
- Syntax: `node --check js/views/dashboard.js`.
- Smoke: re-run the temporary `node test-dashboard.mjs` (after re-adding it).
  Assert presence of:
  - `.hero-premium` section
  - `.hero-disclaimer` with the practice-only copy
  - `.hero-eyebrow` "Prepare for your"
  - Two `<span>`s inside `.hero-title` with "Wolverhampton" and "Taxi Knowledge Test"
  - `.hero-features` with three items, each containing an icon container
  - `.hero-actions` with two `<a>` links to `#exams` and `#practice`
  - Inline SVG: skyline, pin, taxi sign
  - Stale: no `.hero-pattern` (replaced by `.hero-bg`)
- Visual: the test does not run a browser, so manual visual confirmation is
  the next step. Suggest: `npx http-server .` → open
  `http://localhost:8080` → verify desktop, tablet, mobile widths.
- Theming: switch to each of the 5 colour schemes + dark mode and confirm the
  hero gradient, taxi sign, and title gradient still read correctly.
- Accessibility: tab through the hero — both CTAs should show a focus ring.
  `prefers-reduced-motion` should suppress the float and the page-load fade.
- Browser fallbacks: `clamp()` and `backdrop-filter` are widely supported;
  `background-clip: text` is supported with the `-webkit-` prefix in all
  evergreen browsers. No graceful-degradation polyfill needed for an
  EdTech practice app.

### 8. Out of Scope
- New fonts (re-use Inter, already loaded in `index.html:24`).
- New icon library (re-use Font Awesome 6.4, already loaded in `index.html:19`).
- New theme tokens (no change to `themes.css`).
- Real 3D taxi model / image asset (inline SVG only).
- New JS files / modules.
- Touching the rest of the dashboard (stats strip, progress card, question
  distribution, quick actions, footer) — all left as-is.
