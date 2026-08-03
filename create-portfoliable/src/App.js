// File: src/App.js
// Purpose: Render the Portfoliable application shell and route runtime views.
// Author: Lio Schimanko

// === IMPORTS ===
import { getPortfolioCases } from './cases/index.js';
import { t } from './i18n.js';
import portfoliableConfig from '../portfoliable.config.js';
import {
    AudioPlayer,
    Article,
    DsDivider,
    DsItemRow,
    Header,
    HomeView,
    Summary,
    Thumbnail,
    Toast,
    VideoPlayer
} from '@portfoliablejs/valence';

void Article;
void DsDivider;
void DsItemRow;
void Header;
void HomeView;
void Summary;
void Thumbnail;
void Toast;
void VideoPlayer;

const CASEVIEW_HEADER_ATTRIBUTES = [
    'language-tooltip',
    'language-kbd-label',
    'language-kbd-key',
    'language-kbd-show-plus',
    'language-aria-label',
    'accessibility-tooltip',
    'accessibility-kbd-label',
    'accessibility-kbd-key',
    'accessibility-kbd-show-plus',
    'accessibility-aria-label',
    'about-tooltip',
    'about-kbd-label',
    'about-kbd-key',
    'about-kbd-show-plus',
    'about-aria-label',
    'avatar-src',
    'avatar-alt',
    'disabled'
];

const CASEVIEW_ARTICLE_ATTRIBUTES = [
    'kicker',
    'title-text',
    'primary-label',
    'primary-icon',
    'secondary1-label',
    'secondary2-label',
    'show-kicker',
    'show-title',
    'show-social-share',
    'show-social-linkedin',
    'show-social-x',
    'show-social-facebook',
    'show-action-primary',
    'show-action-secondary1',
    'show-action-secondary2',
    'show-summary',
    'show-player',
    'show-toc',
    'show-navigator'
];

// Provides a runtime fallback for older Valence versions that do not ship ds-case-view yet.
if (!customElements.get('ds-case-view')) {
    class RuntimeCaseView extends HTMLElement {
        static get observedAttributes() {
            return ['aria-label', 'show-breadcrumb', 'show-language-menu', ...CASEVIEW_HEADER_ATTRIBUTES, ...CASEVIEW_ARTICLE_ATTRIBUTES];
        }

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this._breadcrumbItems = null;
            this._breadcrumbMenuItems = null;
            this.shadowRoot.innerHTML = `
              <style>
                :host { display: block; width: 100%; box-sizing: border-box; }
                .case-layout { width: 100%; }
                                .header-wrap { width: 100%; margin: 0 0 clamp(20px, 5dvh, 48px) 0; }
                .article-wrap { width: min(1200px, 100%); margin: 0 auto; padding: 0 clamp(12px, 2vw, 28px) clamp(24px, 4dvh, 48px); box-sizing: border-box; }
              </style>
              <section class="case-layout" aria-label="Case view template">
                <div class="header-wrap"><ds-header></ds-header></div>
                <div class="article-wrap">
                  <ds-article>
                    <slot name="thumbnail" slot="thumbnail"></slot>
                    <slot name="summary" slot="summary"></slot>
                    <slot name="player" slot="player"></slot>
                    <slot name="navigator" slot="navigator"></slot>
                    <slot></slot>
                  </ds-article>
                </div>
              </section>
            `;
        }

        connectedCallback() {
            this.layoutEl = this.shadowRoot.querySelector('.case-layout');
            this.headerEl = this.shadowRoot.querySelector('ds-header');
            this.articleEl = this.shadowRoot.querySelector('ds-article');
            this.render();
        }

        attributeChangedCallback(oldName, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (this.layoutEl) this.render();
        }

        set breadcrumbItems(items) {
            this._breadcrumbItems = Array.isArray(items) ? items : null;
            this.render();
        }

        set breadcrumbMenuItems(items) {
            this._breadcrumbMenuItems = Array.isArray(items) ? items : null;
            this.render();
        }

        set showBreadcrumb(value) {
            this.setAttribute('show-breadcrumb', value ? 'true' : 'false');
        }

        set showLanguageMenu(value) {
            this.setAttribute('show-language-menu', value ? 'true' : 'false');
        }

        _forwardAttributes(target, attrList) {
            attrList.forEach((name) => {
                if (this.hasAttribute(name)) {
                    target.setAttribute(name, this.getAttribute(name) || '');
                } else {
                    target.removeAttribute(name);
                }
            });
        }

        render() {
            if (!this.layoutEl || !this.headerEl || !this.articleEl) return;

            this.layoutEl.setAttribute('aria-label', this.getAttribute('aria-label') || 'Case view template');
            this.headerEl.showBreadcrumb = this.getAttribute('show-breadcrumb') !== 'false';
            this.headerEl.showLanguageMenu = this.getAttribute('show-language-menu') !== 'false';
            this.headerEl.breadcrumbItems = this._breadcrumbItems;
            this.headerEl.breadcrumbMenuItems = this._breadcrumbMenuItems;

            this._forwardAttributes(this.headerEl, CASEVIEW_HEADER_ATTRIBUTES);
            this._forwardAttributes(this.articleEl, CASEVIEW_ARTICLE_ATTRIBUTES);
        }
    }

    customElements.define('ds-case-view', RuntimeCaseView);
}

