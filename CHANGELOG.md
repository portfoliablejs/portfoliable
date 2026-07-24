# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/2.0.0/) with these sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`.

## [2.3.1-alpha] - 2026-07-24

### Added
- HomeView and gallery smoke gate command: `npm run smoke:homeview`.
- Integration verification command: `npm run verify:integration` (content validation + template build + consumer build when available).
- Consumer scaffold command and script flow for quick portfolio data injection startup.
- Vite build chunk strategy via `vite.config.js` for vendor split visibility.
- Repository skill/runbook notes for maintenance and low-token AI handoffs.

### Changed
- Home route now uses `ds-home-view` template behavior with stable gallery wiring.
- Case rendering flow now uses `ds-article` detail composition in App shell.
- Content architecture moved to markdown-first case definitions with parser/normalization pipeline.
- CLI UX expanded with startup banner output and helper workflows.
- Build hardening now lazy-loads Mermaid runtime to reduce entry bundle pressure.

### Removed
- Personal production case data from template package content (template-only boundary enforced).

### Fixed
- Gallery thumbnail frame fallback support by explicit device frame sources in template data.
- Thumbnail drag/select friction in gallery interactions.
- Local integration compatibility for valence style export path via lifecycle ensure script.
- Consumer integration handoff stability for `portfolioCases` module export expectations.

## [2.3.0-alpha] - 2026-07-03

### Added
- Initial alpha release baseline for the v2.3 line.

### Removed
- Legacy placeholders replaced by template package baseline conventions.


## [2.2.1] - 2026-07-03

### Added
- New Social Sharing buttons for each case study.
- New Pop-up Header with Close button.

### Removed
- AI Chat feature.

## [2.2.0] - 2026-07-02

### Added
- `--space-xxxxl: 80px;` and `--space-xxxxxl: 100px;` as new Spacing Scale variables, and applied the first one to the `combo-asset-card`.
- An entrance animation for `.combo-asset-card`.
- New Keyboard Shortcuts for the AI Reader on `Shift`, separated from the other global Keyboard Shortcuts.
- New Social Sharing buttons for each case study.

### Removed
- AI Chat feature.

### Changed
- Change the read-out-loud function from robotic TTS (Text-to-Speech) to pre-recorded AI TTS, via `generate_output.py`.
- Player layout for the AI Reader, with on scroll animations, playback speed options (`0.7`, `1.0`, `1.15`, `1.2`), "Hide on play" and "Auto-scroll on play" buttons.

## [2.1.3] - 2026-07-01

### Fixed 
#### Animations
- "Swipe to explore cases" onboarding appearing without first scroll. Now, it appears a few seconds after the first scroll of the session.
#### Design
- Reader View not perfectly aligning with the center of the viewport, a few pixels to the right.
- Onboarding tutorials `drag-tutorial` and `progress-tutorial` not A11Y compliant.


## [2.1.2] - 2026-06-30

### Fixed 
#### Animations
- Accelerator "Pick up where you left off" Toast Overlay: removed `filter`, `opacity`, `pointer-event` and `transition` properties that were causing friction in microinteraction animation (briefly after a modal is opened).
    - Fixed a temporary horizontal shift triggered by clicking on a thumbnail mid Accelerator entrance animation, caused by `transform: translateX(-50%)` inside `.resume-reading-toast`.
- `.progress-tutorial` onboarding player toast was showing above the glass overlay, corrected by adding `z-index: 1400 !important;` inside `body.modal-open #progress-container`.
- Auto-scroll after clicking on TOC item sometimes pushed the item too far above or below the fold.
- The lines ( - ) of the last title inside the contracted TOC weren't being highlighted.
#### Design 
- Issue where the loading spinner and background were not visible, when on Player View (automatic Dark Mode).
#### A11Y
- Password dots `••••••` and Protected Case container elements not a11y compliant (Dark Mode, High Contrast mode).
- Player button controls color bug and label displacement in High Contrast mode.
- Accessibility menu components (toggles) not compliant in High Contrast mode.


## [2.1.1] - 2026-06-30

### Fixed
- Contextual Menu Positioning: Added relative positioning to case-description-body paragraphs and headings in reader.css, ensuring the absolute-positioned context menu icons remain anchored to their respective text blocks during scroll.
- Scroll-Induced Interaction Cleanup: Implemented a scroll-event interceptor in script.js that force-closes any active contextual menu triggers and popups the moment the user initiates a scroll action, preventing orphaned UI elements.
- "Pick up where you left off" Toast Overlays: Adjusted the resume-reading-toast z-index and interaction states in reader.css to ensure it correctly respects the modal stacking context, blurring and becoming unclickable when the glass overlay is active.
- Toast Accessibility: Upgraded the "Resume Reading" toast in script.js to be keyboard-accessible by assigning proper role="button" and tabindex attributes, and binding native Enter/Space key event listeners.

## [2.1.0] - 2026-06-30

