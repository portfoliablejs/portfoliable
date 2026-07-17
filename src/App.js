// src/App.js

import { portfolioCases } from './data.js';
import { t, applyTranslations } from './i18n.js';
import '@portfoliablejs/valence';

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
    /* Styles for the slider container, previously in case-viewer.css */
    .case-slider-container {
        display: flex;
        width: 100%;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        scrollbar-width: none;
        cursor: grab;
    }
    .case-slider-container::-webkit-scrollbar { display: none; }
    .case-slider-container.dragging {
        scroll-snap-type: none;
        scroll-behavior: auto;
        cursor: grabbing;
    }
  </style>
  
  <div id="glass-overlay"></div>
  <ds-header id="app-header"></ds-header>

  <main>
    <div id="view-home" class="view">
      <ds-gallery id="gallery-container"></ds-gallery>
    </div>
    <div id="view-case" class="view">
      <div id="case-slider-container" class="case-slider-container"></div>
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
        this.render();
        this._addEventListeners();
    }

    setState(newState) {
        Object.assign(this.state, newState);
        this.render();
    }

    getLang(prop) {
        return (prop && prop[this.state.lang]) ? prop[this.state.lang] : (prop && prop['en'] ? prop['en'] : prop);
    }

    render() {
        this.renderHome();
        this.renderCaseViewer();
        this.renderModals();
        this.renderOverlays();
        this.updateHeader();

        this.shadowRoot.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${this.state.currentView}`);
        });
        document.body.setAttribute('data-active-view', this.state.currentView);
    }

    renderHome() {
        const gallery = this.shadowRoot.getElementById('gallery-container');
        if (gallery.children.length > 0) return;

        portfolioCases.forEach(caseData => {
            const item = document.createElement('ds-gallery-item');
            item.setAttribute('title', this.getLang(caseData.title));
            item.setAttribute('short-desc', this.getLang(caseData.shortDesc));
            item.setAttribute('read-time', this.getLang(caseData.readTime));
            item.setAttribute('thumb-src', this.getLang(caseData.thumbSrc));
            item.setAttribute('device', caseData.deviceClass || 'iphone-17');
            if (caseData.videoSrc) item.setAttribute('has-video', 'true');
            if (caseData.repositoryUrl) item.setAttribute('has-repo', 'true');
            if (caseData.liveUrl) item.setAttribute('has-live', 'true');
            item.dataset.caseId = caseData.id;
            gallery.appendChild(item);
        });
    }

    renderCaseViewer() {
        const slider = this.shadowRoot.getElementById('case-slider-container');
        if (slider.children.length > 0) return; // Only render once

        portfolioCases.forEach(caseData => {
            const slide = document.createElement('ds-case-slide');
            slide.dataset.caseId = caseData.id;
            slide.setAttribute('title', this.getLang(caseData.title));
            slide.setAttribute('year', this.getLang(caseData.year));
            slide.setAttribute('thumb-src', this.getLang(caseData.thumbSrc));
            slide.setAttribute('device', caseData.deviceClass || 'iphone-17');
            
            const descContent = this.state.isRecruiterMode ? caseData.descRecruiter : caseData.desc;
            slide.innerHTML = `<div slot="description">${this.getLang(descContent)}</div>`;
            
            slider.appendChild(slide);
        });
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
        header.setAttribute('view', this.state.currentView);
        if (this.state.currentView === 'case' && this.state.activeCaseId) {
            const activeCase = portfolioCases.find(c => c.id === this.state.activeCaseId);
            if (activeCase) header.setAttribute('current-label', this.getLang(activeCase.title));
        }
    }

    _addEventListeners() {
        const header = this.shadowRoot.getElementById('app-header');
        const a11yModal = this.shadowRoot.getElementById('a11y-modal');
        const langModal = this.shadowRoot.getElementById('lang-modal');
        const toast = this.shadowRoot.getElementById('app-toast');
        const slider = this.shadowRoot.getElementById('case-slider-container');

        this.shadowRoot.addEventListener('ds-case-select', (e) => {
            this.setState({ activeCaseId: e.target.dataset.caseId, currentView: 'case' });
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

        // Add slider logic directly here
        this._setupSliderDrag(slider);
    }

    _setupSliderDrag(container) {
        let isDown = false, startX, scrollLeft, draggedDistance = 0;
        
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('dragging');
            startX = e.pageX;
            scrollLeft = container.scrollLeft;
            draggedDistance = 0;
        });

        container.addEventListener('mouseleave', () => { if(isDown) handleEnd(); });
        container.addEventListener('mouseup', () => { if(isDown) handleEnd(); });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            draggedDistance = e.pageX - startX;
            container.scrollLeft = scrollLeft - draggedDistance;
        });

        const handleEnd = () => {
            isDown = false;
            container.classList.remove('dragging');
            const slideWidth = this.offsetWidth;
            const startIndex = Math.round(scrollLeft / slideWidth);
            let targetIndex = startIndex;
            const swipeThreshold = slideWidth * 0.15;

            if (draggedDistance < -swipeThreshold) targetIndex = startIndex + 1;
            else if (draggedDistance > swipeThreshold) targetIndex = startIndex - 1;

            const maxIndex = container.children.length - 1;
            targetIndex = Math.max(0, Math.min(targetIndex, maxIndex));
            
            container.scrollTo({ left: targetIndex * slideWidth, behavior: 'smooth' });
        };
    }

    _initializeView() {
        const urlParams = new URLSearchParams(window.location.search);
        const targetCaseId = urlParams.get('case');
        if (targetCaseId) {
            const targetCase = portfolioCases.find(c => c.slug === targetCaseId || c.id === targetCaseId);
            if (targetCase) {
                this.setState({ currentView: 'case', activeCaseId: targetCase.id });
                return;
            }
        }

        const resumeCaseId = localStorage.getItem('resumeCaseId');
        const resumeScrollTop = localStorage.getItem('resumeScrollTop');
        if (resumeCaseId && resumeScrollTop) {
            const caseData = portfolioCases.find(c => c.id === resumeCaseId);
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