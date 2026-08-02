// File: src/App.js
// Purpose: Render the Portfoliable application shell and route runtime views.
// Author: Lio Schimanko

// === IMPORTS ===
import { getPortfolioCases } from './cases/index.js';
import { t } from './i18n.js';
import portfoliableConfig from '../portfoliable.config.js';
import {
    Article,
    DsDivider,
    DsItemRow,
    Header,
    HomeView,
    Thumbnail,
    Toast,
    VideoPlayer
} from '@portfoliablejs/valence';

void Article;
void DsDivider;
void DsItemRow;
void Header;
void HomeView;
void Thumbnail;
void Toast;
void VideoPlayer;

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
      background-color: var(--color-bg, #FFFFFF);
      color: var(--color-black, #000000);
      font-family: var(--font-family, sans-serif);
    }
    main { height: 100%; width: 100%; }
    .view { display: none; height: 100%; width: 100%; }
    .view.active { display: flex; }
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
        #view-case {
            overflow-y: auto;
            align-items: flex-start;
            justify-content: center;
            padding: clamp(12px, 2vw, 28px);
            box-sizing: border-box;
        }
        .article-shell {
            width: min(1040px, 100%);
            display: block;
            padding: 0;
            margin: 0 auto;
            box-sizing: border-box;
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
    <ds-header id="app-header"></ds-header>

  <main>
    <div id="view-home" class="view">
            <ds-home-view id="home-view"></ds-home-view>
    </div>
    <div id="view-case" class="view">
            <div id="case-article-shell" class="article-shell"></div>
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
        // Resolves article mount shell within the case view.
        const shell = this.shadowRoot.getElementById('case-article-shell');
        if (!shell) return;

        // Finds the currently selected case by active case ID.
        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
        if (!activeCase) {
            shell.innerHTML = `<div class="article-empty">${t('swipe_explore')}</div>`;
            return;
        }

        // Computes localized case header and body values for article rendering.
        const title = this.getLang(activeCase.title);
        // Resolves localized case year string.
        const year = this.getLang(activeCase.year);
        // Resolves localized body HTML based on active mode.
        const body = this.getLang(this.state.isRecruiterMode ? activeCase.descRecruiter : activeCase.desc);
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

        shell.innerHTML = `
          <ds-article
            aria-label="${title}"
            kicker="${year || ''}"
            title-text="${title}"
            primary-label="${primaryLabel}"
            secondary1-label="${secondary1Label}"
            secondary2-label="${secondary2Label}"
                        show-action-primary="true"
                        show-action-secondary1="${activeCase.repositoryUrl ? 'true' : 'false'}"
                        show-action-secondary2="${activeCase.liveUrl ? 'true' : 'false'}"
            show-player="false"
            show-summary="false"
            show-social-share="true"
            show-social-linkedin="true"
            show-social-x="true"
            show-social-facebook="true"
            show-navigator="false"
          >
            <ds-thumbnail
              slot="thumbnail"
                            category="${thumbCategory}"
                            brand="${thumbBrand}"
                            model="${thumbModel}"
                            color="${thumbColor}"
              screen-image="${thumbSrc || ''}"
              max-height="320px"
            ></ds-thumbnail>
            ${body || ''}
          </ds-article>
        `;

        // Wires article action and share events to shell-level handlers.
        const articleEl = shell.querySelector('ds-article');
        if (articleEl) {
            articleEl.addEventListener('ds-article-action', (event) => {
                this._handleArticleAction(event.detail?.action, activeCase);
            });

            articleEl.addEventListener('ds-article-share', (event) => {
                this._handleArticleShare(event.detail?.platform, activeCase);
            });
        }
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
        // Resolves header component instance.
        const header = this.shadowRoot.getElementById('app-header');
        if (header) {
            header.style.display = this.state.currentView === 'home' ? 'none' : 'block';
        }

        if (this.state.currentView === 'home') {
            return;
        }

        header.setAttribute('view', this.state.currentView);
        if (this.state.currentView === 'case' && this.state.activeCaseId) {
            // Resolves active case for contextual header label.
            const activeCase = this._portfolioCases.find(c => c.id === this.state.activeCaseId);
            if (activeCase) header.setAttribute('current-label', this.getLang(activeCase.title));
        }
    }

    // Registers all event listeners for case navigation, modals, toast, and keyboard controls.
    _addEventListeners() {
        // Resolves frequently used component references for event binding.
        const header = this.shadowRoot.getElementById('app-header');
        // Resolves accessibility modal element.
        const a11yModal = this.shadowRoot.getElementById('a11y-modal');
        // Resolves language modal element.
        const langModal = this.shadowRoot.getElementById('lang-modal');
        // Resolves toast element.
        const toast = this.shadowRoot.getElementById('app-toast');

        // Handles case selection emitted from HomeView/gallery interactions.
        this.shadowRoot.addEventListener('ds-case-select', (e) => {
            // Reads dataset payload from event source element.
            const dataset = e.target?.dataset || {};
            // Reads direct case ID when available.
            const directCaseId = dataset.caseId;
            // Parses gallery index fallback used by some gallery event payloads.
            const indexFromGallery = Number.parseInt(dataset.galleryIndex || '', 10);

            if (directCaseId) {
                this.setState({ activeCaseId: directCaseId, currentView: 'case' });
                return;
            }

            if (!Number.isNaN(indexFromGallery) && this._portfolioCases[indexFromGallery]) {
                this.setState({ activeCaseId: this._portfolioCases[indexFromGallery].id, currentView: 'case' });
            }
        });

        // Handles direct header navigation back to home view.
        header.addEventListener('ds-home-click', () => this.setState({ currentView: 'home' }));
        // Handles recruiter/overview mode switch emitted by header UI.
        header.addEventListener('ds-mode-change', (e) => this.setState({ isRecruiterMode: e.detail.mode === 'recruiter' }));

        // Opens accessibility modal from header action.
        header.addEventListener('ds-a11y-click', () => this.setState({ isA11yModalOpen: true }));
        // Opens language modal from header action.
        header.addEventListener('ds-lang-click', () => this.setState({ isLangModalOpen: true }));
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
                this.setState({ 
                    currentView: 'case', 
                    activeCaseId: this.state.toast.caseId,
                    toast: { visible: false, content: '' }
                });
            }
        });
        
        // Handles global keyboard shortcuts.
        window.addEventListener('keydown', (e) => this._handleGlobalKeyDown(e));
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