### Added
- **Monolithic Script Deconstruction:** Split the core script file into distinct domain sub-modules (`state.js`, `player.js`, `interactions.js`) inside a new source subdirectory (`scripts/src/`) to maximize maintainability and simplify code regression tracking.
- **Sequential State Pipeline:** Integrated a modular script execution layer inside `index.html` to inject code dependencies consecutively, allowing separate files to interact cleanly across views with zero load latency.

### New file sctructure breakdown
- `index.html` (The Assembly Core): Manages sequential dependency loading.
- `scripts/src/state.js` (The Nervous System): Holds all DOM hooks, global variables, performance tracking configurations, runtime preferences, and view-transition routing utilities.
- `scripts/src/player.js` (The Media Matrix): Manages HTML5 media lifecycles, WebVTT subtitle cue streams, playback speed mutations, and the Web Speech API TTS engine.
- `scripts/src/interactions.js` (The Human Interface layer): Governs inertial drag physics, live Mermaid graph parsing, search query highlighting engines, and contextual paragraph interactive menus.
- `scripts/script.js` (The Pipeline Bootloader): Initializes deep linking routers, asymmetric portfolio DOM factories, sliding pagination viewports, and core event interception.

## [2.0.2] - 2026-06-30

### Fixed
- **Contextual Menu Unresponsive Items:** Resolved a fatal JavaScript runtime failure (`TypeError`) in the paragraph hover engine caused by a missing reference to the text-to-speech option button. Re-instated the button element and added protective checks to decouple element presence from execution flow.
- **Capture Phase Structural Stability:** Hardened global document-level event listeners to explicitly verify target nodes, preventing runtime crashes when keyboard navigation or empty clicks interact directly with structural layout wrappers instead of standard DOM Elements.
- **Paragraph Cross-Click State Persistence:** Resolved an issue where the contextual menu's copy link button remained stuck in a "Copied" text state when hovering or clicking across multiple separate paragraphs by forcing an immediate string reset upon menu re-initialization.
- **Navigation Loop Desynchronization:** Corrected a routing regression causing Infinite Backwards Loops when navigating between the Case Detail, Video Player, and About views; decoupled history manipulation from structural navigation by implementing explicit stateless routing based on contextual view flags.
- **Granular Paragraph Deep Linking:** Engineered a query parameter tracking solution (`&p=`) to support index-specific paragraph links; integrated visual focus animations alongside native accessibility properties (`aria-current`) to guide assistive technologies directly to the linked node upon asynchronous view transitions.
- **Internationalization Link Synced Sharing:** Synchronized both the paragraph hover share handlers and the AI Dashboard block buttons to respect active `i18n` language parameters (`&lang=`) during clipboard writes and system share sheets.

## [2.0.1] - 2026-06-29
### Fixed
- Fixed an accessibility edge case where the paragraph hover menu remained open after triggering video presentations via keyboard navigation (`Enter` key).
- Resolved an issue with event bubbling inside the case reader overlay using a Capture Phase structural event wrapper.
- Fixed a drop-down visibility bug inside the slider search autocomplete results wrapper.

## [2.0.0] - 2026-06-29
### Title
Second Flight

### Overview
Second major release of Lio Schimanko's Portfolio as an expanded open-source Single-Page Application (SPA).

This version evolves the original app into a broader and more expressive case-study platform for Product Engineers and UX Designers, with deeper storytelling, richer interaction patterns, stronger accessibility coverage, and a more ambitious presentation layer.

### Included
- Expanded interactive case-study portfolio experience.
- Native Bilingual support.
- Accessibility settings, including dark mode, high contrast, large text, dyslexia-friendly font, focus mode, and reduced motion.
- Video presentation player for selected cases.
- Case-study swipe navigation and reading-focused layouts.
- AI chat with contextual portfolio assistance inside reader.
- Richer case database structure with more detailed project narratives.
- Improved state handling across gallery, case, about, and player views.
- More advanced visual transitions, scroll behavior, and presentation logic.
- A better Information Architecture.
- Internationalization (i18n) support across case studies and client-facing labels.
- Dynamic Breadcrumbs.
- Keyboard shortcuts.

### Removed
- Gradient background pulse animation.

### Notes
This release marks the portfolio's v2 evolution and introduces a more ambitious, feature-rich experience built on top of the original public baseline.

As this version also introduces greater technical and interaction complexity, subsequent patch releases should focus on bug fixes, refinement, and stabilization.

## [1.0.0] - 2026-06-16
### Title
First Flight

### Overview
Initial stable release of Lio Schimanko's Portfolio as an open-source Single-Page Application (SPA).

### Included
- Interactive case-study portfolio experience.
- Bilingual support as a simple hyperlink.
- Accessibility settings, including dark mode, high contrast, large text, dyslexia font, and reduced motion.
- Video presentation player for selected cases.
- Case-study swipe navigation and reading-focused layouts.
- AI chat bubble with local context.
- Gradient background pulse animation.


### Notes
This release establishes the public baseline for future improvements and versioned updates.