// === COMPONENT TEMPLATE ===
// Defines the static shadow-DOM template used by every AppShell instance.
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { 
      display: block; 
      height: 100vh; 
      width: 100vw; 
            overflow: hidden;
            overflow-x: hidden;
      background-color: var(--color-bg, #FFFFFF);
      color: var(--color-black, #000000);
      font-family: var(--font-family, sans-serif);
            --route-transition-duration: 520ms;
            --route-transition-ease: cubic-bezier(0.22, 1, 0.36, 1);
    }
        main { position: relative; height: 100%; width: 100%; overflow: hidden; overflow-x: hidden; }
        .view {
            position: absolute;
            inset: 0;
            display: flex;
            height: 100%;
            width: 100%;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: none;
            transition: none;
            will-change: opacity;
            overflow-x: hidden;
        }
        .view.active {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            z-index: 2;
        }
    #glass-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: var(--overlay-glass-bg, rgba(0, 0, 0, 0.1));
      backdrop-filter: blur(var(--overlay-glass-blur, 6px));
      -webkit-backdrop-filter: blur(var(--overlay-glass-blur, 6px));
      z-index: var(--z-overlay, 1500);
      opacity: 0; pointer-events: none;
      transition: opacity var(--anim-normal) ease;
    }
    #glass-overlay.show { opacity: 1; pointer-events: auto; }
    .category-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--color-gray-light);
      padding: 4px var(--space-sm) 2px var(--space-sm); margin-top: 2px; display: block;
    }
        #view-home {
            align-items: stretch;
            justify-content: stretch;
            overflow: hidden;
            overscroll-behavior: none;
            touch-action: pan-x;
        }
        #view-case {
            overflow-y: auto;
            overflow-x: hidden;
            align-items: flex-start;
            justify-content: center;
            box-sizing: border-box;
            overscroll-behavior: contain;
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        #view-case::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
        }
        #home-view {
            display: block;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        #case-view {
            display: block;
            width: 100%;
            min-height: 100%;
        }
        #thumb-transition-layer {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 3500;
            contain: layout style paint;
        }
        #thumb-transition-layer .thumb-ghost {
            position: fixed;
            left: 0;
            top: 0;
            transform-origin: top left;
            will-change: transform, opacity, border-radius;
            transition-property: transform, opacity, border-radius;
            box-shadow: 0 18px 46px rgba(0, 0, 0, 0.22);
            overflow: hidden;
            opacity: 1;
            background: transparent;
        }
        #thumb-transition-layer .thumb-ghost > * {
            width: 100%;
            height: 100%;
            display: block;
        }
        #thumb-transition-layer .thumb-ghost img {
            object-fit: cover;
            object-position: center;
            user-select: none;
            pointer-events: none;
        }
        .article-empty {
            width: 100%;
            min-height: 40vh;
            display: grid;
            place-items: center;
            color: var(--color-gray-light);
        }
  </style>
  
  <div id="glass-overlay"></div>
    <div id="thumb-transition-layer" aria-hidden="true"></div>

  <main>
    <div id="view-home" class="view">
            <ds-home-view id="home-view"></ds-home-view>
    </div>
    <div id="view-case" class="view">
            <ds-case-view id="case-view"></ds-case-view>
    </div>
    <div id="view-about" class="view">
      <!-- About content can be added here later -->
    </div>
  </main>
  
  <div id="modal-container"></div>
  <ds-video-player id="video-player"></ds-video-player>
  <ds-toast id="app-toast"></ds-toast>
