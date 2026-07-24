// src/App.js

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

class AppShell extends HTMLElement {
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

    connectedCallback() {
        this._loadA11ySettings();
        this._initializeView();
        this.applyThemeTokens();
        this.render();
        this._addEventListeners();
    }

    get portfolioCases() {
        return this._portfolioCases;
    }

    set portfolioCases(value) {
        if (!Array.isArray(value) || value.length === 0) return;
        this._portfolioCases = value;
        this.render();
    }

    setState(newState) {
        Object.assign(this.state, newState);
        this.render();
    }

    getLang(prop) {
        return (prop && prop[this.state.lang]) ? prop[this.state.lang] : (prop && prop['en'] ? prop['en'] : prop);
    }

    applyThemeTokens() {
        const tokens = portfoliableConfig?.themeTokens || {};
        Object.entries(tokens).forEach(([tokenName, tokenValue]) => {
            document.documentElement.style.setProperty(tokenName, tokenValue);
        });
    }

    render() {
        this.renderHome();
        this.renderCaseView();
        this.renderModals();
        this.renderOverlays();
        this.updateHeader();

        this.shadowRoot.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${this.state.currentView}`);
        });
        document.body.setAttribute('data-active-view', this.state.currentView);
    }

    renderHome() {
        const homeView = this.shadowRoot.getElementById('home-view');
        if (!homeView) return;

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

        const mappedItems = this._portfolioCases.map((caseData) => this._mapCaseToGalleryItem(caseData));
        const syncGalleryItems = () => {
            const gallery = homeView.shadowRoot?.querySelector('ds-gallery');
            if (!gallery) return false;
            gallery.itemCount = Number(homeConfig.itemCount) || Math.min(4, mappedItems.length);
            gallery.engine = homeConfig.engine || 'minimal';
            gallery.items = mappedItems;
            return true;
        };

        if (!syncGalleryItems()) {
            requestAnimationFrame(() => {
                syncGalleryItems();
            });
        }
    }

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
            thumbDeviceSrc: caseData.thumbDeviceSrc || '',
            aspectRatio: caseData.aspectRatio || ''
        };
    }

    renderCaseView() {
        const shell = this.shadowRoot.getElementById('case-article-shell');
        if (!shell) return;

        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
        if (!activeCase) {
            shell.innerHTML = `<div class="article-empty">${t('swipe_explore')}</div>`;
            return;
        }

        const title = this.getLang(activeCase.title);
        const year = this.getLang(activeCase.year);
        const body = this.getLang(this.state.isRecruiterMode ? activeCase.descRecruiter : activeCase.desc);
        const primaryLabel = activeCase.videoSrc ? t('btn_pitch') : t('btn_demo');
        const secondary1Label = t('btn_repo');
        const secondary2Label = t('btn_demo');
        const thumbSrc = this.getLang(activeCase.thumbSrc);

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
              category="mobile"
              brand="apple"
              model="Apple iPhone 12"
              color="Black"
              screen-image="${thumbSrc || ''}"
              max-height="320px"
            ></ds-thumbnail>
            ${body || ''}
          </ds-article>
        `;

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

    _handleArticleAction(action, caseData) {
        if (!caseData) return;

        if (action === 'primary') {
            if (caseData.videoSrc) {
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

        if (action === 'secondary1' && caseData.repositoryUrl) {
            window.open(caseData.repositoryUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        if (action === 'secondary2' && caseData.liveUrl) {
            window.open(caseData.liveUrl, '_blank', 'noopener,noreferrer');
        }
    }

    _handleArticleShare(platform, caseData) {
        if (!caseData) return;
        const caseUrl = `${window.location.origin}${window.location.pathname}?case=${encodeURIComponent(caseData.slug || caseData.id)}`;
        const shareText = `${t('share_text')} ${this.getLang(caseData.title)}`;

        if (platform === 'native' && navigator.share) {
            navigator.share({
                title: this.getLang(caseData.title),
                text: shareText,
                url: caseUrl
            }).catch(() => {});
            return;
        }

        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(caseUrl);

        const platformUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            x: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        };

        const target = platformUrls[platform];
        if (target) {
            window.open(target, '_blank', 'noopener,noreferrer');
        }
    }

    renderModals() {
        const modalContainer = this.shadowRoot.getElementById('modal-container');
        if (modalContainer.children.length > 0) return;

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

    renderOverlays() {
        const overlay = this.shadowRoot.getElementById('glass-overlay');
        overlay.classList.toggle('show', this.state.isA11yModalOpen || this.state.isLangModalOpen);

        const toast = this.shadowRoot.getElementById('app-toast');
        toast.setAttribute('visible', this.state.toast.visible.toString());
        toast.innerHTML = this.state.toast.content;
        toast.setAttribute('aria-label', this.state.toast.content.replace(/<[^>]*>?/gm, ''));
    }

    updateHeader() {
        const header = this.shadowRoot.getElementById('app-header');
        if (header) {
            header.style.display = this.state.currentView === 'home' ? 'none' : 'block';
        }

        if (this.state.currentView === 'home') {
            return;
        }

        header.setAttribute('view', this.state.currentView);
        if (this.state.currentView === 'case' && this.state.activeCaseId) {
            const activeCase = this._portfolioCases.find(c => c.id === this.state.activeCaseId);
            if (activeCase) header.setAttribute('current-label', this.getLang(activeCase.title));
        }
    }

    _addEventListeners() {
        const header = this.shadowRoot.getElementById('app-header');
        const a11yModal = this.shadowRoot.getElementById('a11y-modal');
        const langModal = this.shadowRoot.getElementById('lang-modal');
        const toast = this.shadowRoot.getElementById('app-toast');

        this.shadowRoot.addEventListener('ds-case-select', (e) => {
            const dataset = e.target?.dataset || {};
            const directCaseId = dataset.caseId;
            const indexFromGallery = Number.parseInt(dataset.galleryIndex || '', 10);

            if (directCaseId) {
                this.setState({ activeCaseId: directCaseId, currentView: 'case' });
                return;
            }

            if (!Number.isNaN(indexFromGallery) && this._portfolioCases[indexFromGallery]) {
                this.setState({ activeCaseId: this._portfolioCases[indexFromGallery].id, currentView: 'case' });
            }
        });

        header.addEventListener('ds-home-click', () => this.setState({ currentView: 'home' }));
        header.addEventListener('ds-mode-change', (e) => this.setState({ isRecruiterMode: e.detail.mode === 'recruiter' }));

        header.addEventListener('ds-a11y-click', () => this.setState({ isA11yModalOpen: true }));
        header.addEventListener('ds-lang-click', () => this.setState({ isLangModalOpen: true }));
        a11yModal.addEventListener('ds-modal-close', () => this.setState({ isA11yModalOpen: false }));
        langModal.addEventListener('ds-modal-close', () => this.setState({ isLangModalOpen: false }));
        this.shadowRoot.getElementById('glass-overlay').addEventListener('click', () => {
            this.setState({ isA11yModalOpen: false, isLangModalOpen: false });
        });

        a11yModal.addEventListener('ds-row-click', (e) => this._handleA11yChange(e));
        
        toast.addEventListener('ds-toast-click', () => {
            if (this.state.toast.caseId) {
                this.setState({ 
                    currentView: 'case', 
                    activeCaseId: this.state.toast.caseId,
                    toast: { visible: false, content: '' }
                });
            }
        });
        
        window.addEventListener('keydown', (e) => this._handleGlobalKeyDown(e));
    }

    _initializeView() {
        const urlParams = new URLSearchParams(window.location.search);
        const targetCaseId = urlParams.get('case');
        if (targetCaseId) {
            const targetCase = this._portfolioCases.find(c => c.slug === targetCaseId || c.id === targetCaseId);
            if (targetCase) {
                this.setState({ currentView: 'case', activeCaseId: targetCase.id });
                return;
            }
        }

        const resumeCaseId = localStorage.getItem('resumeCaseId');
        const resumeScrollTop = localStorage.getItem('resumeScrollTop');
        if (resumeCaseId && resumeScrollTop) {
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

    _loadA11ySettings() {
        const newA11yState = { ...this.state.a11y };
        Object.keys(newA11yState).forEach(key => {
            const storedValue = localStorage.getItem(`pref-${key.toLowerCase()}`);
            if (storedValue !== null) {
                newA11yState[key] = storedValue === 'true';
            }
        });
        this.state.a11y = newA11yState;
        this.applyA11ySettings();
    }

    _handleA11yChange(e) {
        const key = e.target.id.replace('row-', '');
        const camelKey = key.replace(/(\-\w)/g, m => m[1].toUpperCase());
        const isActive = e.detail.active;

        const newA11yState = { ...this.state.a11y, [camelKey]: isActive };

        if (camelKey === 'darkMode' && isActive) newA11yState.highContrast = false;
        if (camelKey === 'highContrast' && isActive) newA11yState.darkMode = false;
        
        localStorage.setItem(`pref-${camelKey.toLowerCase()}`, isActive);
        this.setState({ a11y: newA11yState });
        this.applyA11ySettings();
    }

    _handleGlobalKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const isMod = e.altKey;
        if (isMod && e.code === 'KeyA') {
            e.preventDefault();
            this.setState({ isA11yModalOpen: !this.state.isA11yModalOpen });
        }
    }

    applyA11ySettings() {
        const htmlEl = document.documentElement;
        const settings = this.state.a11y;
        Object.entries(settings).forEach(([key, value]) => {
            const className = `a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            htmlEl.classList.toggle(className, value);
        });
    }
}

customElements.define('app-shell', AppShell);