`;

// === APP SHELL CUSTOM ELEMENT ===
// Coordinates app state, view rendering, event wiring, and accessibility behavior.
class AppShell extends HTMLElement {
    // Initializes shadow DOM, source content, and default runtime state.
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._portfolioCases = getPortfolioCases();
        this._transitionCleanupTimer = null;
        this._galleryPointerDown = null;
        this._pendingThumbnailTransition = null;

        this.state = {
            currentView: 'home',
            activeCaseId: null,
            isRecruiterMode: false,
            lang: window.currentLang || 'en',
            viewHistory: ['home'],
            isA11yModalOpen: false,
            isLangModalOpen: false,
            toast: { visible: false, content: '', caseId: null, scrollTop: 0 },
            a11y: {
                largeText: false, dyslexiaFont: false, darkMode: false,
                highContrast: false, reduceMotion: false, tabNav: false,
            },
        };
    }

    // Runs once the element is attached, applying persisted settings and first render.
    connectedCallback() {
        this._loadA11ySettings();
        this._initializeView();
        this.applyThemeTokens();
        this.render();
        this._addEventListeners();
    }

    // Returns the internal normalized portfolio case list.
    get portfolioCases() {
        return this._portfolioCases;
    }

    // Replaces case list when input is valid and triggers a re-render.
    set portfolioCases(value) {
        if (!Array.isArray(value) || value.length === 0) return;
        this._portfolioCases = value;
        this.render();
    }

    // Merges partial state updates and triggers a full render pass.
    setState(newState) {
        Object.assign(this.state, newState);
        this.render();
    }

    // Determines whether route animation should be disabled.
    _shouldReduceMotion() {
        return Boolean(this.state.a11y.reduceMotion) || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Moves between views with direction-aware motion while preserving reduced-motion accessibility.
    _transitionToView(newState) {
        const nextView = newState.currentView || this.state.currentView;
        const prevView = this.state.currentView;
        const statePatch = { ...newState };
        const transitionCaseId = statePatch.activeCaseId || this.state.activeCaseId;
        const transitionDirection = nextView === 'case' ? 'forward' : 'back';

        if (nextView !== prevView) {
            statePatch.viewHistory = [...this.state.viewHistory, nextView].slice(-20);
        }

        this._prepareThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView);
        this.setAttribute('data-route-direction', nextView === 'case' ? 'forward' : 'back');
        this._cleanupViewTransitions();
        this.setState(statePatch);

        // Keeps the case reader header anchored consistently when entering a case.
        if (nextView === 'case') {
            const caseContainer = this.shadowRoot.getElementById('view-case');
            if (caseContainer) caseContainer.scrollTop = 0;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this._playThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView);
                if (nextView === 'case') {
                    this._animateCaseArticleTextReveal();
                }
            });
        });
    }

    // Removes temporary transition classes after route animations complete.
    _cleanupViewTransitions() {
        this.shadowRoot.querySelectorAll('.view').forEach((viewEl) => {
            viewEl.classList.remove('transitioning', 'entering', 'leaving', 'leaving-start');
        });
        if (this._transitionCleanupTimer) {
            clearTimeout(this._transitionCleanupTimer);
            this._transitionCleanupTimer = null;
        }
    }

    // Resolves localized values from EN/PT objects with English fallback.
    getLang(prop) {
        return (prop && prop[this.state.lang]) ? prop[this.state.lang] : (prop && prop['en'] ? prop['en'] : prop);
    }

    // Applies configured theme tokens onto document root CSS custom properties.
    applyThemeTokens() {
        // Reads token map from configuration with safe empty fallback.
        const tokens = portfoliableConfig?.themeTokens || {};
        // Writes each token onto root element so all components can consume it.
        Object.entries(tokens).forEach(([tokenName, tokenValue]) => {
            document.documentElement.style.setProperty(tokenName, tokenValue);
        });
    }

    // Runs all top-level renderers and updates view activation classes.
    render() {
        this.renderHome();
        this.renderCaseView();
        this.renderModals();
        this.renderOverlays();
        this.updateHeader();

        // Toggles active class for currently selected route view.
        this.shadowRoot.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${this.state.currentView}`);
        });
        // Exposes active view on body for global styling hooks.
        document.body.setAttribute('data-active-view', this.state.currentView);
    }

    // Renders and synchronizes HomeView component properties and gallery items.
    renderHome() {
        // Resolves HomeView custom element inside shadow DOM.
        const homeView = this.shadowRoot.getElementById('home-view');
        if (!homeView) return;

        // Reads runtime home-view configuration.
        const homeConfig = portfoliableConfig?.homeView || {};
        homeView.titleText = this.getLang(homeConfig.title) || t('h1_title');
        homeView.footerText = this.getLang(homeConfig.footer) || t('footer_text');
        homeView.itemCount = Number(homeConfig.itemCount) || Math.min(4, this._portfolioCases.length);
        homeView.engine = homeConfig.engine || 'minimal';

        if (typeof homeConfig.showBreadcrumb === 'boolean') {
            homeView.showBreadcrumb = homeConfig.showBreadcrumb;
        }

        if (typeof homeConfig.showLanguageMenu === 'boolean') {
            homeView.showLanguageMenu = homeConfig.showLanguageMenu;
        }

        // Maps raw case data into gallery-card schema expected by ds-gallery.
        const mappedItems = this._portfolioCases.map((caseData) => this._mapCaseToGalleryItem(caseData));
        // Synchronizes nested ds-gallery props once the component shadow tree is ready.
        const syncGalleryItems = () => {
            // Resolves internal gallery element rendered by ds-home-view.
            const gallery = homeView.shadowRoot?.querySelector('ds-gallery');
            if (!gallery) return false;
            gallery.itemCount = Number(homeConfig.itemCount) || Math.min(4, mappedItems.length);
            gallery.engine = homeConfig.engine || 'minimal';
            gallery.items = mappedItems;
            return true;
        };

        // Retries once on next frame when child gallery is not yet mounted.
        if (!syncGalleryItems()) {
            requestAnimationFrame(() => {
                syncGalleryItems();
            });
        }
    }

    // Converts a parsed case object into the compact gallery-item contract.
    _mapCaseToGalleryItem(caseData) {
        return {
            caseId: caseData.id,
            title: this.getLang(caseData.title),
            shortDesc: this.getLang(caseData.shortDesc),
            readTime: this.getLang(caseData.readTime),
            thumbSrc: this.getLang(caseData.thumbSrc),
            hasVideo: Boolean(caseData.videoSrc),
            hasRepo: Boolean(caseData.repositoryUrl),
            hasLive: Boolean(caseData.liveUrl),
            thumbCategory: caseData.thumbCategory || 'mobile',
            thumbBrand: caseData.thumbBrand || 'apple',
            thumbModel: caseData.thumbModel || 'Apple iPhone 12',
            thumbColor: caseData.thumbColor || 'Black',
            aspectRatio: caseData.aspectRatio || ''
        };
    }

    // Renders active case article panel or empty-state placeholder.
    renderCaseView() {
        // Resolves case-view template mount within case route.
        const caseView = this.shadowRoot.getElementById('case-view');
        if (!caseView) return;

        // Finds the currently selected case by active case ID.
        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
        const homeLabel = t('nav_home');

        caseView.showBreadcrumb = true;
        caseView.showLanguageMenu = true;

        if (!activeCase) {
            caseView.breadcrumbItems = [
                { id: 'home', label: homeLabel, hasMenu: false },
                { id: 'case', label: t('swipe_explore'), hasMenu: false }
            ];
            caseView.setAttribute('title-text', t('swipe_explore'));
            caseView.setAttribute('kicker', '');
            caseView.setAttribute('show-action-primary', 'false');
            caseView.setAttribute('show-action-secondary1', 'false');
            caseView.setAttribute('show-action-secondary2', 'false');
            caseView.setAttribute('show-summary', 'false');
            caseView.setAttribute('show-player', 'false');
            caseView.setAttribute('show-toc', 'false');
            caseView.setAttribute('show-navigator', 'false');
            caseView.innerHTML = `<p class="article-empty">${t('swipe_explore')}</p>`;
            return;
        }

        // Computes localized case header and body values for article rendering.
        const title = this.getLang(activeCase.title);
        // Resolves localized case year string.
        const year = this.getLang(activeCase.year);
        // Resolves localized body HTML based on active mode.
        const body = this.getLang(this.state.isRecruiterMode ? activeCase.descRecruiter : activeCase.desc);
        // Resolves localized summary HTML section when present.
        const summary = this.getLang(activeCase.summary);
        // Resolves localized audio source used by reader/player section when available.
        const audioSrc = this.getLang(this.state.isRecruiterMode ? (activeCase.audioSrcRecruiter || activeCase.audioSrc) : activeCase.audioSrc);
        // Chooses primary CTA label based on video presence.
        const primaryLabel = activeCase.videoSrc ? t('btn_pitch') : t('btn_demo');
        // Sets repository CTA label.
        const secondary1Label = t('btn_repo');
        // Sets live-demo CTA label.
        const secondary2Label = t('btn_demo');
        // Resolves localized thumbnail source path.
        const thumbSrc = this.getLang(activeCase.thumbSrc);
        // Resolves thumbnail device category with fallback.
        const thumbCategory = activeCase.thumbCategory || 'mobile';
        // Resolves thumbnail device brand with fallback.
        const thumbBrand = activeCase.thumbBrand || 'apple';
        // Resolves thumbnail device model with fallback.
        const thumbModel = activeCase.thumbModel || 'Apple iPhone 12';
        // Resolves thumbnail device color with fallback.
        const thumbColor = activeCase.thumbColor || 'Black';
        // Resolves display toggles derived from markdown rules.
        const display = activeCase.display || {};
        const showReader = display.showReader !== false;
        const showSummary = Boolean(display.showSummary);
        const showPlayer = showReader && (display.showPlayer !== false);
        const showToc = showReader && Boolean(display.showToc);
        const showNavigator = showReader && (display.showNavigator !== false);
        const activeCaseIndex = this._portfolioCases.findIndex((item) => item.id === activeCase.id);
        const summaryText = this._extractPlainTextFromHtml(summary);
        const summaryMarkup = showSummary && summaryText
            ? `<ds-summary slot="summary" label-header="Summary" text="${this._escapeHtmlAttr(summaryText)}" show-metrics="false"></ds-summary>`
            : '';

        const playerMarkup = showPlayer
            ? `<ds-audio-player slot="player" label-reader="Reader" playing="false" time="0" duration="184" speed="1X" hide-on-scroll="false" auto-scroll="false" volume="100" muted="false" data-audio-src="${this._escapeHtmlAttr(audioSrc || '')}"></ds-audio-player>`
            : '';

        const navigatorMarkup = showNavigator
            ? `<ds-case-navigator slot="navigator" current-index="${Math.max(0, activeCaseIndex)}" total-cases="${this._portfolioCases.length}" label-prev="Previous" label-next="Next" tooltip-prev="Previous case" tooltip-next="Next case" placeholder="Search cases..."></ds-case-navigator>`
            : '';

                caseView.breadcrumbItems = [
                        { id: 'home', label: homeLabel, hasMenu: false },
                        { id: activeCase.id, label: title, hasMenu: false }
                ];

                caseView.setAttribute('aria-label', title);
                caseView.setAttribute('kicker', year || '');
                caseView.setAttribute('title-text', title);
                caseView.setAttribute('primary-label', primaryLabel);
                caseView.setAttribute('secondary1-label', secondary1Label);
                caseView.setAttribute('secondary2-label', secondary2Label);
                caseView.setAttribute('show-action-primary', 'true');
                caseView.setAttribute('show-action-secondary1', activeCase.repositoryUrl ? 'true' : 'false');
                caseView.setAttribute('show-action-secondary2', activeCase.liveUrl ? 'true' : 'false');
                caseView.setAttribute('show-player', showPlayer ? 'true' : 'false');
                caseView.setAttribute('show-summary', showSummary ? 'true' : 'false');
                caseView.setAttribute('show-social-share', 'true');
                caseView.setAttribute('show-social-linkedin', 'true');
                caseView.setAttribute('show-social-x', 'true');
                caseView.setAttribute('show-social-facebook', 'true');
                caseView.setAttribute('show-toc', showToc ? 'true' : 'false');
                caseView.setAttribute('show-navigator', showNavigator ? 'true' : 'false');

                caseView.innerHTML = `
                    <ds-thumbnail
                        slot="thumbnail"
                        category="${thumbCategory}"
                        brand="${thumbBrand}"
                        model="${thumbModel}"
                        color="${thumbColor}"
                        screen-image="${thumbSrc || ''}"
                        max-height="320px"
                    ></ds-thumbnail>
                    ${summaryMarkup}
                    ${playerMarkup}
                    ${showReader ? (body || '') : ''}
                    ${navigatorMarkup}
                `;

                this._syncCaseViewControls(activeCaseIndex);
    }

    // Configures TOC and navigator after case content is projected into ds-article slots.
    _syncCaseViewControls(activeCaseIndex) {
        requestAnimationFrame(() => {
            const caseView = this.shadowRoot.getElementById('case-view');
            const articleEl = caseView?.shadowRoot?.querySelector('ds-article');
            const tocEl = articleEl?.shadowRoot?.querySelector('.article-toc, ds-toc');

            if (tocEl) {
                // Headings live in case-view light DOM (outside document.querySelector reach from ds-toc), so feed items directly.
                const headings = Array.from(caseView.querySelectorAll('h1, h2, h3, h4'));
                const seenIds = new Set();
                const tocItems = headings.map((heading, index) => {
                    const safeText = (heading.textContent || '').trim();
                    const slug = safeText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `heading-${index + 1}`;
                    let nextId = heading.id || `case-heading-${index + 1}-${slug}`;

                    while (seenIds.has(nextId)) {
                        nextId = `${nextId}-${index + 1}`;
                    }

                    seenIds.add(nextId);
                    heading.id = nextId;

                    return {
                        id: nextId,
                        label: safeText,
                        text: safeText,
                        level: Number.parseInt(heading.tagName.slice(1), 10) || 1
                    };
                }).filter((item) => item.label.length > 0);

                tocEl.items = tocItems;
                tocEl.removeAttribute('opened');
                this._bindCaseTocSelection(tocEl, caseView);
                this._bindCaseTocActiveSync(tocEl, caseView);
                this._lockControlScroll(tocEl);
            }

            const navigatorEl = caseView?.querySelector('ds-case-navigator[slot="navigator"]');
            if (navigatorEl) {
                navigatorEl.setAttribute('current-index', String(Math.max(0, activeCaseIndex)));
                navigatorEl.setAttribute('total-cases', String(this._portfolioCases.length));
                navigatorEl.results = this._portfolioCases.map((caseData, index) => ({
                    id: caseData.id,
                    index,
                    title: this.getLang(caseData.title) || caseData.id,
                    snippet: this.getLang(caseData.shortDesc) || ''
                }));
                this._lockControlScroll(navigatorEl);
            }
        });
    }

    // Disables wheel/touch scrolling on floating controls to keep them visually stable.
    _lockControlScroll(controlEl) {
        if (!controlEl || controlEl.dataset.controlScrollLocked === 'true') {
            return;
        }

        const preventScroll = (event) => {
            event.preventDefault();
        };

        controlEl.addEventListener('wheel', preventScroll, { passive: false });
        controlEl.addEventListener('touchmove', preventScroll, { passive: false });
        controlEl.dataset.controlScrollLocked = 'true';
    }

    // Resolves TOC menu selections against headings rendered inside case-view shadow tree.
    _bindCaseTocSelection(tocEl, caseView) {
        if (!tocEl || !caseView || tocEl.dataset.caseTocBound === 'true') {
            return;
        }

        const menuEl = tocEl.shadowRoot?.querySelector('.toc-menu');
        if (!menuEl) {
            return;
        }

        menuEl.addEventListener('ds-select', (event) => {
            const selectedId = event.detail?.id || event.detail?.item?.id;
            if (!selectedId) return;

            const caseContainer = this.shadowRoot.getElementById('view-case');
            if (selectedId === 'scroll-top') {
                if (caseContainer) {
                    caseContainer.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }

            const heading = Array.from(caseView.querySelectorAll('h1, h2, h3, h4')).find((node) => node.id === selectedId);
            if (heading && caseContainer) {
                const headingRect = heading.getBoundingClientRect();
                const containerRect = caseContainer.getBoundingClientRect();
                const nextTop = caseContainer.scrollTop + (headingRect.top - containerRect.top) - 96;
                caseContainer.scrollTo({
                    top: Math.max(0, nextTop),
                    behavior: 'smooth'
                });
            }

            if (typeof tocEl._setActiveHeading === 'function') {
                tocEl._setActiveHeading(selectedId);
            }
        });

        tocEl.dataset.caseTocBound = 'true';
    }

    // Keeps TOC active/minimap highlight in sync with headings while case container scrolls.
    _bindCaseTocActiveSync(tocEl, caseView) {
        if (!tocEl || !caseView || tocEl.dataset.caseTocActiveSyncBound === 'true') {
            return;
        }

        const caseContainer = this.shadowRoot.getElementById('view-case');
        if (!caseContainer) {
            return;
        }

        const syncActiveFromScroll = () => {
            const headingIds = Array.isArray(tocEl.items) ? tocEl.items.map((item) => item.id) : [];
            const headings = headingIds
                .map((id) => caseView.querySelector(`#${CSS.escape(id)}`))
                .filter(Boolean);

            if (headings.length === 0) {
                return;
            }

            const containerRect = caseContainer.getBoundingClientRect();
            const activationY = containerRect.top + 120;
            let activeHeading = headings[0];

            for (const heading of headings) {
                if (heading.getBoundingClientRect().top <= activationY) {
                    activeHeading = heading;
                } else {
                    break;
                }
            }

            if (typeof tocEl._setActiveHeading === 'function') {
                tocEl._setActiveHeading(activeHeading.id);
            }
        };

        let rafToken = null;
        const onContainerScroll = () => {
            if (rafToken !== null) {
                return;
            }

            rafToken = requestAnimationFrame(() => {
                rafToken = null;
                syncActiveFromScroll();
            });
        };

        caseContainer.addEventListener('scroll', onContainerScroll, { passive: true });
        requestAnimationFrame(syncActiveFromScroll);
        tocEl.dataset.caseTocActiveSyncBound = 'true';
    }

    // Handles article CTA actions (video playback, repository, and live demo links).
    _handleArticleAction(action, caseData) {
        if (!caseData) return;

        // Handles primary action branch (video or live URL fallback).
        if (action === 'primary') {
            if (caseData.videoSrc) {
                // Resolves embedded video player and starts playback for selected case.
                const player = this.shadowRoot.getElementById('video-player');
                if (player) {
                    player.caseData = caseData;
                    player.play();
                }
                return;
            }

            if (caseData.liveUrl) {
                window.open(caseData.liveUrl, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Opens repository URL on secondary action when available.
        if (action === 'secondary1' && caseData.repositoryUrl) {
            window.open(caseData.repositoryUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // Opens live URL on tertiary action when available.
        if (action === 'secondary2' && caseData.liveUrl) {
            window.open(caseData.liveUrl, '_blank', 'noopener,noreferrer');
        }
    }

    // Builds and dispatches sharing actions for native share and social providers.
    _handleArticleShare(platform, caseData) {
        if (!caseData) return;
        // Computes canonical share URL for the active case route.
        const caseUrl = `${window.location.origin}${window.location.pathname}?case=${encodeURIComponent(caseData.slug || caseData.id)}`;
        // Composes share message text with localized case title.
        const shareText = `${t('share_text')} ${this.getLang(caseData.title)}`;

        // Uses the Web Share API when requested and supported.
        if (platform === 'native' && navigator.share) {
            navigator.share({
                title: this.getLang(caseData.title),
                text: shareText,
                url: caseUrl
            }).catch(() => {});
            return;
        }

        // Encodes share payload for social URL query strings.
        const encodedText = encodeURIComponent(shareText);
        // Encodes URL payload for social URL query strings.
        const encodedUrl = encodeURIComponent(caseUrl);

        // Maps provider keys to provider-specific share endpoints.
        const platformUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            x: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        };

        // Opens provider share URL in a safe external tab when supported.
        const target = platformUrls[platform];
        if (target) {
            window.open(target, '_blank', 'noopener,noreferrer');
        }
    }

    // Lazily creates modal elements once and mounts them in modal container.
    renderModals() {
        // Resolves modal container element used to host app modals.
        const modalContainer = this.shadowRoot.getElementById('modal-container');
        if (modalContainer.children.length > 0) return;

        // Creates accessibility settings modal with grouped toggle rows.
        const a11yModal = document.createElement('ds-modal');
        a11yModal.id = 'a11y-modal';
        a11yModal.setAttribute('title', t('popup_a11y_title'));
        a11yModal.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span class="category-title">${t('a11y_cat_typography')}</span>
              <ds-item-row id="row-largeText" icon="text-size" label="${t('a11y_size')}" control="font-size"></ds-item-row>
              <ds-item-row id="row-dyslexiaFont" icon="flag-shield" label="${t('a11y_dyslexia')}" control="toggle"></ds-item-row>
              <ds-divider style="margin: 4px 0;"></ds-divider>
              <span class="category-title">${t('a11y_cat_visuals')}</span>
              <ds-item-row id="row-darkMode" icon="moon" label="${t('a11y_dark')}" control="toggle"></ds-item-row>
              <ds-item-row id="row-highContrast" icon="eye-open" label="${t('a11y_contrast')}" control="toggle"></ds-item-row>
              <ds-divider style="margin: 4px 0;"></ds-divider>
              <span class="category-title">${t('a11y_cat_motion')}</span>
              <ds-item-row id="row-reduceMotion" icon="motion-play" label="${t('a11y_motion')}" control="toggle"></ds-item-row>
              <ds-item-row id="row-tabNav" icon="tab-nav" label="${t('a11y_tab')}" control="toggle"></ds-item-row>
            </div>
        `;
        modalContainer.appendChild(a11yModal);

        // Creates language selection modal with available locale options.
        const langModal = document.createElement('ds-modal');
        langModal.id = 'lang-modal';
        langModal.setAttribute('title', t('popup_lang_title'));
        langModal.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <ds-item-row data-lang="en" icon="language" label="${t('lang_en')}" control="check"></ds-item-row>
              <ds-divider></ds-divider>
              <ds-item-row data-lang="pt" icon="language" label="${t('lang_pt')}" control="check"></ds-item-row>
              <ds-divider></ds-divider>
              <ds-item-row data-lang="pirate" icon="pirate-shield" label="${t('lang_pirate')}" control="check"></ds-item-row>
            </div>
        `;
        modalContainer.appendChild(langModal);
    }

    // Synchronizes overlay and toast UI with current state.
    renderOverlays() {
        // Resolves frosted overlay that blocks background interaction when modals are open.
        const overlay = this.shadowRoot.getElementById('glass-overlay');
        overlay.classList.toggle('show', this.state.isA11yModalOpen || this.state.isLangModalOpen);

        // Resolves toast component used for resume-reading prompts.
        const toast = this.shadowRoot.getElementById('app-toast');
        toast.setAttribute('visible', this.state.toast.visible.toString());
        toast.innerHTML = this.state.toast.content;
        toast.setAttribute('aria-label', this.state.toast.content.replace(/<[^>]*>?/gm, ''));
    }

    // Updates header visibility and active-case label based on current view state.
    updateHeader() {
        // Header behavior is owned by templates (`ds-home-view` and `ds-case-view`).
    }

    // Registers all event listeners for case navigation, modals, toast, and keyboard controls.
    _addEventListeners() {
        // Resolves frequently used component references for event binding.
        const caseView = this.shadowRoot.getElementById('case-view');
        // Resolves accessibility modal element.
        const a11yModal = this.shadowRoot.getElementById('a11y-modal');
        // Resolves language modal element.
        const langModal = this.shadowRoot.getElementById('lang-modal');
        // Resolves toast element.
        const toast = this.shadowRoot.getElementById('app-toast');

        // Handles case selection emitted from HomeView/gallery interactions.
        this.shadowRoot.addEventListener('ds-case-select', (e) => {
            // Resolves case identifier from detail payload, target dataset, or composed path datasets.
            const resolvedCaseId = this._resolveCaseIdFromEvent(e);

            if (resolvedCaseId) {
                this._openCaseById(resolvedCaseId);
                return;
            }
        });

        // Opens matching case from navigator autocomplete selections.
        this.shadowRoot.addEventListener('ds-search-select', (e) => {
            const resolvedCaseId = this._resolveCaseIdFromEvent(e);
            if (!resolvedCaseId) return;
            this._openCaseById(resolvedCaseId);
        });

        // Captures pointer start on gallery cards for tap fallback detection.
        this.shadowRoot.addEventListener('pointerdown', (e) => {
            if (this.state.currentView !== 'home') return;

            const galleryIndex = this._resolveGalleryIndexFromEvent(e);
            if (galleryIndex === null) return;

            this._galleryPointerDown = {
                pointerId: e.pointerId,
                x: e.clientX,
                y: e.clientY,
                galleryIndex
            };
        });

        // Opens case on tap-like pointer interactions even when click is suppressed by drag logic.
        this.shadowRoot.addEventListener('pointerup', (e) => {
            if (this.state.currentView !== 'home') return;
            if (!this._galleryPointerDown) return;
            if (this._galleryPointerDown.pointerId !== e.pointerId) return;

            const dx = e.clientX - this._galleryPointerDown.x;
            const dy = e.clientY - this._galleryPointerDown.y;
            const distance = Math.hypot(dx, dy);
            const tappedIndex = this._galleryPointerDown.galleryIndex;
            this._galleryPointerDown = null;

            // 10px keeps intentional drags from opening a case while allowing natural tap jitter.
            if (distance <= 10) {
                this._openCaseByIndex(tappedIndex);
            }
        });

        // Fallback: open case route when a gallery card is clicked even if ds-case-select target payload is missing.
        this.shadowRoot.addEventListener('click', (e) => {
            if (this.state.currentView !== 'home') return;

            const indexFromCard = this._resolveGalleryIndexFromEvent(e);
            this._openCaseByIndex(indexFromCard);
        });

        // Handles CaseView breadcrumb/home events to return to gallery route.
        caseView.addEventListener('ds-breadcrumb-home', () => this._transitionToView({ currentView: 'home', activeCaseId: null }));
        caseView.addEventListener('ds-breadcrumb-return', () => this._transitionToView({ currentView: 'home' }));

        // Opens accessibility and language modals from CaseView header actions.
        caseView.addEventListener('ds-navigation-menu-accessibility', () => this.setState({ isA11yModalOpen: true }));
        caseView.addEventListener('ds-navigation-menu-language', () => this.setState({ isLangModalOpen: true }));

        // Applies language changes selected from CaseView header menu.
        caseView.addEventListener('ds-navigation-menu-language-select', (event) => {
            const nextLang = event.detail?.id;
            if (!nextLang || nextLang === this.state.lang) return;

            window.currentLang = nextLang;
            document.documentElement.lang = nextLang === 'pt' ? 'pt-BR' : 'en-US';

            const params = new URLSearchParams(window.location.search);
            params.set('lang', nextLang);
            const queryString = params.toString();
            const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash || ''}`;
            window.history.replaceState({}, '', nextUrl);

            this.setState({ lang: nextLang });
        });

        // Applies accessibility toggles selected from CaseView header menu.
        caseView.addEventListener('ds-navigation-menu-accessibility-select', (event) => {
            const item = event.detail?.item;
            if (!item || typeof item.active !== 'boolean') return;

            const keyByItemId = {
                'text-size': 'largeText',
                'dyslexia-font': 'dyslexiaFont',
                'dark-mode': 'darkMode',
                'high-contrast': 'highContrast',
                'reduce-motion': 'reduceMotion',
                'tab-navigation': 'tabNav'
            };

            const stateKey = keyByItemId[item.id];
            if (!stateKey) return;

            const newA11yState = { ...this.state.a11y, [stateKey]: item.active };
            if (stateKey === 'darkMode' && item.active) newA11yState.highContrast = false;
            if (stateKey === 'highContrast' && item.active) newA11yState.darkMode = false;

            Object.entries(newA11yState).forEach(([key, value]) => {
                localStorage.setItem(`pref-${key.toLowerCase()}`, String(Boolean(value)));
            });

            this.setState({ a11y: newA11yState });
            this.applyA11ySettings();
        });

        // Handles article actions and share events bubbling from CaseView.
        caseView.addEventListener('ds-article-action', (event) => {
            const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
            this._handleArticleAction(event.detail?.action, activeCase);
        });

        caseView.addEventListener('ds-article-share', (event) => {
            const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
            this._handleArticleShare(event.detail?.platform, activeCase);
        });

        // Syncs article thumbnail retraction to case container scroll (ds-article listens to window scroll by default).
        const caseContainer = this.shadowRoot.getElementById('view-case');
        caseContainer.addEventListener('scroll', () => this._syncCaseArticleThumbnailWithContainerScroll());

        // Closes accessibility modal when modal close event is emitted.
        a11yModal.addEventListener('ds-modal-close', () => this.setState({ isA11yModalOpen: false }));
        // Closes language modal when modal close event is emitted.
        langModal.addEventListener('ds-modal-close', () => this.setState({ isLangModalOpen: false }));
        // Closes any open modal when clicking the glass overlay.
        this.shadowRoot.getElementById('glass-overlay').addEventListener('click', () => {
            this.setState({ isA11yModalOpen: false, isLangModalOpen: false });
        });

        // Handles updates from accessibility toggle rows.
        a11yModal.addEventListener('ds-row-click', (e) => this._handleA11yChange(e));
        
        // Restores case view from toast CTA when resume context exists.
        toast.addEventListener('ds-toast-click', () => {
            if (this.state.toast.caseId) {
                this._transitionToView({ 
                    currentView: 'case', 
                    activeCaseId: this.state.toast.caseId,
                    toast: { visible: false, content: '' }
                });
            }
        });
        
        // Handles global keyboard shortcuts.
        window.addEventListener('keydown', (e) => this._handleGlobalKeyDown(e));
    }

    // Extracts active case id from gallery select events across shadow-boundary retargeting scenarios.
    _resolveCaseIdFromEvent(event) {
        const fromDetail = event.detail?.caseId;
        if (fromDetail) return fromDetail;

        const fromDetailId = event.detail?.id;
        if (fromDetailId && this._portfolioCases.some((item) => item.id === fromDetailId)) {
            return fromDetailId;
        }

        const fromDetailItemId = event.detail?.item?.id;
        if (fromDetailItemId && this._portfolioCases.some((item) => item.id === fromDetailItemId)) {
            return fromDetailItemId;
        }

        const fromDetailIndex = Number.parseInt(event.detail?.index ?? '', 10);
        if (!Number.isNaN(fromDetailIndex) && this._portfolioCases[fromDetailIndex]) {
            return this._portfolioCases[fromDetailIndex].id;
        }

        const directTargetDataset = event.target?.dataset || {};
        if (directTargetDataset.caseId) return directTargetDataset.caseId;

        const fromDirectIndex = Number.parseInt(directTargetDataset.galleryIndex || '', 10);
        if (!Number.isNaN(fromDirectIndex) && this._portfolioCases[fromDirectIndex]) {
            return this._portfolioCases[fromDirectIndex].id;
        }

        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        for (const node of path) {
            const dataset = node?.dataset;
            if (!dataset) continue;

            if (dataset.caseId) return dataset.caseId;

            const indexFromPath = Number.parseInt(dataset.galleryIndex || '', 10);
            if (!Number.isNaN(indexFromPath) && this._portfolioCases[indexFromPath]) {
                return this._portfolioCases[indexFromPath].id;
            }
        }

        return null;
    }

    // Extracts gallery index from composed path for shadow-DOM-safe hit testing.
    _resolveGalleryIndexFromEvent(event) {
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        for (const node of path) {
            const dataset = node?.dataset;
            if (!dataset) continue;

            const galleryIndex = Number.parseInt(dataset.galleryIndex || '', 10);
            if (!Number.isNaN(galleryIndex)) return galleryIndex;
        }
        return null;
    }

    // Mirrors ds-article scroll transition progress using case container scrollTop.
    _syncCaseArticleThumbnailWithContainerScroll() {
        if (this.state.currentView !== 'case') return;

        const caseContainer = this.shadowRoot.getElementById('view-case');
        const caseView = this.shadowRoot.getElementById('case-view');
        const articleEl = caseView?.shadowRoot?.querySelector('ds-article');
        if (!caseContainer || !articleEl || typeof articleEl._applyThumbnailProgress !== 'function') return;

        const threshold = 120;
        const transitionRange = 240;
        const rawProgress = (caseContainer.scrollTop - threshold) / transitionRange;
        const clamped = Math.min(1, Math.max(0, rawProgress));

        const eased = clamped < 0.5
            ? 4 * clamped * clamped * clamped
            : 1 - Math.pow(-2 * clamped + 2, 3) / 2;

        articleEl._applyThumbnailProgress(eased);
    }

    // Escapes dynamic text used inside HTML attributes.
    _escapeHtmlAttr(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Converts summary HTML fragments into plain text consumed by ds-summary.
    _extractPlainTextFromHtml(html) {
        if (!html) return '';
        const host = document.createElement('div');
        host.innerHTML = String(html);
        return (host.textContent || '').replace(/\s+/g, ' ').trim();
    }

    // Animates case article text with a minimalist bottom-to-top staggered reveal.
    _animateCaseArticleTextReveal() {
        if (this._shouldReduceMotion()) return;
        if (this.state.currentView !== 'case') return;

        const resolveAndAnimate = (attempt = 0) => {
            const caseView = this.shadowRoot.getElementById('case-view');
            if (!caseView) return;

            const nodes = caseView.querySelectorAll('h1, h2, h3, h4, p, li, blockquote');
            if (nodes.length === 0 && attempt < 10) {
                requestAnimationFrame(() => resolveAndAnimate(attempt + 1));
                return;
            }

            nodes.forEach((node, index) => {
                if (!(node instanceof HTMLElement)) return;
                node.animate(
                    [
                        { opacity: 0, transform: 'translateY(14px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ],
                    {
                        duration: 420,
                        delay: Math.min(index, 14) * 20,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        fill: 'both'
                    }
                );
            });
        };

        resolveAndAnimate();
    }

    // Resolves the most representative screenshot/image source from a thumbnail element.
    _extractThumbnailImageSource(element) {
        if (!(element instanceof HTMLElement)) return '';

        const pickSrc = (root) => {
            if (!root) return '';
            const preferred = root.querySelector('img[alt*="Screen" i], img[alt*="cover" i], img[slot="screen"]');
            if (preferred?.src) return preferred.src;
            const fallback = root.querySelector('img');
            return fallback?.src || '';
        };

        return pickSrc(element.shadowRoot) || pickSrc(element) || '';
    }

    // Waits until a target thumbnail image is available to avoid flashing placeholder backgrounds.
    _waitForThumbnailReady(element, timeoutMs = 520) {
        return new Promise((resolve) => {
            if (!(element instanceof HTMLElement)) {
                resolve();
                return;
            }

            const tryResolveImage = () => {
                const image = element.shadowRoot?.querySelector('img') || element.querySelector('img');
                if (!image) return false;
                if (image.complete && image.naturalWidth > 0) {
                    resolve();
                    return true;
                }
                image.addEventListener('load', () => resolve(), { once: true });
                image.addEventListener('error', () => resolve(), { once: true });
                return true;
            };

            if (tryResolveImage()) return;

            const pollId = setInterval(() => {
                if (tryResolveImage()) {
                    clearInterval(pollId);
                }
            }, 32);

            setTimeout(() => {
                clearInterval(pollId);
                resolve();
            }, timeoutMs);
        });
    }

    // Resolves the home-view gallery thumbnail element for a given case id.
    _getHomeThumbnailElementByCaseId(caseId) {
        if (!caseId) return null;
        const caseIndex = this._portfolioCases.findIndex((item) => item.id === caseId);
        if (caseIndex < 0) return null;

        const homeView = this.shadowRoot.getElementById('home-view');
        const gallery = homeView?.shadowRoot?.querySelector('ds-gallery');
        const galleryItems = gallery?.shadowRoot?.querySelectorAll('ds-gallery-item');
        const itemEl = galleryItems?.[caseIndex];
        if (!itemEl) return null;

        const source = itemEl.shadowRoot?.querySelector('ds-thumbnail')
            || itemEl.shadowRoot?.querySelector('.case-thumb-wrapper')
            || itemEl;

        return source instanceof HTMLElement ? source : null;
    }

    // Resolves the active case-view thumbnail element used inside ds-article.
    _getCaseThumbnailElement() {
        const caseView = this.shadowRoot.getElementById('case-view');
        const article = caseView?.shadowRoot?.querySelector('ds-article');
        const source = article?.shadowRoot?.querySelector('.thumbnail-column ds-thumbnail')
            || article?.shadowRoot?.querySelector('ds-thumbnail')
            || article?.shadowRoot?.querySelector('.thumbnail-column');
        return source instanceof HTMLElement ? source : null;
    }

    // Captures source thumbnail geometry before route swap for shared transition animation.
    _prepareThumbnailTransition(direction, caseId, prevView, nextView) {
        this._pendingThumbnailTransition = null;
        if (!caseId) return;
        if (this._shouldReduceMotion()) return;
        if (!((prevView === 'home' && nextView === 'case') || (prevView === 'case' && nextView === 'home'))) return;

        const sourceEl = direction === 'forward'
            ? this._getHomeThumbnailElementByCaseId(caseId)
            : this._getCaseThumbnailElement();

        if (!sourceEl) return;
        const sourceRect = sourceEl.getBoundingClientRect();
        if (sourceRect.width <= 0 || sourceRect.height <= 0) return;

        this._pendingThumbnailTransition = {
            caseId,
            direction,
            sourceRect,
            sourceEl,
            sourceImageSrc: this._extractThumbnailImageSource(sourceEl)
        };
    }

    // Plays the shared-element thumbnail movement between home and case views.
    async _playThumbnailTransition(direction, caseId, prevView, nextView, attempt = 0) {
        const pending = this._pendingThumbnailTransition;

        if (!pending || !caseId) return;
        if (!((prevView === 'home' && nextView === 'case') || (prevView === 'case' && nextView === 'home'))) return;

        const targetEl = direction === 'forward'
            ? this._getCaseThumbnailElement()
            : this._getHomeThumbnailElementByCaseId(caseId);
        if (!targetEl) {
            if (attempt < 10) {
                requestAnimationFrame(() => {
                    this._playThumbnailTransition(direction, caseId, prevView, nextView, attempt + 1);
                });
                return;
            }
            this._pendingThumbnailTransition = null;
            return;
        }

        this._pendingThumbnailTransition = null;

        const targetRect = targetEl.getBoundingClientRect();
        if (targetRect.width <= 0 || targetRect.height <= 0) return;

        const layer = this.shadowRoot.getElementById('thumb-transition-layer');
        if (!layer) return;
        layer.innerHTML = '';

        const ghost = document.createElement('div');
        ghost.className = 'thumb-ghost';
        ghost.style.left = `${pending.sourceRect.left}px`;
        ghost.style.top = `${pending.sourceRect.top}px`;
        ghost.style.width = `${pending.sourceRect.width}px`;
        ghost.style.height = `${pending.sourceRect.height}px`;
        ghost.style.borderRadius = '24px';

        const ghostImage = document.createElement('img');
        ghostImage.alt = '';
        ghostImage.setAttribute('aria-hidden', 'true');
        ghostImage.draggable = false;
        ghostImage.src = pending.sourceImageSrc || this._extractThumbnailImageSource(targetEl) || '';
        ghost.appendChild(ghostImage);
        layer.appendChild(ghost);

        const sourceEl = pending.sourceEl instanceof HTMLElement ? pending.sourceEl : null;
        const previousSourceOpacity = sourceEl?.style.opacity || '';
        if (sourceEl) sourceEl.style.opacity = '0';

        const previousTargetVisibility = targetEl.style.visibility;
        const previousTargetOpacity = targetEl.style.opacity;
        targetEl.style.visibility = 'visible';
        targetEl.style.opacity = '0';

        const sx = targetRect.width / pending.sourceRect.width;
        const sy = targetRect.height / pending.sourceRect.height;
        const uniformScale = (sx + sy) / 2;
        const scaledWidth = pending.sourceRect.width * uniformScale;
        const scaledHeight = pending.sourceRect.height * uniformScale;
        const dx = (targetRect.left + ((targetRect.width - scaledWidth) / 2)) - pending.sourceRect.left;
        const dy = (targetRect.top + ((targetRect.height - scaledHeight) / 2)) - pending.sourceRect.top;
        const duration = 520;

        ghost.style.transitionDuration = `${duration}ms`;
        ghost.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';

        this._waitForThumbnailReady(targetEl, duration + 180).then(() => {
            targetEl.animate(
                [
                    { opacity: 0 },
                    { opacity: 1 }
                ],
                {
                    duration: 260,
                    delay: Math.floor(duration * 0.48),
                    easing: 'linear',
                    fill: 'forwards'
                }
            );
        });

        const finish = () => {
            ghost.remove();
            layer.innerHTML = '';
            targetEl.style.visibility = previousTargetVisibility;
            targetEl.style.opacity = previousTargetOpacity;
            if (sourceEl) sourceEl.style.opacity = previousSourceOpacity;
        };

        ghost.addEventListener('transitionend', finish, { once: true });
        setTimeout(finish, duration + 80);

        requestAnimationFrame(() => {
            ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${uniformScale})`;
            ghost.style.borderRadius = '16px';
            ghost.style.opacity = '0';
        });
    }

    // Opens a case route by normalized case ID when available.
    _openCaseById(caseId) {
        if (!caseId) return;
        if (!this._portfolioCases.find((item) => item.id === caseId)) return;
        this._transitionToView({ activeCaseId: caseId, currentView: 'case' });
    }

    // Opens a case route from gallery index when the index is valid.
    _openCaseByIndex(index) {
        if (index === null || Number.isNaN(index)) return;
        if (!this._portfolioCases[index]) return;
        this._openCaseById(this._portfolioCases[index].id);
    }

    // Initializes starting view from URL params or persisted resume state.
    _initializeView() {
        // Parses URL params for deep-link case route.
        const urlParams = new URLSearchParams(window.location.search);
        // Reads target case identifier from query string.
        const targetCaseId = urlParams.get('case');
        if (targetCaseId) {
            // Resolves case by slug or ID to support both link styles.
            const targetCase = this._portfolioCases.find(c => c.slug === targetCaseId || c.id === targetCaseId);
            if (targetCase) {
                this.setState({ currentView: 'case', activeCaseId: targetCase.id });
                return;
            }
        }

        // Reads persisted resume case ID from local storage.
        const resumeCaseId = localStorage.getItem('resumeCaseId');
        // Reads persisted resume scroll offset from local storage.
        const resumeScrollTop = localStorage.getItem('resumeScrollTop');
        if (resumeCaseId && resumeScrollTop) {
            // Resolves resume case metadata to populate toast content.
            const caseData = this._portfolioCases.find(c => c.id === resumeCaseId);
            if (caseData) {
                this.setState({
                    toast: {
                        visible: true,
                        content: `${t('resume_reading')} <strong>${this.getLang(caseData.title)}</strong>`,
                        caseId: resumeCaseId,
                        scrollTop: parseInt(resumeScrollTop, 10)
                    }
                });
            }
        }
    }

    // Loads accessibility preferences from local storage and applies them to DOM.
    _loadA11ySettings() {
        // Clones default accessibility state before applying persisted overrides.
        const newA11yState = { ...this.state.a11y };
        // Iterates known a11y keys and resolves their persisted values.
        Object.keys(newA11yState).forEach(key => {
            // Reads persisted value for each a11y key.
            const storedValue = localStorage.getItem(`pref-${key.toLowerCase()}`);
            if (storedValue !== null) {
                newA11yState[key] = storedValue === 'true';
            }
        });
        this.state.a11y = newA11yState;
        this.applyA11ySettings();
    }

    // Applies a single accessibility toggle change and enforces exclusive-mode rules.
    _handleA11yChange(e) {
        // Parses toggle key from row ID format.
        const key = e.target.id.replace('row-', '');
        // Converts dashed key names into camelCase state keys.
        const camelKey = key.replace(/(\-\w)/g, m => m[1].toUpperCase());
        // Reads active state emitted by the row control.
        const isActive = e.detail.active;

        // Builds next accessibility state snapshot.
        const newA11yState = { ...this.state.a11y, [camelKey]: isActive };

        // Enforces mutual exclusivity between dark mode and high contrast toggles.
        if (camelKey === 'darkMode' && isActive) newA11yState.highContrast = false;
        if (camelKey === 'highContrast' && isActive) newA11yState.darkMode = false;
        
        // Persists updated preference and re-renders with new settings.
        localStorage.setItem(`pref-${camelKey.toLowerCase()}`, isActive);
        this.setState({ a11y: newA11yState });
        this.applyA11ySettings();
    }

    // Handles global keyboard shortcuts that are valid outside text inputs.
    _handleGlobalKeyDown(e) {
        // Ignores shortcuts when user is actively typing in text controls.
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // Uses Alt/Option as the modifier key for shell-level shortcuts.
        const isMod = e.altKey;
        // Toggles accessibility modal with Alt/Option + A.
        if (isMod && e.code === 'KeyA') {
            e.preventDefault();
            this.setState({ isA11yModalOpen: !this.state.isA11yModalOpen });
        }
    }

    // Applies accessibility class flags on document element for global CSS hooks.
    applyA11ySettings() {
        // Resolves root html element where a11y classes are toggled.
        const htmlEl = document.documentElement;
        // Reads current accessibility state snapshot.
        const settings = this.state.a11y;
        // Converts each setting key to class form and toggles it based on value.
        Object.entries(settings).forEach(([key, value]) => {
            // Builds class token in a11y-kebab-case format.
            const className = `a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            htmlEl.classList.toggle(className, value);
        });
    }
}

// Registers the root custom element used as the runtime application shell.
customElements.define('app-shell', AppShell);