// File: src/App.js
// Purpose: Render the Portfoliable application shell and route runtime views.
// Author: Lio Schimanko

// MARK: IMPORTS
// Loads runtime dependencies, design config, i18n helpers, and Valence components.
import { getPortfolioCases } from '../templates/src/cases/index.js';
import aboutMeMarkdownRaw from '../templates/src/content/about/ABOUTME.md?raw';
import {
    applyTranslations,
    t,
    DEFAULT_LOCALE,
    LANGUAGE_CONFIG,
    SUPPORTED_LOCALES,
    resolveLocaleCode,
    resolveLocaleDirection,
    getLanguageDisplayName
} from '../templates/configs/i18n/i18n.config.js';
import portfoliableDesignConfig from '../templates/configs/portfoliable.design.config.js';
import {
    getShortcutTooltipParts,
    matchShortcutEvent
} from '../templates/configs/portfoliable.a11y.config.js';
import { renderLocalizedMarkdownHtml } from './parser/markdown.js';
import {
    resolveHeaderVisibilityAttributeValue,
    resolveReturnOnlyVisibilityOverrides
} from './header-visibility.contract.js';
import { pickReachableRuntimeMediaUrl } from './runtime-media.contract.js';
import Lenis from 'lenis';
import {
    AudioPlayer,
    Article,
    A11Y_THEME_OVERRIDES,
    A11Y_THEME_TOKEN_KEYS,
    Header,
    HomeView,
    Summary,
    Thumbnail,
    Toast,
    VideoPlayer,
    PlayerView
} from '@portfoliablejs/valence';

void Article;
void Header;
void HomeView;
void Summary;
void Thumbnail;
void Toast;
void VideoPlayer;

// MARK: HEADER DEFAULTS
// Resolves runtime defaults and persistence keys used across navigation and resume flows.
// Tries document icons first so header avatar mirrors brand assets without extra config.
function resolveDefaultNavigationAvatarSrc() {
    if (typeof document === 'undefined') {
        return '/favicon.png';
    }

    const links = [...document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]')];
    for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.trim().length > 0) {
            return href.trim();
        }
    }

    return '/favicon.png';
}

const DEFAULT_NAVIGATION_AVATAR_SRC = resolveDefaultNavigationAvatarSrc();
const RESUME_CASE_ID_STORAGE_KEY = 'resumeCaseId';
const RESUME_CASE_NAME_STORAGE_KEY = 'resumeCaseName';
const RESUME_SCROLL_TOP_STORAGE_KEY = 'resumeScrollTop';
const RESUME_TOAST_SUPPRESSED_STORAGE_KEY = 'resumeToastSuppressed';
const CASE_SCROLL_CACHE_STORAGE_KEY = 'caseScrollCache';
const CASE_AUDIO_POSITION_CACHE_STORAGE_KEY = 'caseAudioPositionCache';
const RESUME_WRITE_THROTTLE_MS = 250;
const RESUME_TOAST_ENABLED_DEFAULT = true;
const RESUME_TOAST_DEBUG_DEFAULT = false;
const RESUME_TOAST_SHOW_DELAY_MS = 700;
const RESUME_TOAST_AUTO_HIDE_MS = 6500;
const HOME_ENTRANCE_MAX_ESTIMATE_MS = 1200;
const ROUTE_CASE_SEGMENT = 'case';
const ROUTE_PLAYER_QUERY_VALUE = 'player';
const ROUTE_META_TAG_OWNER = 'portfoliable-runtime';
const ROUTE_STRUCTURED_DATA_HOME_ID = 'route-structured-data-home';
const ROUTE_STRUCTURED_DATA_GRAPH_ID = 'route-structured-data-graph';
const SEARCH_RESULT_MAIN_VIEW_ID = '__main-view__';
const A11Y_THEME_SOURCE_STORAGE_KEY = 'pref-theme-source';
const THEME_SOURCE_AUTO = 'auto';
const THEME_SOURCE_MANUAL = 'manual';
const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';

// MARK: A11Y THEME TOKENS
// Applies token overrides from design config and accessibility state onto document-level CSS vars.
// MARK: I18N HELPERS
// Resolves a locale code to a native language label for menus and pills.
function resolveLocaleDisplayName(localeCode) {
    const normalized = String(localeCode || '').trim().toLowerCase();
    if (!normalized) return '';

    const configured = getLanguageDisplayName(normalized);
    if (configured) return configured;

    try {
        if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
            const displayNames = new Intl.DisplayNames([normalized], { type: 'language' });
            const resolved = displayNames.of(normalized);
            if (resolved && resolved !== normalized) {
                return resolved;
            }
        }
    } catch {
        // Falls back to a simple title-cased locale code.
    }

    return normalized
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
}

// Recursively applies CSS variable maps while ignoring non-token keys.
function applyCssTokens(target, tokenTree) {
    if (!target || !tokenTree || typeof tokenTree !== 'object') return;

    Object.entries(tokenTree).forEach(([key, value]) => {
        if (value == null) return;

        if (typeof value === 'object' && !Array.isArray(value)) {
            applyCssTokens(target, value);
            return;
        }

        if (key.startsWith('--')) {
            target.style.setProperty(key, String(value));
        }
    });
}

// Parses About markdown config, localizes content blocks, and normalizes action/social metadata.
function parseAboutMarkdown(markdown) {
    const source = String(markdown || '');
    const configMatch = source.match(/<!--\s*about-config\s*([\s\S]*?)-->/i);
    let rawConfig = {};

    if (configMatch?.[1]) {
        try {
            const evaluateObject = new Function(`return (${configMatch[1].trim()});`);
            const parsed = evaluateObject();
            rawConfig = parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            rawConfig = {};
        }
    }

    const markdownWithoutConfig = source.replace(/<!--\s*about-config\s*[\s\S]*?-->/ig, '').trim();
    const localeSet = new Set(SUPPORTED_LOCALES);

    const collectLocalesFromValue = (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return;
        Object.keys(value).forEach((localeCode) => {
            const normalized = String(localeCode || '').trim().toLowerCase();
            if (!normalized || normalized === 'show') return;
            if (typeof value[localeCode] === 'string') {
                localeSet.add(normalized);
            }
        });
    };

    collectLocalesFromValue(rawConfig.title);
    collectLocalesFromValue(rawConfig.subtitle);
    collectLocalesFromValue(rawConfig.slugByLocale);
    collectLocalesFromValue(rawConfig.socialImage);
    (Array.isArray(rawConfig.customButtons) ? rawConfig.customButtons : []).forEach((item) => {
        collectLocalesFromValue(item?.label);
        collectLocalesFromValue(item?.tooltip);
        collectLocalesFromValue(item?.imageAlt ?? item?.['image-alt']);
        collectLocalesFromValue(item?.ariaLabel ?? item?.['aria-label']);
    });

    ['primary', 'secondary1', 'secondary2'].forEach((actionKey) => {
        const action = rawConfig.actions?.[actionKey];
        collectLocalesFromValue(action?.label);
        collectLocalesFromValue(action?.tooltip);
        collectLocalesFromValue(action?.imageAlt ?? action?.['image-alt']);
        collectLocalesFromValue(action?.ariaLabel ?? action?.['aria-label']);
    });

    let localeCodes = [...localeSet].sort((a, b) => a.localeCompare(b));

    const toLocalizedMap = (value, fallbackValue = '') => {
        if (typeof value === 'string') {
            return Object.fromEntries(localeCodes.map((localeCode) => [localeCode, value]));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(localeCodes.map((localeCode) => {
                const localizedValue = value[localeCode];
                if (typeof localizedValue === 'string') {
                    return [localeCode, localizedValue];
                }
                const defaultValue = value[DEFAULT_LOCALE];
                if (typeof defaultValue === 'string') {
                    return [localeCode, defaultValue];
                }
                return [localeCode, fallbackValue];
            }));
        }

        return Object.fromEntries(localeCodes.map((localeCode) => [localeCode, fallbackValue]));
    };

    const localizedBody = renderLocalizedMarkdownHtml(markdownWithoutConfig, localeCodes);
    localeCodes = [...new Set([...localeCodes, ...(localizedBody.meta?.localeCodes || [])])].sort((a, b) => a.localeCompare(b));

    const renderedByLocale = Object.fromEntries(localeCodes.map((localeCode) => {
        const bodyHtml = localizedBody.htmlByLocale?.[localeCode] || localizedBody.htmlByLocale?.[DEFAULT_LOCALE] || '';
        return [localeCode, { heading: '', subtitle: '', bodyHtml }];
    }));

    const boolOrDefault = (value, fallbackValue) => (typeof value === 'boolean' ? value : fallbackValue);
    const hasConfigText = (value) => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (!value || typeof value !== 'object') return false;
        return Object.values(value).some((entry) => typeof entry === 'string' && entry.trim().length > 0);
    };
    const normalizeVariant = (value, fallbackValue) => {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === 'primary' || normalized === 'secondary' || normalized === 'tertiary') {
            return normalized;
        }
        return fallbackValue;
    };

    const normalizeAction = (value, fallbackVariant) => {
        const action = value && typeof value === 'object' ? value : {};
        return {
            enabled: boolOrDefault(action.enabled, false),
            label: action.label,
            tooltip: action.tooltip,
            url: action.url,
            videoSrc: action.videoSrc ?? action['video-src'],
            vttSrc: action.vttSrc ?? action['vtt-src'],
            variant: normalizeVariant(action.variant, fallbackVariant),
            hasText: action.hasText ?? action['has-text'],
            hasIcon: action.hasIcon ?? action['has-icon'],
            icon: action.icon,
            iconVariant: action.iconVariant ?? action['icon-variant'],
            iconPosition: action.iconPosition ?? action['icon-position'],
            hasImage: action.hasImage ?? action['has-image'],
            imageSrc: action.imageSrc ?? action['image-src'],
            imageAlt: action.imageAlt ?? action['image-alt'],
            imagePosition: action.imagePosition ?? action['image-position'],
            ariaLabel: action.ariaLabel ?? action['aria-label']
        };
    };

    const customButtons = Array.isArray(rawConfig.customButtons)
        ? rawConfig.customButtons
            .filter((item) => item && typeof item === 'object')
            .map((item) => ({
                label: item.label,
                tooltip: item.tooltip,
                url: item.url,
                variant: normalizeVariant(item.variant, 'tertiary'),
                enabled: boolOrDefault(item.enabled, true),
                icon: item.icon,
                iconVariant: item.iconVariant ?? item['icon-variant'],
                iconPosition: item.iconPosition ?? item['icon-position'],
                hasText: item.hasText ?? item['has-text'],
                hasIcon: item.hasIcon ?? item['has-icon'],
                hasImage: item.hasImage ?? item['has-image'],
                imageSrc: item.imageSrc ?? item['image-src'],
                imageAlt: item.imageAlt ?? item['image-alt'],
                imagePosition: item.imagePosition ?? item['image-position'],
                ariaLabel: item.ariaLabel ?? item['aria-label']
            }))
            .filter((item) => item.enabled && hasConfigText(item.label) && hasConfigText(item.url))
        : [];

    const normalizedSocialConfig = rawConfig.social && typeof rawConfig.social === 'object' ? { ...rawConfig.social } : {};
    const socialLinks = normalizedSocialConfig.links && typeof normalizedSocialConfig.links === 'object' ? normalizedSocialConfig.links : {};
    const normalizeSocialValue = (value, fallbackValue) => {
        if (typeof value === 'boolean') return value;
        if (value && typeof value === 'object') return value;
        return fallbackValue;
    };
    const normalizedSocial = {};
    Object.entries(normalizedSocialConfig).forEach(([key, value]) => {
        if (key === 'links') return;
        if (!key || typeof key !== 'string') return;
        const fallbackValue = key === 'share' ? false : true;
        normalizedSocial[key] = normalizeSocialValue(value, fallbackValue);
    });
    if (!Object.prototype.hasOwnProperty.call(normalizedSocial, 'share')) {
        normalizedSocial.share = normalizeSocialValue(undefined, false);
    }
    ['linkedin', 'x', 'facebook'].forEach((platformKey) => {
        if (!Object.prototype.hasOwnProperty.call(normalizedSocial, platformKey)) {
            normalizedSocial[platformKey] = normalizeSocialValue(undefined, true);
        }
    });

    const localizedTitle = toLocalizedMap(rawConfig.title, 'About Me');
    const localizedSubtitle = toLocalizedMap(rawConfig.subtitle, '');
    const localizedSlugByLocale = toLocalizedMap(rawConfig.slugByLocale, 'about');
    const localizedSocialImage = toLocalizedMap(rawConfig.socialImage, '');
    const localizedBodyHtml = Object.fromEntries(localeCodes.map((localeCode) => {
        const rendered = renderedByLocale[localeCode] || {};
        return [localeCode, rendered.bodyHtml || ''];
    }));

    localeCodes.forEach((localeCode) => {
        const rendered = renderedByLocale[localeCode] || {};
        if (!String(localizedTitle[localeCode] || '').trim()) {
            localizedTitle[localeCode] = rendered.heading || localizedTitle[DEFAULT_LOCALE] || 'About Me';
        }
        if (!String(localizedSubtitle[localeCode] || '').trim()) {
            localizedSubtitle[localeCode] = rendered.subtitle || localizedSubtitle[DEFAULT_LOCALE] || '';
        }
    });

    return {
        locales: localeCodes,
        title: localizedTitle,
        subtitle: localizedSubtitle,
        bodyHtml: localizedBodyHtml,
        config: {
            showH1: boolOrDefault(rawConfig.title?.show, boolOrDefault(rawConfig.showH1, true)),
            showH2: boolOrDefault(rawConfig.subtitle?.show, boolOrDefault(rawConfig.showH2, true)),
            social: {
                ...normalizedSocial,
                links: { ...socialLinks }
            },
            actions: {
                primary: normalizeAction(rawConfig.actions?.primary, 'primary'),
                secondary1: normalizeAction(rawConfig.actions?.secondary1, 'secondary'),
                secondary2: normalizeAction(rawConfig.actions?.secondary2, 'tertiary')
            },
            slugByLocale: localizedSlugByLocale,
            socialImage: localizedSocialImage,
            visibility: (() => {
                const visibility = rawConfig.visibility && typeof rawConfig.visibility === 'object' ? { ...rawConfig.visibility } : {};
                visibility.web = typeof visibility.web === 'boolean' ? visibility.web : true;
                visibility.crawlers = typeof visibility.crawlers === 'boolean' ? visibility.crawlers : true;
                visibility.ai = typeof visibility.ai === 'boolean' ? visibility.ai : true;
                if (!visibility.locales || typeof visibility.locales !== 'object' || Array.isArray(visibility.locales)) {
                    visibility.locales = {};
                }
                return visibility;
            })(),
            customButtons
        }
    };
}

// MARK: CASE VIEW CONTRACTS
// Defines attribute contracts mirrored between AppShell, runtime-case-view, and ds-article/header.
const CASEVIEW_HEADER_ATTRIBUTES = [
    'show-navigation-region',
    'show-about',
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

const HEADER_VISIBILITY_CONFIG_KEYS = {
    showBreadcrumb: 'show-breadcrumb',
    showLanguageMenu: 'show-language-menu',
    showNavigationRegion: 'show-navigation-region',
    showAbout: 'show-about'
};

function resolveDesignString(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

const CASEVIEW_ARTICLE_ATTRIBUTES = [
    'kicker',
    'title-text',
    'subtitle-text',
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
    'show-cover',
    'show-summary',
    'show-player',
    'show-toc',
    'show-navigator'
];

const ACCESSIBILITY_ATTRIBUTES = [
    'a11y-dark-mode',
    'a11y-high-contrast',
    'a11y-large-text',
    'a11y-dyslexia',
    'a11y-reduce-motion',
    'a11y-focus-mode',
    'a11y-forced-colors'
];

const A11Y_STATE_KEY_BY_ITEM_ID = {
    'text-size': 'largeText',
    'dyslexia-font': 'dyslexiaFont',
    'dark-mode': 'darkMode',
    'high-contrast': 'highContrast',
    'reduce-motion': 'reduceMotion',
    'tab-navigation': 'tabNav'
};

// MARK: LEGACY COMPATIBILITY RUNTIME CASE SHELL
// Provides a runtime case shell with a fixed header and a dedicated scroll region.
if (!customElements.get('runtime-case-view')) {
        class RuntimeCaseView extends HTMLElement {
                static get observedAttributes() {
            return ['dir', 'aria-label', 'show-breadcrumb', 'show-language-menu', 'data-mobile-breakpoint', ...CASEVIEW_HEADER_ATTRIBUTES, ...CASEVIEW_ARTICLE_ATTRIBUTES];
                }

                constructor() {
                        super();
                        this.attachShadow({ mode: 'open' });
                        this._breadcrumbItems = null;
                        this._breadcrumbMenuItems = null;
                        this.shadowRoot.innerHTML = `
                            <style>
                                :host {
                                    display: block;
                                    width: 100%;
                                    min-height: 100%;
                                    box-sizing: border-box;
                                }

                                .case-layout {
                                    display: grid;
                                    grid-template-rows: auto auto;
                                    width: 100%;
                                    min-height: 100%;
                                    overflow: visible;
                                }

                                .header-wrap {
                                    width: 100vw;
                                    margin-left: calc(50% - 50vw);
                                    margin-right: calc(50% - 50vw);
                                    margin-bottom: var(--caseview-header-margin-bottom, 0px);
                                    background: transparent;
                                }

                                .header-wrap ds-header {
                                    display: block;
                                    background: transparent;
                                }

                                .article-wrap {
                                    width: min(924px, 100%);
                                    margin: 0 auto;
                                    padding: 0 clamp(12px, 2vw, 28px) clamp(24px, 4dvh, 48px);
                                    box-sizing: border-box;
                                    position: relative;
                                }

                                :host([data-mobile-breakpoint="true"]) .article-wrap {
                                    width: 100%;
                                    max-width: none;
                                    margin: 0;
                                    padding: 0;
                                }

                                .article-wrap ds-article {
                                    display: block;
                                    --ds-article-padding: var(--space-xl, 24px) 0 clamp(36px, 6dvh, 64px);
                                }
                            </style>
                            <section class="case-layout">
                                <div class="header-wrap"><ds-header></ds-header></div>
                                <div class="article-wrap">
                                    <ds-article>
                                        <slot name="cover" slot="cover"></slot>
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
                        this.articleWrapEl = this.shadowRoot.querySelector('.article-wrap');
                    this._observeRootAccessibility();
                        this.render();
                }

                disconnectedCallback() {
                    if (this._themeObserver) {
                        this._themeObserver.disconnect();
                    }
                }

                attributeChangedCallback(oldName, oldValue, newValue) {
                        if (oldValue === newValue) return;
                        if (this.layoutEl) this.render();
                }

                set breadcrumbItems(items) {
                        this._breadcrumbItems = Array.isArray(items) && items.length > 0 ? items : null;
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

                _resolveDirection() {
                    let node = this;

                    while (node) {
                        if (node instanceof HTMLElement) {
                            const dir = node.getAttribute('dir');
                            if (dir === 'rtl' || dir === 'ltr') return dir;
                        }

                        if (node.parentElement) {
                            node = node.parentElement;
                            continue;
                        }

                        const rootNode = node.getRootNode?.();
                        if (rootNode && rootNode.host instanceof HTMLElement) {
                            node = rootNode.host;
                            continue;
                        }

                        break;
                    }

                    return this.ownerDocument.documentElement.getAttribute('dir') || 'ltr';
                }

                _observeRootAccessibility() {
                    const root = this.ownerDocument.documentElement;
                    const sync = () => {
                        const currentDir = this._resolveDirection();
                        this.setAttribute('dir', currentDir);
                        this.layoutEl?.setAttribute('dir', currentDir);
                        this.layoutEl?.setAttribute('data-dir', currentDir);
                        this.headerEl?.setAttribute('dir', currentDir);
                        this.articleEl?.setAttribute('dir', currentDir);

                        ACCESSIBILITY_ATTRIBUTES.forEach((attrName) => {
                            const isActive = root.classList.contains(attrName);
                            this.toggleAttribute(attrName, isActive);
                            this.headerEl?.toggleAttribute(attrName, isActive);
                            this.articleEl?.toggleAttribute(attrName, isActive);
                        });
                    };

                    sync();
                    this._themeObserver = new MutationObserver(sync);
                    this._themeObserver.observe(root, { attributes: true, attributeFilter: ['class', 'dir'] });
                }

                render() {
                        if (!this.layoutEl || !this.headerEl || !this.articleEl) return;

                        const currentDir = this._resolveDirection();

                        const runtimeCaseViewDebug = {
                            hostDir: this.getAttribute('dir') || null,
                            resolvedDir: currentDir,
                            layoutDir: this.layoutEl.getAttribute('dir') || null,
                            headerDir: this.headerEl.getAttribute('dir') || null,
                            articleDir: this.articleEl.getAttribute('dir') || null,
                            documentDir: this.ownerDocument?.documentElement?.getAttribute('dir') || null
                        };

                        console.debug('[rtl][runtime-case-view]', JSON.stringify(runtimeCaseViewDebug));

                        if (runtimeCaseViewDebug.resolvedDir !== runtimeCaseViewDebug.articleDir
                            || runtimeCaseViewDebug.resolvedDir !== runtimeCaseViewDebug.layoutDir) {
                            console.warn('[rtl][runtime-case-view][mismatch]', JSON.stringify(runtimeCaseViewDebug));
                        }

                        this.layoutEl.setAttribute('aria-label', this.getAttribute('aria-label') || t('view_case_aria_label'));
                        this.layoutEl.setAttribute('dir', currentDir);
                        this.layoutEl.setAttribute('data-dir', currentDir);
                        this.headerEl.setAttribute('dir', currentDir);
                        this.articleEl.setAttribute('dir', currentDir);

                        if (this.getAttribute('data-mobile-breakpoint') === 'true') {
                            this.headerEl.setAttribute('data-mobile-breakpoint', 'true');
                            this.articleEl.setAttribute('data-mobile-breakpoint', 'true');
                        } else {
                            this.headerEl.removeAttribute('data-mobile-breakpoint');
                            this.articleEl.removeAttribute('data-mobile-breakpoint');
                        }
                        this.headerEl.showBreadcrumb = this.getAttribute('show-breadcrumb') !== 'false';
                        this.headerEl.showLanguageMenu = this.getAttribute('show-language-menu') !== 'false';
                        this.headerEl.breadcrumbItems = this._breadcrumbItems;
                        this.headerEl.breadcrumbMenuItems = this._breadcrumbMenuItems;

                        this._forwardAttributes(this.headerEl, CASEVIEW_HEADER_ATTRIBUTES);
                        this._forwardAttributes(this.articleEl, CASEVIEW_ARTICLE_ATTRIBUTES);
                }
        }

        customElements.define('runtime-case-view', RuntimeCaseView);
}

// MARK: COMPONENT TEMPLATE
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
    background-color: var(--color-bg, var(--color-player-bg, #101218));
      color: var(--color-black, #000000);
      font-family: var(--font-family, sans-serif);
                        transition: background-color 280ms ease;
            --route-transition-duration: 520ms;
            --route-transition-ease: cubic-bezier(0.22, 1, 0.36, 1);
    }
                :host([a11y-reduce-motion]) {
                        transition: none;
                }
        #global-header-wrap {
            position: fixed;
            inset: 0 0 auto 0;
            z-index: 4700;
            pointer-events: none;
            background: transparent;
            border-bottom: 1px solid transparent;
            opacity: 1;
            visibility: visible;
            transition: opacity 180ms ease, visibility 180ms ease, border-color 180ms ease;
        }
        #global-header-wrap[data-mobile-breakpoint="true"] {
            background: var(--color-bg, var(--color-player-bg, #101218));
        }
        #global-header-wrap[data-current-view="case"][data-scrolled="true"],
        #global-header-wrap[data-current-view="about"][data-scrolled="true"] {
            background: var(--color-bg, var(--color-player-bg, #101218));
            border-bottom-color: var(--color-surface-border, var(--color-card-border, rgba(0, 0, 0, 0.08)));
        }
        #global-header-wrap[data-mobile-breakpoint="true"][data-current-view="player"] {
            background: transparent;
        }
        :host(:not([data-header-ready="true"])) #app-scroll-content,
        :host(:not([data-header-ready="true"])) #home-view,
        :host(:not([data-header-ready="true"])) #case-view,
        :host(:not([data-header-ready="true"])) #player-view-host,
        :host(:not([data-header-ready="true"])) #view-about {
            visibility: hidden;
        }
        #global-header {
            display: block;
            width: 100%;
            pointer-events: none;
        }
        main {
            position: relative;
            height: 100%;
            width: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        main::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
        }
        #app-scroll-content {
            position: relative;
            min-height: 100%;
            width: 100%;
        }
        .view {
            position: absolute;
            inset: 0;
            display: flex;
            min-height: 100%;
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
            position: relative;
            inset: auto;
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            z-index: 2;
        }
    .category-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--color-gray-light);
      padding: 4px var(--space-sm) 2px var(--space-sm); margin-top: 2px; display: block;
    }
        #view-home {
            align-items: stretch;
            justify-content: stretch;
            overflow: hidden;
        }
        #view-case {
            overflow: visible;
            overflow-x: hidden;
            align-items: stretch;
            justify-content: stretch;
            box-sizing: border-box;
        }
        #view-about {
            overflow: visible;
            overflow-x: hidden;
            align-items: stretch;
            justify-content: stretch;
            box-sizing: border-box;
        }
        #view-player {
            background: linear-gradient(180deg, #08111d 0%, #0f1725 42%, #05070c 100%);
            overflow: visible;
            overflow-x: hidden;
            align-items: stretch;
            justify-content: stretch;
            box-sizing: border-box;
        }
        #player-view-host {
            display: block;
            width: 100%;
            min-height: 100%;
        }
        #player-view-host ds-player-view {
            display: block;
            width: 100%;
            min-height: 100%;
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
            height: auto;
            min-height: 100%;
        }
        #thumb-transition-layer {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 3500;
            contain: layout style paint;
        }
        #floating-audio-layer {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 4701;
        }
        #floating-audio-layer > ds-audio-player {
            pointer-events: auto;
        }
        #thumb-transition-layer .thumb-ghost {
            position: fixed;
            left: 0;
            top: 0;
            transform-origin: top left;
            will-change: transform, opacity, border-radius;
            transition-property: transform, opacity, border-radius;
            box-shadow: none;
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
        .locked-case-empty {
            width: 100%;
            min-height: 40vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .locked-case-empty .article-empty {
            min-height: 0;
            margin: 0;
        }
        #about-view-shell {
            width: min(924px, 100%);
            margin: 0 auto;
            padding: clamp(84px, 10dvh, 112px) clamp(12px, 2vw, 28px) clamp(32px, 5dvh, 56px);
            box-sizing: border-box;
        }
        #about-article {
            display: block;
        }
        #app-toast {
            position: fixed;
            left: 50%;
            top: var(--app-floating-top-offset, clamp(74px, 10dvh, 112px));
            -webkit-transform: translate3d(-50%, calc(-100vh - 120px), 0);
            transform: translate3d(-50%, calc(-100vh - 120px), 0);
            z-index: 4700;
            pointer-events: none;
            max-width: min(94vw, 980px);
            opacity: 0;
            -webkit-transition:
                -webkit-transform 560ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity 560ms cubic-bezier(0.22, 1, 0.36, 1);
            transition:
                transform 560ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity 560ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform, opacity;
        }
        #app-toast[visible="true"] {
            pointer-events: auto;
            opacity: 1;
            -webkit-transform: translate3d(-50%, 0, 0);
            transform: translate3d(-50%, 0, 0);
        }
        #app-toast[data-exit-animating="true"] {
            pointer-events: none;
            opacity: 0;
            -webkit-transform: translate3d(-50%, calc(-100vh - 120px), 0);
            transform: translate3d(-50%, calc(-100vh - 120px), 0);
            -webkit-transition-duration: 460ms;
            transition-duration: 460ms;
        }
        #app-toast ds-toast {
            display: block;
            width: max-content;
            max-width: 100%;
        }
  </style>

    <div id="thumb-transition-layer" aria-hidden="true"></div>
    <div id="floating-audio-layer" aria-hidden="true"></div>

    <div id="global-header-wrap">
        <ds-header id="global-header"></ds-header>
    </div>

    <main id="app-scroll-root">
    <div id="app-scroll-content">
        <div id="view-home" class="view">
            <ds-home-view id="home-view"></ds-home-view>
        </div>
        <div id="view-case" class="view">
            <runtime-case-view id="case-view"></runtime-case-view>
        </div>
            <div id="view-player" class="view">
                <div id="player-view-host"></div>
        </div>
        <div id="view-about" class="view">
            <section id="about-view-shell">
            <ds-article id="about-article"></ds-article>
            </section>
        </div>
        </div>
  </main>
  
    <div id="app-toast" visible="false" aria-hidden="true">
        <ds-toast id="app-toast-el" visible="false" aria-hidden="true"></ds-toast>
    </div>
`;

// MARK: APP SHELL CUSTOM ELEMENT
// Coordinates app state, view rendering, event wiring, and accessibility behavior.
class AppShell extends HTMLElement {
    // MARK: APP SHELL LIFECYCLE AND STATE
    // Initializes shadow DOM, source content, and default runtime state.
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._portfolioCases = getPortfolioCases();
        this._aboutPayload = parseAboutMarkdown(aboutMeMarkdownRaw);
        this._homeVisibleCases = [...this._portfolioCases];
        this._routeSyncInProgress = false;
        this._boundPopState = () => this._handlePopStateRoute();
        this._unlockedCaseIds = new Set();
        this._transitionCleanupTimer = null;
        this._galleryPointerDown = null;
        this._pendingThumbnailTransition = null;
        this._activeThumbnailTransition = null;
        this._homeTransitionSourceHint = null;
        this._thumbnailTransitionCache = new Map();
        this._transitionDebug = { mode: 'idle', reason: '' };
        this._nativeTransitionStyleReady = false;
        this._nativeNamedElements = new Set();
        // Manual ghost transitions are more reliable for shadow-DOM thumbnails.
        this._enableNativeViewTransition = Boolean(portfoliableDesignConfig?.transitions?.preferNativeSharedElement);
        // Keep one motion style across all routes and guard stale callbacks on rapid navigation.
        this._forceUniformRectTransition = true;
        // User preference: crossfade only, no positional movement.
        this._fadeOnlyTransitions = true;
        this._transitionRunId = 0;
        this._homeGalleryOffsetX = 0;
        this._homeGalleryOffsetDirection = 'ltr';
        this._hasSavedHomeGalleryOffset = false;
        this._homeGalleryRestorePending = false;
        this._homeGalleryRestoreRetryCount = 0;
        this._homeEntranceAnimationPending = true;
        this._homeEntranceAnimationMode = 'full';
        this._homeEntranceAnimationHasPlayed = false;
        this._homeEntranceAnimationRunId = 0;
        this._homeEntranceAnimations = [];
        this._homeEntranceAnimationInProgress = false;
        this._homeEntranceAnimationEndAt = 0;
        this._homeEntranceCompletionTimer = null;
        this._playerEntranceAnimationPending = false;
        this._aboutEntranceAnimationPending = false;
        this._aboutLenis = null;
        this._appLenis = null;
        this._homeRenderSignature = '';
        this._caseViewRenderSignature = '';
        this._caseViewLastSyncedCaseId = null;
        this._baseThemeTokenValues = new Map();
        this._playerHeaderDebugObserver = null;
        this._playerHeaderDebugObservedView = null;
        this._playerHeaderDebugVideoCleanup = null;
        this._playerUiHidden = false;
        this._contextualMenuSyncFrame = 0;
        this._caseAudioRuntime = {
            caseId: null,
            player: null,
            sentinel: null,
            observer: null,
            scrollRoot: null,
            scrollHandler: null,
            resizeHandler: null,
            onPlayToggle: null,
            onHideToggle: null,
            onAutoToggle: null,
            onTimeUpdate: null,
            onEnded: null,
            onError: null,
            playing: false,
            hideOnScroll: false,
            autoScroll: false,
            pinned: false,
            anchorTime: 0,
            anchorScrollTop: 0
        };
        this._navigationAvatarPreloadedSrc = '';
        this._navigationAvatarPreloadPromise = null;
        this._globalHeaderEventsBound = false;
        this._caseTocActiveSyncCleanup = null;
        this._breadcrumbEntryRevealFromView = '';
        this._breadcrumbEntryRevealToView = '';
        this._lenisInstances = new Set();
        this._lenisFrame = 0;
        this._lenisRegister = (instance) => this._registerLenisInstance(instance);
        this._lenisUnregister = (instance) => this._unregisterLenisInstance(instance);
        this._boundGlobalKeyDown = (event) => this._handleGlobalKeyDown(event);
        this._boundSuppressNativeTooltips = (event) => this._suppressNativeTooltips(event);
        this._boundDisableContextMenu = (event) => this._handleContextMenu(event);
        this._boundResumeProgressFromScroll = () => this._scheduleResumeProgressPersistence();
        this._boundHeaderScrollStateSync = () => this._syncMobileCaseHeaderBorderState();
        this._boundPersistResumeOnUnload = () => this._persistResumeProgress({ force: true });
        this._boundSystemThemePreferenceChange = () => this._handleSystemThemePreferenceChange();
        this._boundMobileBreakpointChange = () => this.render();
        this._systemThemeMediaQueries = [];
        this._mobileBreakpointMediaQuery = null;
        this._themePreferenceSource = THEME_SOURCE_AUTO;
        this._resumeWriteTimer = null;
        this._resumeWriteLastAt = 0;
        this._resumeLastSavedSnapshot = '';
        this._pendingResumeRestore = null;
        this._lastRenderedToastVisibility = null;
        this._resumeToastShowTimer = null;
        this._resumeToastAutoHideTimer = null;
        this._resumeToastShowRaf = null;
        this._toastEntranceAnimation = null;
        this._toastExitAnimation = null;
        this._toastExitFallbackTimer = null;
        this._toastExitTransitionCleanup = null;
        this._pendingAboutScrollToTop = false;
        this._pendingAboutScrollAttempts = 0;
        this._caseNavigatorSearchQuery = '';
        this._caseSearchHighlight = null;
        this._caseNavigatorResultsCache = [];
        this._caseNavigatorResultsCacheLang = '';
        this._caseNavigatorResultsCacheSource = null;
        this._caseNavigatorResultsCacheLockSignature = '';
        this._caseScrollCache = this._readCaseScrollCache();
        this._caseAudioPositionCache = this._readCaseAudioPositionCache();
        this._caseScrollRestorePending = null;
        this._ignoreNextEmptyCaseNavigatorSearchInput = false;
        this._lastNavigateBackAt = 0;
        this._navigateBackDebounceMs = 520;
        this._returnNavigationBurstLock = false;
        this._returnNavigationBurstTimer = null;

        this.state = {
            currentView: 'home',
            activeCaseId: null,
            isRecruiterMode: false,
            lang: resolveLocaleCode(window.currentLang || DEFAULT_LOCALE, DEFAULT_LOCALE),
            direction: resolveLocaleDirection(window.currentLang || DEFAULT_LOCALE, 'ltr'),
            viewHistory: ['home'],
            toast: {
                visible: false,
                content: '',
                caseId: null,
                scrollTop: 0,
                showClose: true,
                showNeverShow: true,
                ignoreSuppression: false
            },
            a11y: {
                largeText: false, dyslexiaFont: false, darkMode: false,
                highContrast: false, reduceMotion: false, tabNav: false,
            },
        };
        this._caseEntryAnimationKey = '';
        this._caseEntryAnimationPending = false;
        this.removeAttribute('data-header-ready');
    }

    // Runs once the element is attached, applying persisted settings and first render.
    connectedCallback() {
        this.removeAttribute('data-header-ready');
        this._logResumeToast('Connected', {
            enabled: this._isResumeToastEnabled(),
            debug: this._isResumeToastDebugEnabled()
        });
        this._registerSystemThemePreferenceListeners();
        this._registerMobileBreakpointListener();
        this._initializeView();
        this.applyThemeTokens();
        this._loadA11ySettings();
        this._enableGlobalSmoothScrolling();
        this._ensureAppSmoothScrolling();
        window.addEventListener('popstate', this._boundPopState);
        window.__portfoliableLenisRegister = this._lenisRegister;
        window.__portfoliableLenisUnregister = this._lenisUnregister;
        this._preloadNavigationAvatar();
        this.render();
        this._bindGlobalHeaderEvents();
        this._animateHomeEntrance();
        this._addEventListeners();
        this._bindMobileCaseHeaderBorderSync();
        this._syncMobileCaseHeaderBorderState();
        this._bindResumeProgressPersistence();
    }

    disconnectedCallback() {
        this._persistResumeProgress({ force: true });
        this._unbindResumeProgressPersistence();
        this._unregisterSystemThemePreferenceListeners();
        this._unregisterMobileBreakpointListener();
        this._clearResumeToastTimers();
        this._cancelHomeEntranceAnimations();
        this._detachPlayerHeaderDebugObserver();
        this._teardownCaseAudioPlayerRuntime();
        this._destroyAppSmoothScrolling();
        this._stopLenisLoop();
        this._unbindMobileCaseHeaderBorderSync();
        if (this._contextualMenuSyncFrame) {
            cancelAnimationFrame(this._contextualMenuSyncFrame);
            this._contextualMenuSyncFrame = 0;
        }
        window.removeEventListener('popstate', this._boundPopState);
        if (window.__portfoliableLenisRegister === this._lenisRegister) {
            delete window.__portfoliableLenisRegister;
        }
        if (window.__portfoliableLenisUnregister === this._lenisUnregister) {
            delete window.__portfoliableLenisUnregister;
        }
        document.removeEventListener('mouseover', this._boundSuppressNativeTooltips, true);
        document.removeEventListener('contextmenu', this._boundDisableContextMenu, true);
        window.removeEventListener('keydown', this._boundGlobalKeyDown);
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

    _isMobileBreakpoint() {
        return Boolean(window.matchMedia?.(MOBILE_BREAKPOINT_QUERY)?.matches);
    }

    _resolveThemePreferenceSource(storedValue) {
        return storedValue === THEME_SOURCE_MANUAL ? THEME_SOURCE_MANUAL : THEME_SOURCE_AUTO;
    }

    _normalizeA11yState(a11yState) {
        const normalized = { ...this.state.a11y, ...a11yState };
        if (normalized.highContrast) {
            normalized.darkMode = false;
        }
        return normalized;
    }

    _persistA11yState(a11yState) {
        Object.entries(a11yState).forEach(([key, value]) => {
            localStorage.setItem(`pref-${key.toLowerCase()}`, String(Boolean(value)));
        });
    }

    _commitA11yState(a11yState, { persist = true } = {}) {
        const normalizedState = this._normalizeA11yState(a11yState);
        this.state.a11y = normalizedState;
        if (persist) {
            this._persistA11yState(normalizedState);
        }
        this.applyA11ySettings();
    }

    _setThemePreferenceSource(source, { persist = true } = {}) {
        this._themePreferenceSource = this._resolveThemePreferenceSource(source);
        if (persist) {
            localStorage.setItem(A11Y_THEME_SOURCE_STORAGE_KEY, this._themePreferenceSource);
        }
    }

    _prefersSystemDarkMode() {
        return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    }

    _prefersSystemForcedColors() {
        return Boolean(window.matchMedia?.('(forced-colors: active)')?.matches);
    }

    _prefersSystemHighContrast() {
        if (this._prefersSystemForcedColors()) {
            return true;
        }
        return Boolean(window.matchMedia?.('(prefers-contrast: more)')?.matches);
    }

    _resolveSystemThemeA11yPatch() {
        const highContrast = this._prefersSystemHighContrast();
        return {
            darkMode: highContrast ? false : this._prefersSystemDarkMode(),
            highContrast
        };
    }

    _handleSystemThemePreferenceChange() {
        this._setThemePreferenceSource(THEME_SOURCE_AUTO);
        const patch = this._resolveSystemThemeA11yPatch();
        this._commitA11yState({ ...this.state.a11y, ...patch }, { persist: true });
    }

    _registerMobileBreakpointListener() {
        this._unregisterMobileBreakpointListener();

        const mediaQueryList = window.matchMedia?.(MOBILE_BREAKPOINT_QUERY);
        if (!mediaQueryList) return;

        this._mobileBreakpointMediaQuery = mediaQueryList;

        if (typeof mediaQueryList.addEventListener === 'function') {
            mediaQueryList.addEventListener('change', this._boundMobileBreakpointChange);
            return;
        }

        if (typeof mediaQueryList.addListener === 'function') {
            mediaQueryList.addListener(this._boundMobileBreakpointChange);
        }
    }

    _unregisterMobileBreakpointListener() {
        if (!this._mobileBreakpointMediaQuery) return;

        if (typeof this._mobileBreakpointMediaQuery.removeEventListener === 'function') {
            this._mobileBreakpointMediaQuery.removeEventListener('change', this._boundMobileBreakpointChange);
        } else if (typeof this._mobileBreakpointMediaQuery.removeListener === 'function') {
            this._mobileBreakpointMediaQuery.removeListener(this._boundMobileBreakpointChange);
        }

        this._mobileBreakpointMediaQuery = null;
    }

    _registerSystemThemePreferenceListeners() {
        this._unregisterSystemThemePreferenceListeners();

        const queries = [
            '(prefers-color-scheme: dark)',
            '(prefers-contrast: more)',
            '(forced-colors: active)'
        ];

        queries.forEach((query) => {
            const mediaQueryList = window.matchMedia?.(query);
            if (!mediaQueryList) return;

            if (typeof mediaQueryList.addEventListener === 'function') {
                mediaQueryList.addEventListener('change', this._boundSystemThemePreferenceChange);
                this._systemThemeMediaQueries.push({ mediaQueryList, legacy: false });
                return;
            }

            if (typeof mediaQueryList.addListener === 'function') {
                mediaQueryList.addListener(this._boundSystemThemePreferenceChange);
                this._systemThemeMediaQueries.push({ mediaQueryList, legacy: true });
            }
        });
    }

    _unregisterSystemThemePreferenceListeners() {
        this._systemThemeMediaQueries.forEach(({ mediaQueryList, legacy }) => {
            if (legacy) {
                if (typeof mediaQueryList.removeListener === 'function') {
                    mediaQueryList.removeListener(this._boundSystemThemePreferenceChange);
                }
                return;
            }

            if (typeof mediaQueryList.removeEventListener === 'function') {
                mediaQueryList.removeEventListener('change', this._boundSystemThemePreferenceChange);
            }
        });
        this._systemThemeMediaQueries = [];
    }

    _isResumeToastEnabled() {
        return (portfoliableDesignConfig?.homeView?.resumeToastEnabled ?? RESUME_TOAST_ENABLED_DEFAULT) !== false;
    }

    _isResumeToastDebugEnabled() {
        return Boolean(portfoliableDesignConfig?.homeView?.resumeToastDebug ?? RESUME_TOAST_DEBUG_DEFAULT);
    }

    _logResumeToast(message, extra = null) {
        if (!this._isResumeToastDebugEnabled()) return;

        if (extra == null) {
            console.log('[AppShell][ResumeToast]', message);
            return;
        }

        console.log('[AppShell][ResumeToast]', message, extra);
    }

    _traceResumeToast(message, extra = null) {
        const prefix = '[AppShell][ResumeToastTrace]';
        if (extra == null) {
            console.log(prefix, message);
            return;
        }
        console.log(prefix, message, extra);
    }

    _snapshotToastHost(toast) {
        if (!(toast instanceof HTMLElement)) {
            return { toastElementPresent: false };
        }

        const computed = window.getComputedStyle(toast);
        const rect = toast.getBoundingClientRect();
        const activeAnimations = typeof toast.getAnimations === 'function'
            ? toast.getAnimations().map((animation) => ({
                playState: animation.playState,
                currentTime: animation.currentTime
            }))
            : [];

        return {
            toastElementPresent: true,
            visibleAttr: toast.getAttribute('visible'),
            ariaHiddenAttr: toast.getAttribute('aria-hidden'),
            exitAnimatingAttr: toast.getAttribute('data-exit-animating'),
            opacity: computed.opacity,
            transform: computed.transform,
            transition: computed.transition,
            pointerEvents: computed.pointerEvents,
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            activeAnimations
        };
    }

    _clearResumeToastTimers() {
        const toast = this.shadowRoot?.getElementById('app-toast');
        this._traceResumeToast('Clearing resume toast timers', {
            hasShowTimer: Boolean(this._resumeToastShowTimer),
            hasAutoHideTimer: Boolean(this._resumeToastAutoHideTimer),
            hasShowRaf: Boolean(this._resumeToastShowRaf),
            hasEntranceAnimation: Boolean(this._toastEntranceAnimation),
            hasExitAnimation: Boolean(this._toastExitAnimation),
            snapshot: this._snapshotToastHost(toast)
        });
        if (this._resumeToastShowTimer) {
            clearTimeout(this._resumeToastShowTimer);
            this._resumeToastShowTimer = null;
        }

        if (this._resumeToastShowRaf) {
            cancelAnimationFrame(this._resumeToastShowRaf);
            this._resumeToastShowRaf = null;
        }

        if (this._resumeToastAutoHideTimer) {
            clearTimeout(this._resumeToastAutoHideTimer);
            this._resumeToastAutoHideTimer = null;
        }

        if (this._toastEntranceAnimation && typeof this._toastEntranceAnimation.cancel === 'function') {
            this._toastEntranceAnimation.cancel();
            this._toastEntranceAnimation = null;
        }

        if (this._toastExitAnimation && typeof this._toastExitAnimation.cancel === 'function') {
            this._toastExitAnimation.cancel();
            this._toastExitAnimation = null;
        }

        if (this._toastExitFallbackTimer) {
            clearTimeout(this._toastExitFallbackTimer);
            this._toastExitFallbackTimer = null;
        }

        if (typeof this._toastExitTransitionCleanup === 'function') {
            this._toastExitTransitionCleanup();
            this._toastExitTransitionCleanup = null;
        }

        if (toast instanceof HTMLElement) {
            toast.removeAttribute('data-exit-animating');
            toast.style.removeProperty('animation');
            toast.style.removeProperty('transform');
            toast.style.removeProperty('-webkit-transform');
            toast.style.removeProperty('opacity');
        }
    }

    _runToastEntranceAnimation(toast) {
        if (!(toast instanceof HTMLElement)) return;
        if (this._shouldReduceMotion()) return;

        this._traceResumeToast('Starting entrance animation', {
            startSnapshot: this._snapshotToastHost(toast)
        });

        toast.removeAttribute('data-exit-animating');

        if (this._toastExitAnimation && typeof this._toastExitAnimation.cancel === 'function') {
            this._toastExitAnimation.cancel();
            this._toastExitAnimation = null;
        }

        // Entrance is CSS-driven by [visible="true"]; defer a snapshot one frame later.
        requestAnimationFrame(() => {
            this._traceResumeToast('Entrance CSS state applied', {
                endSnapshot: this._snapshotToastHost(toast)
            });
        });
    }

    _hideResumeToastAnimated(reason = 'manual-hide', onHidden = null) {
        const toast = this.shadowRoot?.getElementById('app-toast');
        const finalizeHide = () => {
            this._logResumeToast('Toast hide finalize requested', {
                reason,
                caseAudioPinned: this._caseAudioRuntime?.pinned,
                caseAudioPlaying: this._caseAudioRuntime?.playing,
                caseAudioParent: this._caseAudioRuntime?.player?.parentElement?.id || this._caseAudioRuntime?.player?.parentElement?.tagName || null
            });
            this._traceResumeToast('Finalizing hide state', {
                reason,
                stateVisibleBeforeFinalize: this.state.toast.visible,
                snapshotBeforeFinalize: this._snapshotToastHost(toast)
            });
            this._toastExitAnimation = null;
            this.setState({
                toast: { ...this.state.toast, visible: false }
            });
            if (typeof onHidden === 'function') {
                onHidden();
            }
        };

        if (!this.state.toast.visible) {
            this._traceResumeToast('Hide requested while toast already hidden', {
                reason,
                snapshot: this._snapshotToastHost(toast)
            });
            finalizeHide();
            return;
        }

        if (!(toast instanceof HTMLElement) || this._shouldReduceMotion()) {
            this._traceResumeToast('Hide skipping animation', {
                reason,
                hasToastElement: toast instanceof HTMLElement,
                reduceMotion: this._shouldReduceMotion(),
                snapshot: this._snapshotToastHost(toast)
            });
            this._logResumeToast('Exit animation skipped; hiding immediately', { reason });
            finalizeHide();
            return;
        }

        // Keep toast visible while AppShell controls the leave motion.
        toast.setAttribute('data-exit-animating', 'true');
        toast.setAttribute('visible', 'true');
        toast.setAttribute('aria-hidden', 'false');

        if (this._toastEntranceAnimation && typeof this._toastEntranceAnimation.cancel === 'function') {
            this._toastEntranceAnimation.cancel();
            this._toastEntranceAnimation = null;
        }

        if (this._toastExitAnimation && typeof this._toastExitAnimation.cancel === 'function') {
            this._toastExitAnimation.cancel();
            this._toastExitAnimation = null;
        }

        const endOffset = -Math.max(window.innerHeight + 120, 640);
        this._logResumeToast('Running exit animation', {
            reason,
            endOffset
        });
        this._traceResumeToast('Running exit animation', {
            reason,
            endOffset,
            startSnapshot: this._snapshotToastHost(toast)
        });

        // Force an exit animation restart so repeated dismiss actions still animate.
        toast.removeAttribute('data-exit-animating');
        toast.style.removeProperty('animation');
        toast.style.transform = 'translate3d(-50%, 0, 0)';
        toast.style.setProperty('-webkit-transform', 'translate3d(-50%, 0, 0)');
        toast.style.opacity = '1';
        void toast.offsetWidth;

        let settled = false;
        const completeExit = (source) => {
            if (settled) return;
            settled = true;

            if (this._toastExitFallbackTimer) {
                clearTimeout(this._toastExitFallbackTimer);
                this._toastExitFallbackTimer = null;
            }

            if (typeof this._toastExitTransitionCleanup === 'function') {
                this._toastExitTransitionCleanup();
                this._toastExitTransitionCleanup = null;
            }

            this._toastExitAnimation = null;
            toast.removeAttribute('data-exit-animating');
            toast.style.removeProperty('animation');
            toast.style.removeProperty('transform');
            toast.style.removeProperty('-webkit-transform');
            toast.style.removeProperty('opacity');

            this._traceResumeToast('Exit animation completed', {
                reason,
                source,
                endSnapshot: this._snapshotToastHost(toast)
            });

            finalizeHide();
        };

        const handleTransitionEnd = (event) => {
            if (event.target !== toast) return;
            if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') return;
            completeExit(`transitionend:${event.propertyName}`);
        };

        toast.addEventListener('transitionend', handleTransitionEnd);
        this._toastExitTransitionCleanup = () => {
            toast.removeEventListener('transitionend', handleTransitionEnd);
        };

        this._toastExitAnimation = {
            cancel: () => {
                if (this._toastExitFallbackTimer) {
                    clearTimeout(this._toastExitFallbackTimer);
                    this._toastExitFallbackTimer = null;
                }
                if (typeof this._toastExitTransitionCleanup === 'function') {
                    this._toastExitTransitionCleanup();
                    this._toastExitTransitionCleanup = null;
                }
                settled = true;
                toast.removeAttribute('data-exit-animating');
                toast.style.removeProperty('animation');
                toast.style.removeProperty('transform');
                toast.style.removeProperty('-webkit-transform');
                toast.style.removeProperty('opacity');
                this._traceResumeToast('Exit animation canceled', {
                    reason,
                    snapshotAfterCancel: this._snapshotToastHost(toast)
                });
            }
        };

        toast.style.removeProperty('animation');
        void toast.offsetWidth;
        toast.setAttribute('data-exit-animating', 'true');
        this._toastExitFallbackTimer = setTimeout(() => {
            completeExit('timeout-fallback');
        }, 520);
    }

    _getHomeEntranceRemainingMs() {
        if (this.state.currentView !== 'home') return 0;

        if (this._homeEntranceAnimationInProgress && this._homeEntranceAnimationEndAt > 0) {
            return Math.max(0, this._homeEntranceAnimationEndAt - Date.now());
        }

        if (this._homeEntranceAnimationPending) {
            return HOME_ENTRANCE_MAX_ESTIMATE_MS;
        }

        return 0;
    }

    _scheduleResumeToastAutoHide() {
        if (!this._isResumeToastEnabled()) return;

        if (this._resumeToastAutoHideTimer) {
            clearTimeout(this._resumeToastAutoHideTimer);
        }

        this._resumeToastAutoHideTimer = setTimeout(() => {
            this._resumeToastAutoHideTimer = null;
            if (!this.state.toast.visible) return;

            this._logResumeToast('Auto-hide timer elapsed; hiding toast');
            this._hideResumeToastAnimated('auto-hide');
        }, RESUME_TOAST_AUTO_HIDE_MS);
    }

    _queueResumeToast(payload) {
        if (!this._isResumeToastEnabled()) {
            return;
        }

        this._clearResumeToastTimers();

        const normalizedPayload = {
            visible: false,
            content: payload?.content || '',
            caseId: payload?.caseId || null,
            scrollTop: Number.parseInt(String(payload?.scrollTop ?? ''), 10) || 0,
            showClose: payload?.showClose !== false,
            showNeverShow: payload?.showNeverShow !== false,
            ignoreSuppression: payload?.ignoreSuppression === true
        };

        this.setState({ toast: normalizedPayload });
        this._logResumeToast('Queued resume toast reveal', {
            caseId: normalizedPayload.caseId,
            scrollTop: normalizedPayload.scrollTop,
            delayMs: RESUME_TOAST_SHOW_DELAY_MS
        });

        this._resumeToastShowRaf = requestAnimationFrame(() => {
            this._resumeToastShowRaf = null;

            const homeWaitMs = this._getHomeEntranceRemainingMs();
            const revealDelayMs = homeWaitMs + RESUME_TOAST_SHOW_DELAY_MS;
            this._logResumeToast('Computed reveal delay', {
                homeWaitMs,
                revealDelayMs
            });

            this._resumeToastShowTimer = setTimeout(() => {
                this._resumeToastShowTimer = null;

                if (!this._isResumeToastEnabled()) return;

                const toastSuppressed = localStorage.getItem(RESUME_TOAST_SUPPRESSED_STORAGE_KEY) === 'true';
                if (toastSuppressed && !normalizedPayload.ignoreSuppression) {
                    this._logResumeToast('Reveal skipped because suppression is active');
                    return;
                }

                this._logResumeToast('Reveal timer elapsed; showing toast');
                this.setState({
                    toast: { ...normalizedPayload, visible: true }
                });
                this._scheduleResumeToastAutoHide();
            }, revealDelayMs);
        });
    }

    _preloadNavigationAvatar() {
        const contract = this._resolveHeaderContract();
        const avatarSrc = (contract?.attributes?.['avatar-src'] || DEFAULT_NAVIGATION_AVATAR_SRC || '').trim();
        if (!avatarSrc) return;

        if (this._navigationAvatarPreloadedSrc === avatarSrc && this._navigationAvatarPreloadPromise) {
            return;
        }

        this._navigationAvatarPreloadedSrc = avatarSrc;
        this._navigationAvatarPreloadPromise = new Promise((resolve) => {
            const image = new Image();
            const finalize = () => resolve();

            image.addEventListener('load', finalize, { once: true });
            image.addEventListener('error', finalize, { once: true });
            image.src = avatarSrc;

            if (image.complete) {
                resolve();
            }
        });
    }

    _logPlayerEntryDebug(message, extra = null) {
        if (extra !== null && typeof extra !== 'undefined') {
            console.log('[AppShell][PlayerEntry]', message, extra);
            return;
        }

        console.log('[AppShell][PlayerEntry]', message);
    }

    _logPlayerHeaderDebug(message, extra = null) {
        if (extra !== null && typeof extra !== 'undefined') {
            console.log('[AppShell][HeaderFlicker]', message, extra);
            return;
        }

        console.log('[AppShell][HeaderFlicker]', message);
    }

    _logHeaderStability(message, extra = null) {
        if (extra !== null && typeof extra !== 'undefined') {
            console.log('[AppShell][HeaderStable]', message, extra);
            return;
        }

        console.log('[AppShell][HeaderStable]', message);
    }

    _hideEmbeddedHeaderWrap(componentEl) {
        if (!(componentEl instanceof HTMLElement)) return;
        const headerWrap = componentEl.shadowRoot?.querySelector('.header-wrap');
        if (!(headerWrap instanceof HTMLElement)) return;

        headerWrap.style.visibility = 'hidden';
        headerWrap.style.opacity = '0';
        headerWrap.style.pointerEvents = 'none';
    }

    _syncEmbeddedHeadersVisibility() {
        const homeView = this.shadowRoot.getElementById('home-view');
        const caseView = this.shadowRoot.getElementById('case-view');
        const playerView = this.shadowRoot.getElementById('player-view-host')?.querySelector('ds-player-view');

        this._hideEmbeddedHeaderWrap(homeView);
        this._hideEmbeddedHeaderWrap(caseView);
        this._hideEmbeddedHeaderWrap(playerView);
    }

    _configureGlobalHeaderHitboxPassThrough() {
        const globalHeaderWrap = this.shadowRoot.getElementById('global-header-wrap');
        const globalHeader = this.shadowRoot.getElementById('global-header');
        if (!(globalHeader instanceof HTMLElement)) return;

        if (globalHeaderWrap instanceof HTMLElement) {
            globalHeaderWrap.style.pointerEvents = 'none';
        }

        globalHeader.style.pointerEvents = 'none';

        const breadcrumbRegion = globalHeader.shadowRoot?.querySelector('.breadcrumb-region');
        const breadcrumbEl = globalHeader.shadowRoot?.querySelector('ds-breadcrumb');
        const navigationRegion = globalHeader.shadowRoot?.querySelector('.navigation-region');
        const navigationMenu = globalHeader.shadowRoot?.querySelector('ds-navigation-menu');

        if (breadcrumbRegion instanceof HTMLElement) {
            // Prevent invisible full-width breadcrumb container from stealing timeline drag.
            breadcrumbRegion.style.pointerEvents = 'none';
        }

        if (breadcrumbEl instanceof HTMLElement) {
            breadcrumbEl.style.pointerEvents = 'auto';
        }

        if (navigationRegion instanceof HTMLElement) {
            navigationRegion.style.pointerEvents = 'auto';
        }

        if (navigationMenu instanceof HTMLElement) {
            navigationMenu.style.pointerEvents = 'auto';
        }
    }

    _resolveReturnTooltipKeyLabel() {
        const tooltipParts = getShortcutTooltipParts('navigate-back');
        const resolved = String(tooltipParts?.kbdKey || '').trim();
        return resolved || 'Backspace';
    }

    _resolveOpenPlayerTooltipParts() {
        const tooltipParts = getShortcutTooltipParts('open-player');
        return {
            kbdLabel: String(tooltipParts?.kbdLabel || '').trim(),
            kbdKey: String(tooltipParts?.kbdKey || '').trim() || 'Enter',
            showPlus: Boolean(tooltipParts?.showPlus)
        };
    }

    _applyBreadcrumbReturnTooltipKeyLabel(headerEl) {
        if (!(headerEl instanceof HTMLElement)) return;

        const applyLabel = () => {
            const breadcrumbEl = headerEl.shadowRoot?.querySelector('ds-breadcrumb');
            const breadcrumbRoot = breadcrumbEl?.shadowRoot;
            if (!breadcrumbRoot) return;

            const returnText = String(t('btn_return') || '').trim();

            const returnButton = breadcrumbRoot.querySelector('.crumb-return-wrapper .crumb-return-btn');
            if (returnButton instanceof HTMLElement) {
                returnButton.setAttribute('aria-label', returnText);
            }

            const returnTooltip = breadcrumbRoot.querySelector('.crumb-return-wrapper ds-tooltip');
            if (!(returnTooltip instanceof HTMLElement)) return;

            returnTooltip.setAttribute('text', returnText);
            returnTooltip.setAttribute('kbd-label', this._resolveReturnTooltipKeyLabel());
        };

        applyLabel();
        requestAnimationFrame(applyLabel);
    }

    _applyCasePrimaryActionTooltipKeyLabel(caseViewEl) {
        if (!(caseViewEl instanceof HTMLElement)) return;

        const applyLabel = () => {
            const articleEl = caseViewEl.shadowRoot?.querySelector('ds-article');
            const articleRoot = articleEl?.shadowRoot;
            if (!articleRoot) return;

            const tooltipEl = articleRoot.querySelector('.tooltip-primary');
            if (!(tooltipEl instanceof HTMLElement)) return;

            const tooltipParts = this._resolveOpenPlayerTooltipParts();

            tooltipEl.setAttribute('kbd-key', tooltipParts.kbdKey);

            if (tooltipParts.kbdLabel) {
                tooltipEl.setAttribute('kbd-label', tooltipParts.kbdLabel);
            } else {
                tooltipEl.removeAttribute('kbd-label');
            }

            if (tooltipParts.showPlus) {
                tooltipEl.setAttribute('kbd-show-plus', '');
            } else {
                tooltipEl.removeAttribute('kbd-show-plus');
            }
        };

        applyLabel();
        requestAnimationFrame(applyLabel);
    }

    _applyGlobalHeaderReturnOnlyMode(headerEl, isEnabled) {
        if (!(headerEl instanceof HTMLElement)) return;

        const isPlayerUiHidden = this._resolveEffectivePlayerUiHidden();
        const canShowLanguageMenu = this._canShowLanguageMenu();

        if (isPlayerUiHidden) {
            headerEl.showNavigationRegion = false;
            headerEl.showLanguageMenu = false;
        }

        const forcedVisibility = resolveReturnOnlyVisibilityOverrides(isEnabled && !isPlayerUiHidden);
        if (forcedVisibility) {
            headerEl.showNavigationRegion = forcedVisibility.showNavigationRegion;
            headerEl.showLanguageMenu = canShowLanguageMenu ? forcedVisibility.showLanguageMenu : false;
        } else if (!canShowLanguageMenu) {
            headerEl.showLanguageMenu = false;
        }

        const breadcrumbEl = headerEl.shadowRoot?.querySelector('ds-breadcrumb');
        const breadcrumbRoot = breadcrumbEl?.shadowRoot;
        if (!breadcrumbRoot) return;

        const returnWrapper = breadcrumbRoot.querySelector('.crumb-return-wrapper');
        const nonReturnNodes = breadcrumbRoot.querySelectorAll('.crumb-home-btn, .crumb-item-wrapper, .crumb-separator');

        if (returnWrapper instanceof HTMLElement) {
            returnWrapper.style.display = '';
            returnWrapper.style.opacity = '1';
            returnWrapper.style.visibility = 'visible';
            returnWrapper.style.pointerEvents = 'auto';
        }

        nonReturnNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (isEnabled) {
                node.style.display = 'none';
                node.style.opacity = '0';
                node.style.visibility = 'hidden';
                node.style.pointerEvents = 'none';
            } else {
                node.style.display = '';
                node.style.opacity = '';
                node.style.visibility = '';
                node.style.pointerEvents = '';
            }
        });

        this._applyBreadcrumbReturnTooltipKeyLabel(headerEl);
    }

    _isAnyNavigationContextMenuOpen() {
        const menuHosts = this._collectNavigationMenuHosts();

        return menuHosts.some((menuHost) => {
            if (!(menuHost instanceof HTMLElement)) return false;
            return menuHost.hasAttribute('language-menu-open')
                || menuHost.hasAttribute('accessibility-menu-open')
                || Boolean(menuHost.shadowRoot?.querySelector('.language-menu[open], .accessibility-menu[open]'));
        });
    }

    _resolveEffectivePlayerUiHidden() {
        if (this.state?.currentView !== 'player') return false;
        if (!this._playerUiHidden) return false;
        return !this._isAnyNavigationContextMenuOpen();
    }

    _syncPlayerUiHiddenState() {
        const playerView = this.shadowRoot
            .getElementById('player-view-host')
            ?.querySelector('ds-player-view');

        if (!(playerView instanceof HTMLElement)) return false;

        const effectiveUiHidden = this._resolveEffectivePlayerUiHidden();
        playerView.toggleAttribute('ui-hidden', effectiveUiHidden);
        return effectiveUiHidden;
    }

    _queueContextualMenuVisibilitySync() {
        if (this._contextualMenuSyncFrame) {
            cancelAnimationFrame(this._contextualMenuSyncFrame);
        }

        this._contextualMenuSyncFrame = requestAnimationFrame(() => {
            this._contextualMenuSyncFrame = 0;
            this._syncPlayerUiHiddenState();
            this.updateHeader();
            // Re-attach i18n-driven menu labels/headers after visibility-driven header updates.
            this._syncNavigationLanguageMenus();
        });
    }

    _buildGlobalHeaderBreadcrumbItems() {
        const currentView = this.state.currentView;
        const homeView = this.shadowRoot.getElementById('home-view');
        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);

        if (currentView === 'home') {
            const homeItems = Array.isArray(homeView?.breadcrumbItems) ? homeView.breadcrumbItems : null;
            return homeItems && homeItems.length > 0
                ? homeItems
                : [
                    { id: 'home', label: t('nav_home'), hasMenu: false },
                    { id: 'portfolio', label: 'Portfolio', hasMenu: false },
                    { id: 'homeview', label: 'Home View', hasMenu: false }
                ];
        }

        const breadcrumbPath = this._buildSmartBreadcrumbViewPath(currentView);
        const aboutPayload = parseAboutMarkdown(aboutMeMarkdownRaw);
        const aboutTitle = this.getLang(aboutPayload.title) || 'About Me';
        const caseReaderContext = activeCase
            ? this._buildBreadcrumbMenuContext(activeCase.id, 'caseReader')
            : null;
        const playerContext = activeCase
            ? this._buildBreadcrumbMenuContext(activeCase.id, 'playerView')
            : null;

        const breadcrumbItems = breadcrumbPath
            .map((viewId) => this._buildBreadcrumbItemForView(viewId, {
                activeCase,
                aboutTitle,
                caseReaderContext,
                playerContext
            }))
            .filter(Boolean);

        return breadcrumbItems.length > 0
            ? breadcrumbItems
            : [{ id: 'home', label: t('nav_home'), hasMenu: false }];
    }

    _buildSmartBreadcrumbViewPath(currentView = this.state.currentView) {
        const supportedViews = new Set(['home', 'case', 'player', 'about']);
        const history = this._getNormalizedViewHistory().filter((viewId) => supportedViews.has(viewId));
        const compressed = [];

        history.forEach((viewId) => {
            if (compressed[compressed.length - 1] !== viewId) {
                compressed.push(viewId);
            }
        });

        if (supportedViews.has(currentView) && compressed[compressed.length - 1] !== currentView) {
            compressed.push(currentView);
        }

        const reducedPath = [];
        compressed.forEach((viewId) => {
            const existingIndex = reducedPath.lastIndexOf(viewId);
            if (existingIndex >= 0) {
                reducedPath.splice(existingIndex + 1);
                return;
            }
            reducedPath.push(viewId);
        });

        const homeIndex = reducedPath.lastIndexOf('home');
        const pathFromHome = homeIndex >= 0 ? reducedPath.slice(homeIndex) : reducedPath;

        if (pathFromHome.length === 0) {
            return ['home'];
        }

        if (pathFromHome[0] !== 'home') {
            return ['home', ...pathFromHome];
        }

        return pathFromHome;
    }

    _buildBreadcrumbItemForView(viewId, context = {}) {
        const {
            activeCase,
            aboutTitle,
            caseReaderContext,
            playerContext
        } = context;

        if (viewId === 'home') {
            return { id: 'home', label: t('nav_home'), hasMenu: false };
        }

        if (viewId === 'case') {
            if (!activeCase) {
                return { id: 'case', label: t('search_case_studies_label'), hasMenu: false };
            }

            const title = this._isCaseLocked(activeCase)
                ? t('protected_case')
                : (this.getLang(activeCase.title) || activeCase.id);
            const {
                breadcrumbMenuLabels,
                breadcrumbMenuIconConfig,
                caseMenuItems
            } = caseReaderContext || {};

            return {
                id: 'case',
                label: title,
                hasMenu: Array.isArray(caseMenuItems) && caseMenuItems.length > 0,
                menuItems: Array.isArray(caseMenuItems) ? caseMenuItems : [],
                menuHeader: breadcrumbMenuLabels?.caseHeader,
                menuItemIcon: breadcrumbMenuIconConfig?.caseStudies?.itemIcon,
                menuItemIconVariant: breadcrumbMenuIconConfig?.caseStudies?.itemIconVariant,
                menuItemShowIcon: breadcrumbMenuIconConfig?.caseStudies?.showItemIcon
            };
        }

        if (viewId === 'player') {
            const {
                breadcrumbMenuLabels,
                breadcrumbMenuIconConfig,
                videoMenuItems
            } = playerContext || {};

            return {
                id: 'video',
                label: t('player_video_title'),
                hasMenu: Array.isArray(videoMenuItems) && videoMenuItems.length > 0,
                menuItems: Array.isArray(videoMenuItems) ? videoMenuItems : [],
                menuHeader: breadcrumbMenuLabels?.videoHeader,
                menuItemIcon: breadcrumbMenuIconConfig?.videos?.itemIcon,
                menuItemIconVariant: breadcrumbMenuIconConfig?.videos?.itemIconVariant,
                menuItemShowIcon: breadcrumbMenuIconConfig?.videos?.showItemIcon
            };
        }

        if (viewId === 'about') {
            return { id: 'about', label: aboutTitle || t('about_title'), hasMenu: false };
        }

        return null;
    }

    _resolveViewIdFromBreadcrumbId(crumbId) {
        const normalizedCrumbId = String(crumbId || '').trim().toLowerCase();
        if (!normalizedCrumbId) return '';
        if (normalizedCrumbId === 'video') return 'player';
        if (normalizedCrumbId === 'player') return 'player';
        if (normalizedCrumbId === 'home') return 'home';
        if (normalizedCrumbId === 'case') return 'case';
        if (normalizedCrumbId === 'about') return 'about';
        return '';
    }

    _buildViewHistoryForBreadcrumbSelection(crumbId) {
        const nextView = this._resolveViewIdFromBreadcrumbId(crumbId);
        if (!nextView) return null;

        const breadcrumbIdPath = this._buildSmartBreadcrumbViewPath().map((viewId) => (
            viewId === 'player' ? 'video' : viewId
        ));
        const selectedCrumbIndex = breadcrumbIdPath.lastIndexOf(String(crumbId || '').trim().toLowerCase());
        const fallbackHistory = nextView === 'home' ? ['home'] : ['home', nextView];

        if (selectedCrumbIndex < 0) {
            return fallbackHistory;
        }

        const nextHistory = breadcrumbIdPath
            .slice(0, selectedCrumbIndex + 1)
            .map((id) => this._resolveViewIdFromBreadcrumbId(id))
            .filter(Boolean)
            .filter((viewId, index, arr) => index === 0 || arr[index - 1] !== viewId);

        if (nextHistory.length === 0) {
            return fallbackHistory;
        }

        if (nextHistory[0] !== 'home') {
            nextHistory.unshift('home');
        }

        if (nextHistory[nextHistory.length - 1] !== nextView) {
            nextHistory.push(nextView);
        }

        return nextHistory.slice(-20);
    }

    _transitionToBreadcrumbSelection(crumbId, options = {}) {
        const nextView = this._resolveViewIdFromBreadcrumbId(crumbId);
        if (!nextView) return false;

        const activeCaseId = options.activeCaseId !== undefined
            ? options.activeCaseId
            : this.state.activeCaseId;

        this._transitionToView({
            currentView: nextView,
            activeCaseId: nextView === 'home' ? null : activeCaseId,
            viewHistory: this._buildViewHistoryForBreadcrumbSelection(crumbId)
        });

        return true;
    }

    _bindGlobalHeaderEvents() {
        if (this._globalHeaderEventsBound) return;
        const globalHeader = this.shadowRoot.getElementById('global-header');
        if (!(globalHeader instanceof HTMLElement)) return;

        this._configureGlobalHeaderHitboxPassThrough();

        this._bindNavigationMenuListeners(globalHeader);

        globalHeader.addEventListener('ds-breadcrumb-home', () => {
            console.debug('[app-shell][nav] breadcrumb-home', {
                source: 'global-header',
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });
            this._transitionToView({ currentView: 'home', activeCaseId: null });
        });

        globalHeader.addEventListener('ds-breadcrumb-return', () => {
            console.debug('[app-shell][nav] breadcrumb-return', {
                source: 'global-header',
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });
            this._handleReturnNavigation({ source: 'global-header' });
        });

        globalHeader.addEventListener('ds-breadcrumb-select', (event) => {
            const crumbId = event.detail?.id;
            const parentCrumbId = event.detail?.parentItem?.id;
            const selectedCaseId = event.detail?.selectedMenuItem?.id || event.detail?.id;

            console.debug('[app-shell][nav] breadcrumb-select', {
                source: 'global-header',
                crumbId,
                parentCrumbId,
                selectedCaseId,
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });

            if (this._handleCaseVideoBreadcrumbSelection(parentCrumbId, selectedCaseId)) return;

            if (crumbId === 'home') {
                this._transitionToBreadcrumbSelection('home', { activeCaseId: null });
                return;
            }

            if (crumbId === 'case') {
                this._transitionToBreadcrumbSelection('case', { activeCaseId: this.state.activeCaseId });
                return;
            }

            if (crumbId === 'video') {
                this._transitionToBreadcrumbSelection('video', { activeCaseId: this.state.activeCaseId });
            }
        });

        this._globalHeaderEventsBound = true;
    }

    _collectHeaderState(headerOrContainer) {
        if (!(headerOrContainer instanceof HTMLElement)) {
            return {
                hasHeader: false,
                hasNavigationMenu: false,
                aboutButtonReady: false,
                showBreadcrumb: null,
                showLanguageMenu: null,
                showNavigationRegion: null,
                hidden: null,
                display: null
            };
        }

        const headerEl = headerOrContainer.matches('ds-header')
            ? headerOrContainer
            : (headerOrContainer.shadowRoot?.querySelector('ds-header') || null);
        const navigationMenu = headerEl?.shadowRoot?.querySelector('ds-navigation-menu') || null;
        const aboutButton = navigationMenu?.shadowRoot?.querySelector('.avatar-button') || null;

        return {
            hasHeader: headerEl instanceof HTMLElement,
            hasNavigationMenu: navigationMenu instanceof HTMLElement,
            aboutButtonReady: aboutButton instanceof HTMLElement,
            showBreadcrumb: headerEl?.getAttribute('show-breadcrumb') ?? null,
            showLanguageMenu: headerEl?.getAttribute('show-language-menu') ?? null,
            showNavigationRegion: headerEl?.getAttribute('show-navigation-region') ?? null,
            hidden: headerOrContainer.hidden ?? null,
            display: headerOrContainer.style?.display ?? null
        };
    }

    _getHeaderElement(headerOrContainer) {
        if (!(headerOrContainer instanceof HTMLElement)) return null;
        if (headerOrContainer.matches('ds-header')) return headerOrContainer;
        return headerOrContainer.shadowRoot?.querySelector('ds-header') || null;
    }

    _stabilizeHeaderVisuals(headerOrContainer, viewName = '') {
        const headerEl = this._getHeaderElement(headerOrContainer);
        const navigationMenu = headerEl?.shadowRoot?.querySelector('ds-navigation-menu') || null;
        const avatarButton = navigationMenu?.shadowRoot?.querySelector('.avatar-button') || null;

        if (!(headerEl instanceof HTMLElement) || !(navigationMenu instanceof HTMLElement)) {
            this._logHeaderStability('Header visual stabilization skipped', {
                view: viewName,
                hasHeader: headerEl instanceof HTMLElement,
                hasNavigationMenu: navigationMenu instanceof HTMLElement
            });
            return;
        }

        const lockTargets = [headerEl, navigationMenu, avatarButton].filter((node) => node instanceof HTMLElement);

        lockTargets.forEach((target) => {
            target.style.transition = 'none';
            target.style.animation = 'none';
            target.style.backfaceVisibility = 'hidden';
            target.style.transform = 'translateZ(0)';
        });

        // Permanently disable internal shadow-DOM transitions in nav menu to prevent route flicker.
        navigationMenu.setAttribute('a11y-reduce-motion', '');

        // Forces style/layout flush so stabilization takes effect before the view becomes active.
        void navigationMenu.offsetHeight;

        this._logHeaderStability('Header visual stabilization locked', {
            view: viewName || 'unknown',
            aboutButtonReady: avatarButton instanceof HTMLElement
        });
    }

    _prewarmHeaderForView(viewName) {
        const globalHeader = this.shadowRoot.getElementById('global-header');
        if (!(globalHeader instanceof HTMLElement)) return;

        const homeView = this.shadowRoot.getElementById('home-view');
        const fallbackHomeBreadcrumb = homeView?.showBreadcrumb ? 'true' : 'false';
        const fallbackVisibility = viewName === 'home'
            ? {
                'show-breadcrumb': fallbackHomeBreadcrumb,
                'show-language-menu': 'true',
                'show-navigation-region': 'true',
                'show-about': 'true'
            }
            : {
                'show-breadcrumb': 'true',
                'show-language-menu': 'true',
                'show-navigation-region': 'true',
                'show-about': viewName === 'about' ? 'false' : 'true'
            };

        this._applyHeaderContractToElement(globalHeader, { fallbackVisibility });
        this._stabilizeHeaderVisuals(globalHeader, viewName || 'unknown');
    }

    _detachPlayerHeaderDebugObserver() {
        if (typeof this._playerHeaderDebugVideoCleanup === 'function') {
            this._playerHeaderDebugVideoCleanup();
        }
        this._playerHeaderDebugVideoCleanup = null;

        if (this._playerHeaderDebugObserver) {
            this._playerHeaderDebugObserver.disconnect();
            this._playerHeaderDebugObserver = null;
        }
        this._playerHeaderDebugObservedView = null;
    }

    _attachPlayerHeaderDebugObserver(playerView) {
        if (!(playerView instanceof HTMLElement)) return;
        if (this._playerHeaderDebugObservedView === playerView && this._playerHeaderDebugObserver) return;

        this._detachPlayerHeaderDebugObserver();

        const headerEl = playerView.shadowRoot?.querySelector('ds-header') || null;
        const navigationEl = headerEl?.shadowRoot?.querySelector('ds-navigation-menu') || null;
        const navigationShadow = navigationEl?.shadowRoot || null;
        const resolveAboutButton = () => navigationShadow?.querySelector('.avatar-button') || null;

        this._logPlayerHeaderDebug('Attaching ABOUT-only observer', {
            hasHeaderEl: headerEl instanceof HTMLElement,
            hasNavigationEl: navigationEl instanceof HTMLElement,
            hasNavigationShadow: Boolean(navigationShadow),
            hasAboutButton: resolveAboutButton() instanceof HTMLElement
        });

        const logAboutSnapshot = (reason, target = null, attributeName = '') => {
            const aboutButton = resolveAboutButton();
            if (!(aboutButton instanceof HTMLElement)) {
                this._logPlayerHeaderDebug('about button not found', { reason });
                return;
            }

            const inspectTarget = target instanceof HTMLElement ? target : aboutButton;
            const computed = getComputedStyle(inspectTarget);
            const avatarImage = aboutButton.querySelector('img');

            this._logPlayerHeaderDebug('about button mutation', {
                reason,
                attributeName,
                targetTag: inspectTarget.tagName,
                targetClassName: inspectTarget.className || '',
                aboutHidden: aboutButton.hidden,
                aboutAriaHidden: aboutButton.getAttribute('aria-hidden'),
                aboutClassName: aboutButton.className || '',
                aboutInlineStyle: aboutButton.getAttribute('style') || '',
                computedDisplay: computed.display,
                computedVisibility: computed.visibility,
                computedOpacity: computed.opacity,
                computedTransform: computed.transform,
                avatarSrc: avatarImage?.getAttribute('src') || '',
                avatarHidden: avatarImage?.hidden || false,
                avatarClassName: avatarImage?.className || '',
                avatarInlineStyle: avatarImage?.getAttribute('style') || ''
            });
        };

        if (!navigationShadow) {
            this._playerHeaderDebugObservedView = playerView;
            return;
        }

        const observer = new MutationObserver((mutations) => {
            const aboutButton = resolveAboutButton();

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const hadRelatedNode = [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
                        if (!(node instanceof HTMLElement)) return false;
                        return node.matches('.avatar-button')
                            || node.matches('.avatar-button *')
                            || node.querySelector('.avatar-button') !== null;
                    });

                    if (hadRelatedNode || aboutButton instanceof HTMLElement) {
                        logAboutSnapshot('childList', null, '');
                    }
                    return;
                }

                if (mutation.type !== 'attributes') return;
                if (!(mutation.target instanceof HTMLElement)) return;
                if (!(aboutButton instanceof HTMLElement)) {
                    logAboutSnapshot('attributes-missing-button', mutation.target, mutation.attributeName || '');
                    return;
                }

                const target = mutation.target;
                const isAboutTarget = target === aboutButton || aboutButton.contains(target);
                if (!isAboutTarget) return;

                logAboutSnapshot('attributes', target, mutation.attributeName || '');
            });
        });

        observer.observe(navigationShadow, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'src']
        });

        this._playerHeaderDebugObserver = observer;
        this._playerHeaderDebugObservedView = playerView;
        logAboutSnapshot('initial', resolveAboutButton(), '');
    }

    // MARK: TRANSITIONS ROUTE ENTRYPOINT
    // Moves between views with direction-aware motion while preserving reduced-motion accessibility.
    _transitionToView(newState) {
        const nextView = newState.currentView || this.state.currentView;
        const prevView = this.state.currentView;
        const statePatch = { ...newState };
        const transitionCaseId = statePatch.activeCaseId || this.state.activeCaseId;
        const transitionDirection = nextView === 'home' ? 'back' : 'forward';
        const transitionId = nextView !== prevView ? (this._transitionRunId += 1) : this._transitionRunId;

        this._breadcrumbEntryRevealFromView = prevView;
        this._breadcrumbEntryRevealToView = nextView;

        this._logHeaderStability('Route transition requested', {
            from: prevView,
            to: nextView,
            transitionId
        });

        if (prevView === 'case') {
            this._persistResumeProgress({ force: true });
            if (nextView !== 'case') {
                this._teardownCaseAudioPlayerRuntime();
            }
        }

        this._prewarmHeaderForView(nextView);
        this._logHeaderStability('Prewarmed target header', {
            targetView: nextView,
            home: this._collectHeaderState(this.shadowRoot.getElementById('home-view')),
            case: this._collectHeaderState(this.shadowRoot.getElementById('case-view')),
            player: this._collectHeaderState(this.shadowRoot.getElementById('player-view-host')?.querySelector('ds-player-view'))
        });

        if (nextView !== prevView && transitionCaseId) {
            this._captureThumbnailSnapshotForView(prevView, transitionCaseId);
        }

        if (nextView !== prevView && !Array.isArray(statePatch.viewHistory)) {
            statePatch.viewHistory = [...this.state.viewHistory, nextView].slice(-20);
        }

        if (nextView === 'home' && prevView !== 'home') {
            this._homeEntranceAnimationPending = true;
            this._homeEntranceAnimationMode = 'subtle';
        }

        if (nextView === 'player' && prevView !== 'player') {
            this._playerEntranceAnimationPending = true;
            this._logPlayerEntryDebug('Pending animation armed on route change', {
                from: prevView,
                to: nextView,
                transitionId
            });
        }

        if (nextView === 'about' && prevView !== 'about') {
            this._aboutEntranceAnimationPending = true;
        }

        this._caseEntryAnimationPending = nextView === 'case';

        if (this._shouldUseNativeThumbnailTransition(prevView, nextView, transitionCaseId)) {
            this._runNativeThumbnailTransition({
                prevView,
                nextView,
                statePatch,
                transitionCaseId,
                transitionDirection,
                transitionId
            });
            return;
        }

        this._runManualThumbnailTransition({
            prevView,
            nextView,
            statePatch,
            transitionCaseId,
            transitionDirection,
            transitionId
        });
    }

    // MARK: TRANSITIONS MANUAL AND NATIVE HANDOFF
    // Orchestrates manual and native shared-thumbnail transitions across route changes.
    _runManualThumbnailTransition({ prevView, nextView, statePatch, transitionCaseId, transitionDirection, transitionId = this._transitionRunId }) {
        this._cleanupViewTransitions();
        this._prepareThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView);
        this.setAttribute('data-route-direction', transitionDirection);

        if (nextView === 'home' && prevView !== 'home' && this._hasSavedHomeGalleryOffset) {
            this._homeGalleryRestorePending = true;
            this._homeGalleryRestoreRetryCount = 0;
        }

        this.setState(statePatch);

        // Keeps the case reader header anchored consistently when entering a case.
        if (nextView === 'case') {
            this._scrollAppToTop();
        }

        this._playThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView, 0, transitionId);
    }

    _getTransitionPair(prevView, nextView) {
        return `${prevView}->${nextView}`;
    }

    _isNativeMorphPreferredPair(prevView, nextView) {
        const pair = this._getTransitionPair(prevView, nextView);
        const nativePairs = new Set([
            'home->case',
            'case->home',
            'case->player',
            'player->case',
            'home->player',
            'player->home'
        ]);
        return nativePairs.has(pair);
    }

    _shouldUseNativeThumbnailTransition(prevView, nextView, caseId) {
        if (!this._enableNativeViewTransition) return false;
        if (!caseId) return false;
        if (this._shouldReduceMotion()) return false;
        if (typeof document.startViewTransition !== 'function') return false;

        return this._isNativeMorphPreferredPair(prevView, nextView);
    }

    _ensureNativeTransitionStyles() {
        if (this._nativeTransitionStyleReady) return;
        const styleId = 'portfoliable-shared-thumb-transition-style';
        if (document.getElementById(styleId)) {
            this._nativeTransitionStyleReady = true;
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            ::view-transition-group(case-media) {
                animation-duration: 460ms;
                animation-timing-function: cubic-bezier(0.22, 0.88, 0.32, 1);
            }
            ::view-transition-old(case-media),
            ::view-transition-new(case-media) {
                animation-duration: 460ms;
                animation-timing-function: cubic-bezier(0.22, 0.88, 0.32, 1);
            }
        `;
        document.head.appendChild(style);
        this._nativeTransitionStyleReady = true;
    }

    _clearNativeTransitionNames() {
        this._nativeNamedElements.forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            el.style.viewTransitionName = '';
        });
        this._nativeNamedElements.clear();
    }

    _assignNativeTransitionName(element, name = 'case-media') {
        if (!(element instanceof HTMLElement)) return false;
        element.style.viewTransitionName = name;
        this._nativeNamedElements.add(element);
        return true;
    }

    _resolveNativeTransitionSource(prevView, nextView, caseId) {
        if (prevView === 'home' && nextView === 'case') {
            const hinted = this._homeTransitionSourceHint?.caseId === caseId ? this._homeTransitionSourceHint.element : null;
            if (hinted instanceof HTMLElement && hinted.isConnected) {
                return hinted;
            }
        }
        return this._resolveThumbnailForView(prevView, caseId);
    }

    _resolveNativeTransitionTarget(nextView, caseId) {
        return this._resolveThumbnailForView(nextView, caseId);
    }

    async _runNativeThumbnailTransition({ prevView, nextView, statePatch, transitionCaseId, transitionDirection, transitionId = this._transitionRunId }) {
        this._cleanupViewTransitions();
        this._ensureNativeTransitionStyles();
        this._clearNativeTransitionNames();

        // Prepare manual shared-element data before DOM update so source geometry is stable.
        this._prepareThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView);

        const sourceEl = this._resolveNativeTransitionSource(prevView, nextView, transitionCaseId);
        if (!this._assignNativeTransitionName(sourceEl)) {
            this._setTransitionDebug('manual-fallback', 'native-missing-source');
            this._runManualThumbnailTransition({
                prevView,
                nextView,
                statePatch,
                transitionCaseId,
                transitionDirection,
                transitionId
            });
            return;
        }

        let nativeHasNamedTarget = false;
        let transition;

        try {
            transition = document.startViewTransition(() => {
                this.setAttribute('data-route-direction', transitionDirection);

                if (nextView === 'home' && prevView !== 'home' && this._hasSavedHomeGalleryOffset) {
                    this._homeGalleryRestorePending = true;
                    this._homeGalleryRestoreRetryCount = 0;
                }

                this.setState(statePatch);

                if (nextView === 'case') {
                    this._scrollAppToTop();
                }

                const targetEl = this._resolveNativeTransitionTarget(nextView, transitionCaseId);
                nativeHasNamedTarget = this._assignNativeTransitionName(targetEl);
            });
        } catch {
            this._clearNativeTransitionNames();
            this._setTransitionDebug('manual-fallback', 'native-start-failed');
            this._runManualThumbnailTransition({
                prevView,
                nextView,
                statePatch,
                transitionCaseId,
                transitionDirection,
                transitionId
            });
            return;
        }

        transition.ready
            .then(() => {
                if (nativeHasNamedTarget) {
                    this._setTransitionDebug('native-running', `${prevView}-to-${nextView}`);
                    return;
                }

                this._setTransitionDebug('manual-fallback', 'native-missing-target');
                this._playThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView, 0, transitionId);
            })
            .catch(() => {
                this._setTransitionDebug('manual-fallback', 'native-ready-failed');
                this._playThumbnailTransition(transitionDirection, transitionCaseId, prevView, nextView, 0, transitionId);
            });

        transition.finished.finally(() => {
            if (nativeHasNamedTarget) {
                this._pendingThumbnailTransition = null;
            }
            this._clearNativeTransitionNames();
            if (nativeHasNamedTarget) {
                this._setTransitionDebug('native-animated', `${prevView}-to-${nextView}`);
            }
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
        if (this._activeThumbnailTransition?.finish) {
            this._activeThumbnailTransition.finish();
        }
        this._activeThumbnailTransition = null;
        this._pendingThumbnailTransition = null;
    }

    _getGlobalBreadcrumbAnimationTarget() {
        const globalHeader = this.shadowRoot?.getElementById('global-header');
        const breadcrumbEl = globalHeader?.shadowRoot?.querySelector('ds-breadcrumb') || null;
        const breadcrumbNav = breadcrumbEl?.shadowRoot?.querySelector('.top-breadcrumb') || null;

        if (breadcrumbNav instanceof HTMLElement) {
            return breadcrumbNav;
        }

        const breadcrumbRegion = globalHeader?.shadowRoot?.querySelector('.breadcrumb-region') || null;
        return breadcrumbRegion instanceof HTMLElement ? breadcrumbRegion : null;
    }

    _shouldAnimateBreadcrumbEntryForView(targetView) {
        return this._breadcrumbEntryRevealFromView === 'home'
            && this._breadcrumbEntryRevealToView === targetView
            && (targetView === 'case' || targetView === 'about');
    }

    _resolveThumbnailForView(viewName, caseId) {
        if (!caseId) return null;
        if (viewName === 'home') return this._getHomeThumbnailElementByCaseId(caseId);
        if (viewName === 'case') return this._getCaseThumbnailElement();
        if (viewName === 'player') return this._getPlayerThumbnailElement();
        return null;
    }

    _setTransitionDebug(mode, reason) {
        this._transitionDebug = { mode, reason };
        this.dataset.transitionMode = mode;
        this.dataset.transitionReason = reason;
    }

    _setAttributes(element, attributes = {}) {
        if (!(element instanceof HTMLElement)) return;

        Object.entries(attributes).forEach(([name, value]) => {
            if (value === null || typeof value === 'undefined') {
                if (element.hasAttribute(name)) {
                    element.removeAttribute(name);
                }
                return;
            }

            const nextValue = String(value);
            if (element.getAttribute(name) === nextValue) {
                return;
            }

            element.setAttribute(name, nextValue);
        });
    }

    _toRectSnapshot(rectLike) {
        if (!rectLike) return null;
        return {
            left: Number(rectLike.left) || 0,
            top: Number(rectLike.top) || 0,
            width: Number(rectLike.width) || 0,
            height: Number(rectLike.height) || 0
        };
    }

    _isValidRect(rectLike) {
        return Boolean(rectLike)
            && Number.isFinite(rectLike.left)
            && Number.isFinite(rectLike.top)
            && Number.isFinite(rectLike.width)
            && Number.isFinite(rectLike.height)
            && rectLike.width > 0
            && rectLike.height > 0;
    }

    // MARK: HOME VIEW TRANSITION SOURCE HINTS
    // Captures originating gallery thumbnail elements to improve transition source matching.
    _captureHomeTransitionSourceHint(event, caseId, galleryIndex = null) {
        if (!caseId || this.state.currentView !== 'home') return;

        const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];
        let thumbnailEl = null;

        for (const node of path) {
            if (!(node instanceof HTMLElement)) continue;
            if (node.matches('ds-thumbnail')) {
                thumbnailEl = node;
                break;
            }
            const nested = node.shadowRoot?.querySelector?.('ds-thumbnail');
            if (nested instanceof HTMLElement) {
                thumbnailEl = nested;
                break;
            }
        }

        if (!(thumbnailEl instanceof HTMLElement) && Number.isInteger(galleryIndex) && galleryIndex >= 0) {
            const candidate = this._portfolioCases[galleryIndex];
            if (candidate?.id === caseId) {
                thumbnailEl = this._getHomeThumbnailElementByCaseId(caseId);
            }
        }

        if (!(thumbnailEl instanceof HTMLElement)) return;
        const rect = thumbnailEl.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        this._homeTransitionSourceHint = {
            caseId,
            element: thumbnailEl,
            rect: this._toRectSnapshot(rect),
            sourceRadius: this._readTransitionRadius(thumbnailEl, 24),
            sourceImageSrc: this._extractThumbnailImageSource(thumbnailEl),
            capturedAt: performance.now()
        };

        this._rememberThumbnailSnapshot({
            viewName: 'home',
            caseId,
            element: thumbnailEl,
            rect: this._homeTransitionSourceHint.rect,
            sourceRadius: this._homeTransitionSourceHint.sourceRadius,
            sourceImageSrc: this._homeTransitionSourceHint.sourceImageSrc
        });
    }

    _getThumbnailSnapshotCacheKey(viewName, caseId) {
        if (!viewName || !caseId) return '';
        return `${viewName}:${caseId}`;
    }

    _rememberThumbnailSnapshot({ viewName, caseId, element = null, rect = null, sourceRadius = null, sourceImageSrc = '' }) {
        const cacheKey = this._getThumbnailSnapshotCacheKey(viewName, caseId);
        if (!cacheKey) return null;

        const resolvedRect = this._isValidRect(rect)
            ? this._toRectSnapshot(rect)
            : this._toRectSnapshot(element?.getBoundingClientRect?.());
        if (!this._isValidRect(resolvedRect)) return null;

        const snapshot = {
            caseId,
            viewName,
            rect: resolvedRect,
            sourceRadius: Number.isFinite(sourceRadius) && sourceRadius > 0
                ? sourceRadius
                : this._readTransitionRadius(element, 20),
            sourceImageSrc: sourceImageSrc || this._extractThumbnailImageSource(element),
            capturedAt: performance.now()
        };

        this._thumbnailTransitionCache.set(cacheKey, snapshot);
        return snapshot;
    }

    _getRememberedThumbnailSnapshot(viewName, caseId) {
        const cacheKey = this._getThumbnailSnapshotCacheKey(viewName, caseId);
        if (!cacheKey) return null;
        return this._thumbnailTransitionCache.get(cacheKey) || null;
    }

    _captureThumbnailSnapshotForView(viewName, caseId) {
        if (!viewName || !caseId) return null;
        const element = this._resolveThumbnailForView(viewName, caseId);
        if (!(element instanceof HTMLElement)) return null;

        return this._rememberThumbnailSnapshot({
            viewName,
            caseId,
            element,
            rect: this._toRectSnapshot(element.getBoundingClientRect()),
            sourceRadius: this._readTransitionRadius(element, 20),
            sourceImageSrc: this._extractThumbnailImageSource(element)
        });
    }

    _estimateThumbnailRectForView(viewName, caseId) {
        if (viewName === 'home') {
            const homeThumb = this._getHomeThumbnailElementByCaseId(caseId)
                || this.shadowRoot.getElementById('home-view')?.shadowRoot?.querySelector('ds-gallery-item ds-thumbnail');
            const homeThumbRect = this._toRectSnapshot(homeThumb?.getBoundingClientRect?.());
            if (this._isValidRect(homeThumbRect)) return homeThumbRect;

            const homeViewRect = this._toRectSnapshot(this.shadowRoot.getElementById('home-view')?.getBoundingClientRect());
            if (this._isValidRect(homeViewRect)) {
                const width = Math.min(320, Math.max(150, homeViewRect.width * 0.2));
                const height = Math.max(260, width * 1.9);
                return {
                    left: homeViewRect.left + Math.max(24, homeViewRect.width * 0.12),
                    top: homeViewRect.top + Math.max(80, homeViewRect.height * 0.14),
                    width,
                    height
                };
            }
            return null;
        }

        if (viewName === 'case') {
            const caseView = this.shadowRoot.getElementById('case-view');
            const caseSlotThumb = caseView?.querySelector('ds-thumbnail[slot="cover"]');
            const caseSlotRect = this._toRectSnapshot(caseSlotThumb?.getBoundingClientRect?.());
            if (this._isValidRect(caseSlotRect)) return caseSlotRect;

            const containerRect = this._toRectSnapshot(caseView?.getBoundingClientRect?.());

            if (this._isValidRect(containerRect)) {
                const width = Math.min(360, Math.max(180, containerRect.width * 0.24));
                const height = Math.min(containerRect.height * 0.55, Math.max(240, width * 1.9));
                return {
                    left: containerRect.left + Math.max(20, containerRect.width * 0.08),
                    top: containerRect.top + Math.max(72, containerRect.height * 0.1),
                    width,
                    height
                };
            }

            // Prevent first-entry pop: use a viewport-estimated case target when layout is not measurable yet.
            const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0);
            const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 0);
            if (viewportWidth > 0 && viewportHeight > 0) {
                const width = Math.min(360, Math.max(180, viewportWidth * 0.24));
                const height = Math.min(viewportHeight * 0.55, Math.max(240, width * 1.9));
                return {
                    left: Math.max(20, viewportWidth * 0.08),
                    top: Math.max(72, viewportHeight * 0.1),
                    width,
                    height
                };
            }

            return null;
        }

        if (viewName === 'player') {
            const playerThumb = this._getPlayerThumbnailElement();
            const playerRect = this._toRectSnapshot(playerThumb?.getBoundingClientRect?.());
            if (this._isValidRect(playerRect)) return playerRect;

            const playerHostRect = this._toRectSnapshot(this.shadowRoot.getElementById('view-player')?.getBoundingClientRect?.());
            if (this._isValidRect(playerHostRect)) {
                const width = Math.min(420, Math.max(220, playerHostRect.width * 0.28));
                const height = Math.min(playerHostRect.height * 0.72, Math.max(320, width * 1.85));
                return {
                    left: playerHostRect.left + ((playerHostRect.width - width) / 2),
                    top: playerHostRect.top + Math.max(52, (playerHostRect.height - height) * 0.32),
                    width,
                    height
                };
            }
            return null;
        }

        return null;
    }

    _resolveFallbackTargetRect(nextView, caseId = null) {
        const liveTarget = caseId ? this._resolveThumbnailForView(nextView, caseId) : null;
        const liveTargetRect = this._toRectSnapshot(liveTarget?.getBoundingClientRect?.());
        if (this._isValidRect(liveTargetRect)) {
            return liveTargetRect;
        }

        const rememberedTargetRect = this._getRememberedThumbnailSnapshot(nextView, caseId)?.rect;
        if (this._isValidRect(rememberedTargetRect)) {
            return rememberedTargetRect;
        }

        const estimatedTargetRect = this._estimateThumbnailRectForView(nextView, caseId);
        if (this._isValidRect(estimatedTargetRect)) {
            return estimatedTargetRect;
        }

        if (nextView === 'case') {
            const caseView = this.shadowRoot.getElementById('case-view');
            const caseSlotThumb = caseView?.querySelector('ds-thumbnail[slot="cover"]');
            const caseSlotRect = this._toRectSnapshot(caseSlotThumb?.getBoundingClientRect());
            if (this._isValidRect(caseSlotRect)) return caseSlotRect;

            const containerRect = this._toRectSnapshot(caseView?.getBoundingClientRect());

            if (this._isValidRect(containerRect)) {
                const width = Math.min(360, Math.max(180, containerRect.width * 0.24));
                const height = Math.min(containerRect.height * 0.55, Math.max(240, width * 1.9));
                return {
                    left: containerRect.left + Math.max(20, containerRect.width * 0.08),
                    top: containerRect.top + Math.max(72, containerRect.height * 0.1),
                    width,
                    height
                };
            }
        }

        if (nextView === 'home') {
            const homeThumb = this.shadowRoot.getElementById('home-view')?.shadowRoot?.querySelector('ds-gallery-item ds-thumbnail');
            const homeRect = this._toRectSnapshot(homeThumb?.getBoundingClientRect());
            if (this._isValidRect(homeRect)) return homeRect;
        }

        if (nextView === 'player') {
            const playerThumb = this._getPlayerThumbnailElement();
            const playerRect = this._toRectSnapshot(playerThumb?.getBoundingClientRect());
            if (this._isValidRect(playerRect)) return playerRect;
        }

        return null;
    }

    _resolveTransitionTargetRect(targetEl, nextView, caseId, { includeEstimate = true } = {}) {
        let targetRect = this._toRectSnapshot(targetEl?.getBoundingClientRect?.());
        if (this._isValidRect(targetRect)) return targetRect;

        targetRect = this._resolveFallbackTargetRect(nextView, caseId);
        if (this._isValidRect(targetRect)) return targetRect;

        if (!includeEstimate) return null;
        targetRect = this._estimateThumbnailRectForView(nextView, caseId);
        return this._isValidRect(targetRect) ? targetRect : null;
    }

    _resolveFallbackSourceRect(prevView, nextView, caseId) {
        const hintedRect = this._homeTransitionSourceHint?.caseId === caseId
            ? this._homeTransitionSourceHint.rect
            : null;
        if (prevView === 'home' && nextView === 'case' && this._isValidRect(hintedRect)) {
            return hintedRect;
        }

        const rememberedSourceRect = this._getRememberedThumbnailSnapshot(prevView, caseId)?.rect;
        if (this._isValidRect(rememberedSourceRect)) {
            return rememberedSourceRect;
        }

        const liveSource = this._resolveThumbnailForView(prevView, caseId);
        const liveSourceRect = this._toRectSnapshot(liveSource?.getBoundingClientRect?.());
        if (this._isValidRect(liveSourceRect)) {
            return liveSourceRect;
        }

        const estimatedSourceRect = this._estimateThumbnailRectForView(prevView, caseId);
        if (this._isValidRect(estimatedSourceRect)) {
            return estimatedSourceRect;
        }

        return null;
    }

    _resolveThumbnailRenderableElement(element) {
        if (!(element instanceof HTMLElement)) return null;

        if (element.matches('ds-thumbnail')) {
            return element;
        }

        const shadowThumb = element.shadowRoot?.querySelector('ds-thumbnail');
        if (shadowThumb instanceof HTMLElement) {
            return shadowThumb;
        }

        const lightThumb = element.querySelector('ds-thumbnail');
        if (lightThumb instanceof HTMLElement) {
            return lightThumb;
        }

        return element;
    }

    _createThumbnailGhostContent(sourceEl, targetEl) {
        const sourceRenderable = this._resolveThumbnailRenderableElement(sourceEl);
        const targetRenderable = this._resolveThumbnailRenderableElement(targetEl);

        if (sourceRenderable?.matches?.('ds-thumbnail')) {
            const thumbClone = document.createElement('ds-thumbnail');
            for (const attr of sourceRenderable.attributes) {
                thumbClone.setAttribute(attr.name, attr.value);
            }
            thumbClone.style.width = '100%';
            thumbClone.style.height = '100%';
            thumbClone.style.maxHeight = 'none';
            thumbClone.style.pointerEvents = 'none';
            thumbClone.style.margin = '0';
            return thumbClone;
        }

        const ghostImage = document.createElement('img');
        ghostImage.alt = '';
        ghostImage.setAttribute('aria-hidden', 'true');
        ghostImage.draggable = false;
        ghostImage.src = this._extractThumbnailImageSource(sourceRenderable)
            || this._extractThumbnailImageSource(targetRenderable)
            || '';
        return ghostImage;
    }

    _createThumbnailGhostTransfer(sourceEl, targetEl) {
        return {
            node: this._createThumbnailGhostContent(sourceEl, targetEl),
            restore: () => {}
        };
    }

    _getThumbnailTransitionProfile(prevView, nextView, direction) {
        const pair = `${prevView}->${nextView}`;
        const base = {
            duration: 430,
            ease: 'cubic-bezier(0.22, 0.9, 0.33, 1)',
            overshoot: 1,
            settle: 1,
            targetFadeDelayRatio: 0.1,
            targetFadeDuration: 220
        };

        if (pair === 'home->case' || pair === 'case->home') {
            return {
                ...base,
                duration: 460,
                ease: direction === 'forward'
                    ? 'cubic-bezier(0.2, 0.88, 0.3, 1)'
                    : 'cubic-bezier(0.22, 0.84, 0.32, 1)',
                targetFadeDelayRatio: 0.02
            };
        }

        if (pair === 'case->player' || pair === 'player->case') {
            return {
                ...base,
                duration: 420,
                ease: 'cubic-bezier(0.24, 0.86, 0.34, 1)',
                targetFadeDelayRatio: 0.02,
                targetFadeDuration: 200
            };
        }

        if (pair === 'home->player' || pair === 'player->home') {
            return {
                ...base,
                duration: 480,
                ease: direction === 'forward'
                    ? 'cubic-bezier(0.2, 0.9, 0.3, 1)'
                    : 'cubic-bezier(0.22, 0.84, 0.32, 1)',
                targetFadeDelayRatio: 0.02,
                targetFadeDuration: 220
            };
        }

        return base;
    }

    _readTransitionRadius(element, fallbackPx = 20) {
        if (!(element instanceof HTMLElement)) return fallbackPx;

        const renderable = this._resolveThumbnailRenderableElement(element) || element;
        const computed = getComputedStyle(renderable);
        const parsed = Number.parseFloat(computed.borderTopLeftRadius || '');
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }

        return fallbackPx;
    }

    // MARK: I18N RUNTIME VALUE RESOLUTION
    // Resolves localized values from locale objects with configured fallback ordering.
    getLang(prop) {
        if (!prop || typeof prop !== 'object' || Array.isArray(prop)) {
            return prop;
        }

        const currentLocale = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        if (typeof prop[currentLocale] === 'string' && prop[currentLocale].trim().length > 0) {
            return prop[currentLocale];
        }

        if (typeof prop[DEFAULT_LOCALE] === 'string' && prop[DEFAULT_LOCALE].trim().length > 0) {
            return prop[DEFAULT_LOCALE];
        }

        const fallbackEntry = Object.values(prop).find((value) => typeof value === 'string' && value.trim().length > 0);
        return fallbackEntry || '';
    }

    // Resolves subtitle sources for the current locale only.
    // Unlike getLang, this intentionally avoids cross-locale fallback.
    getLangCurrentLocaleOnly(prop) {
        if (typeof prop === 'string') {
            console.debug('[app-shell][i18n][subtitle] current-locale-only string value', {
                lang: resolveLocaleCode(this.state.lang, DEFAULT_LOCALE),
                value: prop
            });
            return prop;
        }

        if (!prop || typeof prop !== 'object' || Array.isArray(prop)) {
            console.debug('[app-shell][i18n][subtitle] current-locale-only received non-localized value', {
                lang: resolveLocaleCode(this.state.lang, DEFAULT_LOCALE),
                value: prop
            });
            return '';
        }

        const currentLocale = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        if (typeof prop[currentLocale] === 'string') {
            console.debug('[app-shell][i18n][subtitle] current-locale-only resolved localized value', {
                lang: currentLocale,
                availableLocales: Object.keys(prop),
                value: prop[currentLocale]
            });
            return prop[currentLocale];
        }

        console.debug('[app-shell][i18n][subtitle] current-locale-only missing locale entry', {
            lang: currentLocale,
            availableLocales: Object.keys(prop)
        });

        return '';
    }

    _resolveCaseKickerProp(caseData) {
        return caseData?.kicker ?? caseData?.year ?? '';
    }

    _resolveCasePrimaryVideoProp(caseData) {
        return caseData?.actions?.primary?.videoSrc
            ?? caseData?.actions?.primary?.['video-src']
            ?? caseData?.videoSrc
            ?? '';
    }

    _resolveCasePrimaryVttProp(caseData) {
        return caseData?.actions?.primary?.vttSrc
            ?? caseData?.actions?.primary?.['vtt-src']
            ?? caseData?.vttSrc
            ?? '';
    }

    _resolveCaseSecondaryUrlProp(caseData) {
        return caseData?.actions?.secondary?.url
            ?? caseData?.actions?.secondary1?.url
            ?? caseData?.repoSrc
            ?? caseData?.repositoryUrl
            ?? '';
    }

    _resolveCaseTertiaryUrlProp(caseData) {
        return caseData?.actions?.tertiary?.url
            ?? caseData?.actions?.secondary2?.url
            ?? caseData?.demoSrc
            ?? caseData?.liveUrl
            ?? '';
    }

    _resolveTitleVisibility(source, fallback = true) {
        if (typeof source?.title?.show === 'boolean') {
            return source.title.show;
        }
        if (typeof source?.showH1 === 'boolean') {
            return source.showH1;
        }
        return fallback;
    }

    _resolveSubtitleVisibility(source, fallback = true) {
        if (typeof source?.shortDesc?.show === 'boolean') {
            return source.shortDesc.show;
        }
        if (typeof source?.subtitle?.show === 'boolean') {
            return source.subtitle.show;
        }
        if (typeof source?.showH2 === 'boolean') {
            return source.showH2;
        }
        return fallback;
    }

    _resolveHeaderContract() {
        const headerConfig = portfoliableDesignConfig?.header || {};
        const visibilityConfig = headerConfig?.visibility || {};
        const navigationConfig = headerConfig?.navigationRegion || {};
        const languageConfig = navigationConfig?.language || {};
        const accessibilityConfig = navigationConfig?.accessibility || {};
        const aboutConfig = navigationConfig?.about || {};
        const aboutButtonConfig = headerConfig?.aboutButton || {};
        const isMacPlatform = /mac/i.test(String(globalThis?.navigator?.platform || ''));
        const modifierLabelFallback = isMacPlatform ? '⌥' : 'Alt';

        const toBooleanAttr = (value) => {
            if (typeof value !== 'boolean') return null;
            return value ? 'true' : 'false';
        };

        return {
            visibility: {
                [HEADER_VISIBILITY_CONFIG_KEYS.showBreadcrumb]: toBooleanAttr(visibilityConfig?.showBreadcrumb),
                [HEADER_VISIBILITY_CONFIG_KEYS.showLanguageMenu]: toBooleanAttr(visibilityConfig?.showLanguageMenu),
                [HEADER_VISIBILITY_CONFIG_KEYS.showNavigationRegion]: toBooleanAttr(visibilityConfig?.showNavigationRegion),
                [HEADER_VISIBILITY_CONFIG_KEYS.showAbout]: toBooleanAttr(visibilityConfig?.showAbout)
            },
            attributes: {
                'language-tooltip': resolveDesignString(languageConfig?.tooltip) || t('popup_lang_title'),
                'language-kbd-label': resolveDesignString(languageConfig?.kbdLabel) || modifierLabelFallback,
                'language-kbd-key': resolveDesignString(languageConfig?.kbdKey) || 'L',
                'language-kbd-show-plus': toBooleanAttr(languageConfig?.kbdShowPlus) || 'true',
                'language-aria-label': resolveDesignString(languageConfig?.ariaLabel),
                'accessibility-tooltip': resolveDesignString(accessibilityConfig?.tooltip) || t('popup_a11y_title'),
                'accessibility-kbd-label': resolveDesignString(accessibilityConfig?.kbdLabel) || modifierLabelFallback,
                'accessibility-kbd-key': resolveDesignString(accessibilityConfig?.kbdKey) || 'A',
                'accessibility-kbd-show-plus': toBooleanAttr(accessibilityConfig?.kbdShowPlus) || 'true',
                'accessibility-aria-label': resolveDesignString(accessibilityConfig?.ariaLabel),
                'about-tooltip': resolveDesignString(aboutConfig?.tooltip) || t('about_title'),
                'about-kbd-label': resolveDesignString(aboutConfig?.kbdLabel) || modifierLabelFallback,
                'about-kbd-key': resolveDesignString(aboutConfig?.kbdKey) || 'I',
                'about-kbd-show-plus': toBooleanAttr(aboutConfig?.kbdShowPlus) || 'true',
                'about-aria-label': resolveDesignString(aboutConfig?.ariaLabel),
                'avatar-src': resolveDesignString(aboutButtonConfig?.imageSrc) || DEFAULT_NAVIGATION_AVATAR_SRC,
                'avatar-alt': resolveDesignString(aboutButtonConfig?.imageAlt),
                disabled: toBooleanAttr(navigationConfig?.disabled)
            }
        };
    }

    _applyHeaderContractToElement(element, { fallbackVisibility = {} } = {}) {
        if (!(element instanceof HTMLElement)) return;

        const contract = this._resolveHeaderContract();
        const visibilityKeys = Object.values(HEADER_VISIBILITY_CONFIG_KEYS);

        visibilityKeys.forEach((visibilityAttr) => {
            const contractValue = contract.visibility[visibilityAttr];
            const fallbackValue = fallbackVisibility[visibilityAttr];
            const valueToUse = resolveHeaderVisibilityAttributeValue(contractValue, fallbackValue);
            if (valueToUse === null || typeof valueToUse === 'undefined') return;
            if (element.getAttribute(visibilityAttr) !== valueToUse) {
                element.setAttribute(visibilityAttr, valueToUse);
            }
        });

        Object.entries(contract.attributes).forEach(([attrName, attrValue]) => {
            if (attrValue === null || typeof attrValue === 'undefined') {
                element.removeAttribute(attrName);
                return;
            }

            if (attrName.endsWith('-show-plus') || attrName === 'disabled') {
                if (attrValue === 'true') {
                    if (!element.hasAttribute(attrName)) {
                        element.setAttribute(attrName, '');
                    }
                } else {
                    if (element.hasAttribute(attrName)) {
                        element.removeAttribute(attrName);
                    }
                }
                return;
            }

            if (element.getAttribute(attrName) !== attrValue) {
                element.setAttribute(attrName, attrValue);
            }
        });
    }

    // Applies configured theme tokens onto document root CSS custom properties.
    applyThemeTokens() {
        // Reads token map from configuration with safe empty fallback.
        const tokens = portfoliableDesignConfig?.themeTokens || {};
        // Writes each token onto root element so all components can consume it.
        applyCssTokens(document.documentElement, tokens);

        // Applies component-level token overrides for Valence components.
        applyCssTokens(document.documentElement, portfoliableDesignConfig?.components || {});

        // Applies article-specific overrides without changing default DS behavior.
        applyCssTokens(document.documentElement, portfoliableDesignConfig?.article || {});

        this._captureBaseThemeTokenValues(tokens);
        this._applyA11yThemeTokenOverrides(this.state.a11y);
    }

    _captureBaseThemeTokenValues(tokens = {}) {
        const root = document.documentElement;
        const rootStyle = root.style;
        const computed = getComputedStyle(root);

        A11Y_THEME_TOKEN_KEYS.forEach((tokenName) => {
            if (Object.prototype.hasOwnProperty.call(tokens, tokenName)) {
                const configuredValue = tokens[tokenName];
                if (configuredValue != null && String(configuredValue).trim().length > 0) {
                    this._baseThemeTokenValues.set(tokenName, String(configuredValue).trim());
                    return;
                }
            }

            const inlineValue = rootStyle.getPropertyValue(tokenName).trim();
            if (inlineValue) {
                this._baseThemeTokenValues.set(tokenName, inlineValue);
                return;
            }

            const computedValue = computed.getPropertyValue(tokenName).trim();
            if (computedValue) {
                this._baseThemeTokenValues.set(tokenName, computedValue);
            }
        });
    }

    _applyA11yThemeTokenOverrides(settings = this.state.a11y) {
        const htmlEl = document.documentElement;
        const rootStyle = htmlEl.style;
        const forcedColorsActive = htmlEl.classList.contains('a11y-forced-colors');

        let mode = null;
        if (forcedColorsActive) {
            mode = 'forcedColors';
        } else if (settings?.highContrast) {
            mode = 'highContrast';
        } else if (settings?.darkMode) {
            mode = 'darkMode';
        }

        if (mode) {
            const overrides = A11Y_THEME_OVERRIDES[mode] || {};
            Object.entries(overrides).forEach(([tokenName, tokenValue]) => {
                rootStyle.setProperty(tokenName, tokenValue);
            });
            return;
        }

        A11Y_THEME_TOKEN_KEYS.forEach((tokenName) => {
            const baseValue = this._baseThemeTokenValues.get(tokenName);
            if (typeof baseValue === 'string' && baseValue.trim().length > 0) {
                rootStyle.setProperty(tokenName, baseValue);
            } else {
                rootStyle.removeProperty(tokenName);
            }
        });
    }

    // MARK: RENDER PIPELINE
    // Runs all top-level renderers and updates view activation classes.
    render() {
        this.renderHome();
        this.renderCaseView();
        this.renderPlayerView();
        this.renderAboutView();
        this.renderOverlays();
        this.updateHeader();
        this._syncNavigationLanguageMenus();
        this._syncLocalizedRouteUrl();
        this._syncHeadMetadata();

        // Toggles active class for currently selected route view.
        this.shadowRoot.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${this.state.currentView}`);
        });
        // Exposes active view on body for global styling hooks.
        document.body.setAttribute('data-active-view', this.state.currentView);

        if (this.state.currentView === 'home' && this._homeEntranceAnimationPending) {
            this._animateHomeEntrance();
        }

        if (this.state.currentView === 'player' && this._playerEntranceAnimationPending) {
            this._animatePlayerEntryCaseStyleReveal();
        }

        if (this.state.currentView === 'about' && this._aboutEntranceAnimationPending) {
            this._animateAboutEntryCaseStyleReveal();
        }

        requestAnimationFrame(() => {
            this._applyInlineCodeFormattingToTitles();
            this._applyPendingResumeScrollRestore();
        });
    }

    _formatInlineCodeHtmlFromText(text) {
        const source = String(text || '');
        if (!source.includes('`')) {
            return this._escapeHtmlAttr(source)
                .replace(/&quot;/g, '"');
        }

        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        let result = '';
        let cursor = 0;
        const regex = /`([^`]+)`/g;
        let match;

        while ((match = regex.exec(source)) !== null) {
            result += escapeHtml(source.slice(cursor, match.index));
            result += `<code>${escapeHtml(match[1])}</code>`;
            cursor = regex.lastIndex;
        }

        result += escapeHtml(source.slice(cursor));
        return result;
    }

    _collectAllOpenShadowRoots(root) {
        const roots = [];
        if (!root || typeof root.querySelectorAll !== 'function') return roots;

        const queue = [root];
        const visited = new Set();

        while (queue.length > 0) {
            const currentRoot = queue.shift();
            if (!currentRoot || visited.has(currentRoot)) continue;
            visited.add(currentRoot);
            roots.push(currentRoot);

            const elements = currentRoot.querySelectorAll('*');
            elements.forEach((element) => {
                if (element?.shadowRoot) {
                    queue.push(element.shadowRoot);
                }
            });
        }

        return roots;
    }

    _applyInlineCodeFormattingToTitles() {
        const ensureInlineCodeStyle = (root) => {
            if (!(root instanceof ShadowRoot || root instanceof DocumentFragment)) return;
            if (root.getElementById?.('app-inline-code-title-style')) return;

            const styleTag = document.createElement('style');
            styleTag.id = 'app-inline-code-title-style';
            styleTag.textContent = `
                code.inline-code-title {
                    font-family: var(--ds-article-inline-code-font-family, var(--font-mono, "SFMono-Regular", Consolas, monospace)) !important;
                    font-size: var(--ds-article-inline-code-size, 0.85em) !important;
                    padding: var(--ds-article-inline-code-padding, 0.2em 0.4em) !important;
                    border-radius: var(--ds-article-inline-code-radius, var(--radius-sm, 4px)) !important;
                    color: var(--ds-article-inline-code-color, #EB5757) !important;
                    background-color: var(--ds-article-inline-code-bg, rgba(135, 131, 120, 0.15)) !important;
                    display: inline !important;
                    white-space: normal !important;
                }
            `;
            root.appendChild(styleTag);
        };

        const titleSelectors = [
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            '[class*="title"]',
            '[class*="heading"]',
            '[data-title]',
            '.homeview-footer',
            '[data-i18n="footer_text"]',
            'ds-button.crumb-btn',
            'ds-button.crumb-home-btn'
        ];

        const roots = this._collectAllOpenShadowRoots(this.shadowRoot);
        roots.forEach((root) => {
            ensureInlineCodeStyle(root);
            const nodes = root.querySelectorAll(titleSelectors.join(','));
            nodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.closest('code, pre, kbd, script, style')) return;
                if (node.childElementCount > 0 && node.dataset.inlineCodeFormatted !== 'true') return;

                const hasInlineCodeChild = node.querySelector('code.inline-code-title') instanceof HTMLElement;
                const rawFromDataset = node.dataset.inlineCodeRawTitle || '';
                const rawFromText = node.textContent || '';

                let sourceText = '';
                if (hasInlineCodeChild && rawFromDataset) {
                    sourceText = rawFromDataset;
                } else {
                    sourceText = rawFromText;
                }

                if (!sourceText.includes('`')) {
                    delete node.dataset.inlineCodeRawTitle;
                    delete node.dataset.inlineCodeFormatted;
                    return;
                }

                node.dataset.inlineCodeRawTitle = sourceText;

                const nextHtml = this
                    ._formatInlineCodeHtmlFromText(sourceText)
                    .replace(/<code>/g, '<code class="inline-code-title">');
                if (node.innerHTML !== nextHtml) {
                    node.innerHTML = nextHtml;
                }
                node.dataset.inlineCodeFormatted = 'true';
            });
        });
    }

    // MARK: HOME VIEW
    // Renders and synchronizes HomeView component properties and gallery items.
    renderHome() {
        // Resolves HomeView custom element inside shadow DOM.
        const homeView = this.shadowRoot.getElementById('home-view');
        if (!homeView) return;

        this._setAttributes(homeView, {
            'data-mobile-breakpoint': this._isMobileBreakpoint() ? 'true' : null,
            dir: this.state.direction || 'ltr',
            'data-dir': this.state.direction || 'ltr'
        });

        // Reads runtime home-view configuration.
        const homeConfig = portfoliableDesignConfig?.homeView || {};
        const homeGalleryConfig = this._resolveHomeGalleryConfig();
        this._applyHomeTitleGalleryGapOverrides(homeView, homeGalleryConfig);
        const titleText = t('h1_title');
        const footerText = t('footer_text');
        const itemCount = Number(homeConfig.itemCount) || Math.min(4, this._portfolioCases.length);
        const engine = homeConfig.engine || 'minimal';

        if (homeView.titleText !== titleText) homeView.titleText = titleText;
        if (homeView.footerText !== footerText) homeView.footerText = footerText;
        if (homeView.itemCount !== itemCount) homeView.itemCount = itemCount;
        if (homeView.engine !== engine) homeView.engine = engine;

        if (typeof homeConfig.showBreadcrumb === 'boolean') {
            if (homeView.showBreadcrumb !== homeConfig.showBreadcrumb) {
                homeView.showBreadcrumb = homeConfig.showBreadcrumb;
            }
        }

        if (typeof homeConfig.showLanguageMenu === 'boolean') {
            if (homeView.showLanguageMenu !== homeConfig.showLanguageMenu) {
                homeView.showLanguageMenu = homeConfig.showLanguageMenu;
            }
        }

        const visibleCases = this._portfolioCases.filter((caseData) => {
            const visibility = this._resolveVisibilityFlags(caseData?.visibility);
            return visibility.web !== false;
        });
        this._homeVisibleCases = visibleCases;
        const galleryPillLabels = this._resolveHomeGalleryPillLabels();

        // Maps raw case data into gallery-card schema expected by ds-gallery.
        const mappedItems = visibleCases.map((caseData) => this._mapCaseToGalleryItem(caseData, galleryPillLabels));
        const homeRenderSignature = this._buildHomeRenderSignature({
            titleText,
            footerText,
            itemCount,
            engine,
            showBreadcrumb: homeConfig.showBreadcrumb,
            showLanguageMenu: homeConfig.showLanguageMenu,
            mappedItems
        });
        const shouldRebindGallery = homeRenderSignature !== this._homeRenderSignature;

        // Synchronizes nested ds-gallery props once the component shadow tree is ready.
        const syncGalleryItems = () => {
            // Resolves internal gallery element rendered by ds-home-view.
            const gallery = homeView.shadowRoot?.querySelector('ds-gallery');
            if (!gallery) return false;

            const resolvedDirection = this.state.direction || 'ltr';
            if (gallery.getAttribute('dir') !== resolvedDirection) {
                gallery.setAttribute('dir', resolvedDirection);
            }

            if (shouldRebindGallery) {
                gallery.itemCount = itemCount;
                gallery.engine = engine;
                gallery.items = mappedItems;
                this._homeRenderSignature = homeRenderSignature;
            }

            this._applyHomeGalleryContainerHeightOverride(homeView, gallery, homeGalleryConfig);

            const applyReducedGalleryHeights = () => this._applyHomeGalleryHeightOverride(gallery, homeGalleryConfig);
            requestAnimationFrame(applyReducedGalleryHeights);
            requestAnimationFrame(() => requestAnimationFrame(applyReducedGalleryHeights));

            const restoreGalleryOffset = () => this._restoreHomeGalleryOffset(gallery);
            requestAnimationFrame(restoreGalleryOffset);
            requestAnimationFrame(() => requestAnimationFrame(restoreGalleryOffset));
            return true;
        };

        // Retries once on next frame when child gallery is not yet mounted.
        if (!syncGalleryItems()) {
            requestAnimationFrame(() => {
                syncGalleryItems();
            });
        }
    }

    _resolveHomeGalleryConfig() {
        const homeGalleryConfig = portfoliableDesignConfig?.homeView?.gallery;
        if (!homeGalleryConfig || typeof homeGalleryConfig !== 'object') {
            return {
                containerHeight: null,
                mobileOnlyHeight: null,
                titleGalleryGapDesktop: null,
                titleGalleryGapMobile: null,
                categoryHeights: null,
                pillLabels: null
            };
        }

        const normalizeGalleryCssValue = (value) => {
            if (typeof value !== 'string') return null;
            const normalized = value.trim();
            if (!normalized) return null;

            const lowered = normalized.toLowerCase();
            if (lowered === 'null' || lowered === 'undefined') {
                return null;
            }

            return normalized;
        };

        const rawContainerHeight = homeGalleryConfig['--ds-gallery-height'];
        const containerHeight = normalizeGalleryCssValue(rawContainerHeight);

        const rawMobileOnlyHeight = homeGalleryConfig['--ds-gallery-mobile-height'];
        const mobileOnlyHeight = normalizeGalleryCssValue(rawMobileOnlyHeight);

        const rawTitleGalleryGapDesktop = homeGalleryConfig['--ds-home-title-gallery-gap-desktop'];
        const titleGalleryGapDesktop = normalizeGalleryCssValue(rawTitleGalleryGapDesktop);

        const rawTitleGalleryGapMobile = homeGalleryConfig['--ds-home-title-gallery-gap-mobile'];
        const titleGalleryGapMobile = normalizeGalleryCssValue(rawTitleGalleryGapMobile);

        const rawCategoryHeights = homeGalleryConfig.categoryHeights;
        const categoryHeights = rawCategoryHeights && typeof rawCategoryHeights === 'object'
            ? rawCategoryHeights
            : null;

        const rawPillLabels = homeGalleryConfig.pillLabels;
        const pillLabels = rawPillLabels && typeof rawPillLabels === 'object'
            ? rawPillLabels
            : null;

        return {
            containerHeight,
            mobileOnlyHeight,
            titleGalleryGapDesktop,
            titleGalleryGapMobile,
            categoryHeights,
            pillLabels
        };
    }

    _resolveHomeGalleryPillLabels() {
        const homeGalleryConfig = this._resolveHomeGalleryConfig();
        const configuredLabels = homeGalleryConfig?.pillLabels;

        const fromConfig = (key) => {
            const value = configuredLabels?.[key];
            return typeof value === 'string' && value.trim() ? value.trim() : '';
        };

        return {
            pitch: fromConfig('pitch') || t('gallery_pill_pitch'),
            repo: fromConfig('repo') || t('gallery_pill_repo'),
            demo: fromConfig('demo') || t('gallery_pill_demo')
        };
    }

    _applyHomeTitleGalleryGapOverrides(homeView, homeGalleryConfig = null) {
        if (!(homeView instanceof HTMLElement)) return;

        const resolvedConfig = homeGalleryConfig || this._resolveHomeGalleryConfig();

        if (resolvedConfig.titleGalleryGapDesktop) {
            homeView.style.setProperty('--ds-home-title-gallery-gap-desktop', resolvedConfig.titleGalleryGapDesktop);
        } else {
            homeView.style.removeProperty('--ds-home-title-gallery-gap-desktop');
        }

        if (resolvedConfig.titleGalleryGapMobile) {
            homeView.style.setProperty('--ds-home-title-gallery-gap-mobile', resolvedConfig.titleGalleryGapMobile);
        } else {
            homeView.style.removeProperty('--ds-home-title-gallery-gap-mobile');
        }
    }

    _resolveHomeGallerySizeDefaults(homeView) {
        if (!(homeView instanceof HTMLElement)) {
            return { desktopHeight: null, mobileHeight: null };
        }

        const computedStyle = getComputedStyle(homeView);
        return {
            desktopHeight: resolveDesignString(computedStyle.getPropertyValue('--ds-home-gallery-desktop-height')),
            mobileHeight: resolveDesignString(computedStyle.getPropertyValue('--ds-home-gallery-mobile-height'))
        };
    }

    _applyHomeGalleryContainerHeightOverride(homeView, gallery, homeGalleryConfig = null) {
        if (!(homeView instanceof HTMLElement) || !(gallery instanceof HTMLElement)) return;

        const resolvedConfig = homeGalleryConfig || this._resolveHomeGalleryConfig();
        const isMobileBreakpoint = this._isMobileBreakpoint();
        if (!isMobileBreakpoint && resolvedConfig.containerHeight) {
            homeView.style.setProperty('--ds-gallery-height', resolvedConfig.containerHeight);
            homeView.setAttribute('data-gallery-height-override', 'true');
            gallery.style.setProperty('--ds-gallery-height', resolvedConfig.containerHeight);
            return;
        }

        homeView.style.removeProperty('--ds-gallery-height');
        homeView.removeAttribute('data-gallery-height-override');
        gallery.style.removeProperty('--ds-gallery-height');
    }

    _getHomeGalleryElement() {
        const homeView = this.shadowRoot.getElementById('home-view');
        return homeView?.shadowRoot?.querySelector('ds-gallery') || null;
    }

    _captureHomeGalleryOffset() {
        const gallery = this._getHomeGalleryElement();
        if (!(gallery instanceof HTMLElement)) return;

        let resolvedOffset = Number.isFinite(gallery._offsetX) ? gallery._offsetX : null;
        if (!Number.isFinite(resolvedOffset)) {
            const transform = gallery.track?.style?.transform || '';
            const match = transform.match(/translate3d\(([-\d.]+)px/);
            resolvedOffset = match ? Number.parseFloat(match[1]) : null;
        }

        if (!Number.isFinite(resolvedOffset)) return;
        this._homeGalleryOffsetX = resolvedOffset;
        this._homeGalleryOffsetDirection = String(gallery.getAttribute('dir') || this.state.direction || 'ltr').trim().toLowerCase() === 'rtl'
            ? 'rtl'
            : 'ltr';
        this._hasSavedHomeGalleryOffset = true;
    }

    _restoreHomeGalleryOffset(gallery) {
        if (!this._homeGalleryRestorePending || !this._hasSavedHomeGalleryOffset) return;
        if (!(gallery instanceof HTMLElement)) return;

        const currentDirection = String(gallery.getAttribute('dir') || this.state.direction || 'ltr').trim().toLowerCase() === 'rtl'
            ? 'rtl'
            : 'ltr';
        if (currentDirection !== this._homeGalleryOffsetDirection) {
            this._homeGalleryRestorePending = false;
            this._homeGalleryRestoreRetryCount = 0;
            return;
        }

        const rawOffset = this._homeGalleryOffsetX;
        const viewportWidth = gallery.viewport?.clientWidth || gallery.clientWidth || 0;
        const trackWidth = gallery.track?.scrollWidth || 0;
        const requiresMeasuredWidth = Number.isFinite(rawOffset) && Math.abs(rawOffset) > 1;
        const hasScrollableWidth = trackWidth > viewportWidth + 1;
        const minOffset = typeof gallery._minOffset === 'function' ? gallery._minOffset() : null;
        const maxOffset = typeof gallery._maxOffset === 'function' ? gallery._maxOffset() : 0;
        const canRepresentSavedOffset = Number.isFinite(minOffset)
            ? rawOffset >= (minOffset - 1) && rawOffset <= (maxOffset + 1)
            : true;
        const shouldDeferForBounds = requiresMeasuredWidth && !canRepresentSavedOffset;

        if ((requiresMeasuredWidth && !hasScrollableWidth && this._homeGalleryRestoreRetryCount < 48)
            || (shouldDeferForBounds && this._homeGalleryRestoreRetryCount < 48)) {
            this._homeGalleryRestoreRetryCount += 1;
            requestAnimationFrame(() => this._restoreHomeGalleryOffset(gallery));
            return;
        }

        const clampedOffset = typeof gallery._clampOffset === 'function'
            ? gallery._clampOffset(rawOffset)
            : rawOffset;

        if (typeof gallery._applyTransform === 'function') {
            gallery._applyTransform(clampedOffset, false);
        } else if (gallery.track instanceof HTMLElement) {
            gallery.track.style.transition = 'none';
            gallery.track.style.transform = `translate3d(${clampedOffset}px, 0, 0)`;
        }

        if (Number.isFinite(clampedOffset)) {
            gallery._offsetX = clampedOffset;
        }

        this._homeGalleryRestorePending = false;
        this._homeGalleryRestoreRetryCount = 0;
    }

    _getHomeGalleryHeightForCategory(category, {
        compact = false,
        categoryHeights = null,
        mobileOnlyHeight = null,
        desktopDefaultHeight = null
    } = {}) {
        const normalized = String(category || '').trim().toLowerCase();
        const baseByCategory = {
            wearable: '26vh',
            mobile: '40vh',
            tablet: '45vh',
            desktop: '44vh',
            television: '30vh',
            tv: '30vh'
        };

        const configuredBaseHeight = categoryHeights && typeof categoryHeights === 'object'
            ? categoryHeights[normalized]
            : null;
        const normalizedConfiguredBaseHeight = typeof configuredBaseHeight === 'string'
            ? configuredBaseHeight.trim()
            : '';
        if (normalizedConfiguredBaseHeight && normalizedConfiguredBaseHeight.toLowerCase() !== 'null' && normalizedConfiguredBaseHeight.toLowerCase() !== 'undefined') {
            const explicitHeight = normalizedConfiguredBaseHeight;
            if (compact) {
                return `calc(${explicitHeight} * 0.84525)`;
            }
            return `calc(${explicitHeight} * 1.25)`;
        }

        const resolvedMobileOnlyHeight = resolveDesignString(mobileOnlyHeight);
        if (compact && resolvedMobileOnlyHeight && resolvedMobileOnlyHeight.toLowerCase() !== 'null' && resolvedMobileOnlyHeight.toLowerCase() !== 'undefined') {
            const mobileBaseHeight = 40;
            const mobileRatiosByCategory = {
                wearable: 26 / mobileBaseHeight,
                mobile: 1,
                tablet: 45 / mobileBaseHeight,
                desktop: 44 / mobileBaseHeight,
                television: 30 / mobileBaseHeight,
                tv: 30 / mobileBaseHeight
            };
            const categoryRatio = mobileRatiosByCategory[normalized] || 1;
            return `calc(${resolvedMobileOnlyHeight} * ${categoryRatio})`;
        }

        const resolvedDesktopDefaultHeight = resolveDesignString(desktopDefaultHeight);
        if (!compact && resolvedDesktopDefaultHeight && resolvedDesktopDefaultHeight.toLowerCase() !== 'null' && resolvedDesktopDefaultHeight.toLowerCase() !== 'undefined') {
            const desktopBaseHeight = 44;
            const desktopRatiosByCategory = {
                wearable: 26 / desktopBaseHeight,
                mobile: 40 / desktopBaseHeight,
                tablet: 45 / desktopBaseHeight,
                desktop: 1,
                television: 30 / desktopBaseHeight,
                tv: 30 / desktopBaseHeight
            };
            const categoryRatio = desktopRatiosByCategory[normalized] || (40 / desktopBaseHeight);
            return `calc(${resolvedDesktopDefaultHeight} * ${categoryRatio})`;
        }

        const baseHeight = baseByCategory[normalized] || '40vh';
        if (compact) {
            // Compact mobile layout keeps Home gallery lighter while preserving category proportions.
            return `calc(${baseHeight} * 0.84525)`;
        }

        // Desktop/tablet uses the canonical GalleryItem sizing profile.
        return `calc(${baseHeight} * 1.25)`;
    }

    _applyHomeGalleryHeightOverride(gallery, homeGalleryConfig = null) {
        if (!(gallery instanceof HTMLElement)) return;

        const isMobileBreakpoint = this._isMobileBreakpoint();
        const resolvedConfig = homeGalleryConfig || this._resolveHomeGalleryConfig();
        const categoryHeights = resolvedConfig.categoryHeights;
        const homeView = this.shadowRoot.getElementById('home-view');
        const sizeDefaults = this._resolveHomeGallerySizeDefaults(homeView);
        const mobileOnlyHeight = resolvedConfig.mobileOnlyHeight || sizeDefaults.mobileHeight;
        const desktopDefaultHeight = resolvedConfig.containerHeight || sizeDefaults.desktopHeight;

        const galleryItems = gallery.shadowRoot?.querySelectorAll('ds-gallery-item') || [];
        galleryItems.forEach((itemEl) => {
            if (!(itemEl instanceof HTMLElement)) return;

            const thumbCategory = itemEl.getAttribute('thumb-category') || 'mobile';
            const thumbWrapper = itemEl.shadowRoot?.querySelector('.case-thumb-wrapper');
            if (!(thumbWrapper instanceof HTMLElement)) return;

            thumbWrapper.style.setProperty(
                '--device-h-gallery',
                this._getHomeGalleryHeightForCategory(thumbCategory, {
                    compact: isMobileBreakpoint,
                    categoryHeights,
                    mobileOnlyHeight,
                    desktopDefaultHeight
                })
            );
        });
    }

    _buildHomeRenderSignature({
        titleText,
        footerText,
        itemCount,
        engine,
        showBreadcrumb,
        showLanguageMenu,
        mappedItems
    }) {
        const itemsSignature = mappedItems.map((item) => {
            return [
                item.caseId,
                item.title,
                item.shortDesc,
                item.readTime,
                item.thumbSrc,
                item.thumbCategory,
                item.thumbBrand,
                item.thumbModel,
                item.thumbColor,
                item.hasVideo ? 1 : 0,
                item.hasRepo ? 1 : 0,
                item.hasLive ? 1 : 0,
                item.pillVideoLabel,
                item.pillRepoLabel,
                item.pillLiveLabel,
                item.isProtected ? 1 : 0,
                item.isUnlocked ? 1 : 0,
                item.aspectRatio
            ].join('~');
        }).join('|');

        return [
            this.state.lang,
            titleText,
            footerText,
            itemCount,
            engine,
            typeof showBreadcrumb === 'boolean' ? (showBreadcrumb ? 1 : 0) : 'na',
            typeof showLanguageMenu === 'boolean' ? (showLanguageMenu ? 1 : 0) : 'na',
            itemsSignature
        ].join('::');
    }

    // MARK: HOME VIEW ANIMATIONS
    // Manages home entrance animation lifecycle, cancellation, and replay safety.
    _cancelHomeEntranceAnimations() {
        this._homeEntranceAnimations.forEach((animation) => {
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel();
            }
        });
        this._homeEntranceAnimations = [];
        this._homeEntranceAnimationInProgress = false;
        this._homeEntranceAnimationEndAt = 0;
        if (this._homeEntranceCompletionTimer) {
            clearTimeout(this._homeEntranceCompletionTimer);
            this._homeEntranceCompletionTimer = null;
        }
    }

    _animateHomeEntrance(attempt = 0, runId = null) {
        if (this.state.currentView !== 'home') return;
        if (!this._homeEntranceAnimationPending) return;

        if (this._shouldReduceMotion()) {
            this._homeEntranceAnimationPending = false;
            this._homeEntranceAnimationHasPlayed = true;
            this._homeEntranceAnimationInProgress = false;
            this._homeEntranceAnimationEndAt = 0;
            return;
        }

        const resolvedRunId = runId ?? (this._homeEntranceAnimationRunId += 1);
        const homeView = this.shadowRoot.getElementById('home-view');
        if (!(homeView instanceof HTMLElement)) {
            return;
        }

        const homeRoot = homeView.shadowRoot;
        const gallery = homeRoot?.querySelector('ds-gallery') || null;
        const galleryItems = gallery?.shadowRoot?.querySelectorAll('ds-gallery-item') || [];
        const hasReadyTargets = Boolean(homeRoot) && (galleryItems.length > 0 || gallery instanceof HTMLElement);

        if (!hasReadyTargets && attempt < 18) {
            requestAnimationFrame(() => {
                this._animateHomeEntrance(attempt + 1, resolvedRunId);
            });
            return;
        }

        if (resolvedRunId !== this._homeEntranceAnimationRunId) return;

        const mode = this._homeEntranceAnimationMode === 'subtle' ? 'subtle' : 'full';
        const profile = mode === 'subtle'
            ? {
                shellTranslateY: 10,
                shellScale: 0.998,
                shellBlur: 1.5,
                shellDuration: 360,
                helperTranslateY: 8,
                helperDuration: 320,
                helperBaseDelay: 30,
                helperStepDelay: 32,
                itemTranslateY: 10,
                itemScale: 0.992,
                itemDuration: 300,
                itemBaseDelay: 56,
                itemStepDelay: 18,
                maxItems: 10
            }
            : {
                shellTranslateY: 24,
                shellScale: 0.992,
                shellBlur: 6,
                shellDuration: 620,
                helperTranslateY: 18,
                helperDuration: 520,
                helperBaseDelay: 80,
                helperStepDelay: 70,
                itemTranslateY: 26,
                itemScale: 0.97,
                itemDuration: 480,
                itemBaseDelay: 140,
                itemStepDelay: 42,
                maxItems: 12
            };

        this._homeEntranceAnimationPending = false;
        this._homeEntranceAnimationMode = 'subtle';
        this._homeEntranceAnimationHasPlayed = true;
        this._cancelHomeEntranceAnimations();
        this._homeEntranceAnimationInProgress = true;

        const introAnimations = [];
        const pushAnimation = (animation) => {
            if (!animation) return;
            introAnimations.push(animation);
            animation.addEventListener('finish', () => {
                // Releases filled keyframe styles (notably transform) so component-level
                // interaction states like ds-gallery drag scale remain visible.
                animation.cancel();
                const idx = this._homeEntranceAnimations.indexOf(animation);
                if (idx >= 0) this._homeEntranceAnimations.splice(idx, 1);
            }, { once: true });
        };

        const homeShell = homeRoot?.querySelector('.homeview-shell') || homeView;
        const shellAnimation = homeShell.animate(
            [
                { opacity: 0, transform: `translateY(${profile.shellTranslateY}px) scale(${profile.shellScale})` },
                { opacity: 1, transform: 'translateY(0) scale(1)' }
            ],
            {
                duration: profile.shellDuration,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'both'
            }
        );
        pushAnimation(shellAnimation);

        const heading = homeRoot?.querySelector('h1, [data-i18n="h1_title"], .home-title, .title');
        const footer = homeRoot?.querySelector('footer, .footer, [data-i18n="footer_text"]');
        const helperTargets = [heading, gallery, footer].filter((el) => el instanceof HTMLElement);

        helperTargets.forEach((element, index) => {
            const animation = element.animate(
                [
                    { opacity: 0, transform: `translateY(${profile.helperTranslateY}px)` },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                {
                    duration: profile.helperDuration,
                    delay: profile.helperBaseDelay + (index * profile.helperStepDelay),
                    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                    fill: 'both'
                }
            );
            pushAnimation(animation);
        });

        [...galleryItems].slice(0, profile.maxItems).forEach((itemEl, index) => {
            const animation = itemEl.animate(
                [
                    { opacity: 0, transform: `translateY(${profile.itemTranslateY}px) scale(${profile.itemScale})` },
                    { opacity: 1, transform: 'translateY(0) scale(1)' }
                ],
                {
                    duration: profile.itemDuration,
                    delay: profile.itemBaseDelay + (index * profile.itemStepDelay),
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'both'
                }
            );
            pushAnimation(animation);
        });

        const helperCount = helperTargets.length;
        const itemCount = Math.min(galleryItems.length, profile.maxItems);
        const maxHelperEndMs = helperCount > 0
            ? profile.helperBaseDelay + ((helperCount - 1) * profile.helperStepDelay) + profile.helperDuration
            : 0;
        const maxItemEndMs = itemCount > 0
            ? profile.itemBaseDelay + ((itemCount - 1) * profile.itemStepDelay) + profile.itemDuration
            : 0;
        const maxEndMs = Math.max(profile.shellDuration, maxHelperEndMs, maxItemEndMs);
        this._homeEntranceAnimationEndAt = Date.now() + maxEndMs;

        if (this._homeEntranceCompletionTimer) {
            clearTimeout(this._homeEntranceCompletionTimer);
        }
        this._homeEntranceCompletionTimer = setTimeout(() => {
            this._homeEntranceAnimationInProgress = false;
            this._homeEntranceAnimationEndAt = 0;
            this._homeEntranceCompletionTimer = null;
        }, maxEndMs + 24);

        this._homeEntranceAnimations = introAnimations;
    }

    _animatePlayerEntryCaseStyleReveal() {
        if (this.state.currentView !== 'player') return;
        if (!this._playerEntranceAnimationPending) return;

        this._logPlayerEntryDebug('Animation resolver started', {
            activeCaseId: this.state.activeCaseId,
            reduceMotion: this._shouldReduceMotion()
        });

        if (this._shouldReduceMotion()) {
            this._playerEntranceAnimationPending = false;
            this._logPlayerEntryDebug('Animation skipped because reduce motion is enabled');
            return;
        }

        const resolveAndAnimate = (attempt = 0) => {
            const playerViewHost = this.shadowRoot.getElementById('player-view-host');
            const playerView = playerViewHost?.querySelector('ds-player-view') || null;
            const playerRoot = playerView?.shadowRoot || null;
            const topSeekWrap = playerRoot?.querySelector('.top-seek-wrap') || null;
            const thumbnailShell = playerRoot?.querySelector('.thumbnail-shell') || null;
            const controlsShell = playerRoot?.querySelector('.controls-shell') || null;
            const thumbnailEl = playerRoot?.querySelector('.thumbnail-shell ds-thumbnail') || playerRoot?.querySelector('ds-thumbnail');
            const videoSurface = thumbnailEl?.shadowRoot?.querySelector('.screen-cover-video, video') || null;

            const targets = [topSeekWrap, thumbnailShell, controlsShell, videoSurface]
                .filter((target) => target instanceof HTMLElement);

            this._logPlayerEntryDebug('Attempt target resolution', {
                attempt,
                hasPlayerHost: playerViewHost instanceof HTMLElement,
                hasPlayerView: playerView instanceof HTMLElement,
                hasPlayerRoot: Boolean(playerRoot),
                hasTopSeekWrap: topSeekWrap instanceof HTMLElement,
                hasThumbnailShell: thumbnailShell instanceof HTMLElement,
                hasControlsShell: controlsShell instanceof HTMLElement,
                hasVideoSurface: videoSurface instanceof HTMLElement,
                targetCount: targets.length
            });

            if (targets.length === 0 && attempt < 24) {
                requestAnimationFrame(() => resolveAndAnimate(attempt + 1));
                return;
            }

            if (targets.length === 0) {
                this._logPlayerEntryDebug('No targets found after final retry; no animation dispatched', {
                    attemptsTried: attempt + 1
                });
            }

            targets.forEach((target) => {
                this._logPlayerEntryDebug('Dispatching reveal animation to target', {
                    tagName: target.tagName,
                    className: target.className || ''
                });
                this._runCaseStyleEntryReveal(target);
            });

            this._playerEntranceAnimationPending = false;
            this._logPlayerEntryDebug('Animation resolver completed', {
                attemptsTried: attempt + 1,
                animatedTargets: targets.length
            });
        };

        resolveAndAnimate();
    }

    // MARK: HOME VIEW DATA MAPPING
    // Converts a parsed case object into the compact gallery-item contract.
    _mapCaseToGalleryItem(caseData, galleryPillLabels = null) {
        const labels = galleryPillLabels || this._resolveHomeGalleryPillLabels();
        return {
            caseId: caseData.id,
            title: this.getLang(caseData.title),
            shortDesc: this.getLang(caseData.shortDesc),
            readTime: this.getLang(caseData.readTime),
            thumbSrc: this.getLang(caseData.thumbSrc),
            hasVideo: this._hasLocalizedValue(this._resolveCasePrimaryVideoProp(caseData)),
            hasRepo: this._hasLocalizedValue(this._resolveCaseSecondaryUrlProp(caseData)),
            hasLive: this._hasLocalizedValue(this._resolveCaseTertiaryUrlProp(caseData)),
            pillVideoLabel: labels.pitch,
            pillRepoLabel: labels.repo,
            pillLiveLabel: labels.demo,
            thumbCategory: caseData.thumbCategory || 'mobile',
            thumbBrand: caseData.thumbBrand || 'apple',
            thumbModel: caseData.thumbModel || 'Apple iPhone 12',
            thumbColor: caseData.thumbColor || 'Black',
            aspectRatio: caseData.aspectRatio || '',
            isProtected: Boolean(caseData.isProtected),
            isUnlocked: !this._isCaseLocked(caseData)
        };
    }

    // MARK: CASE VIEW
    // Renders active case article panel or empty-state placeholder.
    renderCaseView() {
        // Resolves case-view template mount within case route.
        const caseView = this.shadowRoot.getElementById('case-view');
        if (!caseView) return;

        this._setAttributes(caseView, {
            dir: this.state.direction || 'ltr',
            'data-dir': this.state.direction || 'ltr',
            'data-mobile-breakpoint': this._isMobileBreakpoint() ? 'true' : null
        });

        if (this.state.currentView !== 'case') {
            this._clearCaseSearchHighlight();
            this._teardownCaseAudioPlayerRuntime();
            caseView._destroySmoothArticleScrolling?.();
            this._caseViewRenderSignature = '';
            this._caseViewLastSyncedCaseId = null;
            return;
        }

        // Finds the currently selected case by active case ID.
        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
        const homeLabel = t('nav_home');
        const hasVideo = this._hasLocalizedValue(this._resolveCasePrimaryVideoProp(activeCase));
        const hasRepo = this._hasLocalizedValue(this._resolveCaseSecondaryUrlProp(activeCase));
        const hasDemo = this._hasLocalizedValue(this._resolveCaseTertiaryUrlProp(activeCase));

        this._applyHeaderContractToElement(caseView, {
            fallbackVisibility: {
                'show-breadcrumb': 'true',
                'show-language-menu': 'true',
                'show-navigation-region': 'true',
                'show-about': 'true'
            }
        });

        if (!activeCase) {
            this._clearCaseSearchHighlight();
            this._teardownCaseAudioPlayerRuntime();
            this._caseEntryAnimationPending = false;
            this._caseViewLastSyncedCaseId = null;
            caseView.breadcrumbItems = [
                { id: 'home', label: homeLabel, hasMenu: false },
                { id: 'case', label: t('search_case_studies_label'), hasMenu: false }
            ];
            this._setAttributes(caseView, {
                'title-text': t('search_case_studies_label'),
                'subtitle-text': '',
                kicker: '',
                'show-cover': 'false',
                'show-action-primary': 'false',
                'show-action-secondary1': 'false',
                'show-action-secondary2': 'false',
                'show-summary': 'false',
                'show-player': 'false',
                'show-toc': 'false',
                'show-navigator': 'false'
            });
            const emptyMarkup = `<p class="article-empty">${t('search_case_studies_label')}</p>`;
            const emptySignature = `empty::${this.state.lang}::${emptyMarkup}`;
            if (this._caseViewRenderSignature !== emptySignature) {
                caseView.innerHTML = emptyMarkup;
                this._caseViewRenderSignature = emptySignature;
            }
            return;
        }

        if (this._isCaseLocked(activeCase)) {
            this._clearCaseSearchHighlight();
            this._teardownCaseAudioPlayerRuntime();
            this._caseEntryAnimationPending = false;
            this._caseViewLastSyncedCaseId = null;
            caseView.breadcrumbItems = [
                { id: 'home', label: homeLabel, hasMenu: false },
                { id: 'case', label: t('protected_case'), hasMenu: false }
            ];
            this._setAttributes(caseView, {
                'title-text': t('protected_case'),
                'subtitle-text': t('enter_passcode'),
                kicker: '',
                'show-cover': 'false',
                'show-action-primary': 'false',
                'show-action-secondary1': 'false',
                'show-action-secondary2': 'false',
                'show-summary': 'false',
                'show-player': 'false',
                'show-toc': 'false',
                'show-navigator': 'false'
            });
            const lockedMarkup = `
                <div class="locked-case-empty">
                    <p class="article-empty">${t('protected_case')}</p>
                    <ds-button id="unlock-case-btn" variant="primary" aria-label="${this._escapeHtmlAttr(t('unlock'))}">${t('unlock')}</ds-button>
                </div>
            `;
            const lockedSignature = `locked::${activeCase.id}::${this.state.lang}::${lockedMarkup}`;
            if (this._caseViewRenderSignature !== lockedSignature) {
                caseView.innerHTML = lockedMarkup;
                this._caseViewRenderSignature = lockedSignature;

                const unlockButton = caseView.querySelector('#unlock-case-btn');
                if (unlockButton instanceof HTMLElement) {
                    unlockButton.addEventListener('click', () => {
                        this._promptUnlockCase(activeCase);
                    });
                }
            }
            return;
        }

        // Computes localized case header and body values for article rendering.
        const title = this.getLang(activeCase.title);
        const subtitle = this.getLang(activeCase.shortDesc);
        // Resolves localized case year string.
        const kicker = this.getLang(this._resolveCaseKickerProp(activeCase));
        // Resolves localized body HTML based on active mode.
        const body = this.getLang(this.state.isRecruiterMode ? activeCase.descRecruiter : activeCase.desc);
        // Resolves localized summary HTML section when present.
        const summary = this.getLang(activeCase.summary);
        // Resolves localized audio source used by reader/player section when available.
        const audioSrc = this._resolveRuntimeMediaUrl(this.getLang(activeCase.audioSrc));
        const caseSocial = activeCase.social && typeof activeCase.social === 'object' ? activeCase.social : {};
        const socialControls = this._resolveSocialControlsMap(caseSocial, { shareEnabledByDefault: true });
        const caseActions = activeCase.actions && typeof activeCase.actions === 'object' ? activeCase.actions : {};
        const caseCustomButtons = Array.isArray(activeCase.customButtons) ? activeCase.customButtons : [];

        const resolveCaseActionLabel = (actionConfig, fallbackLabel) => {
            const rawLabel = this.getLang(actionConfig?.label);
            if (typeof rawLabel === 'string' && rawLabel.trim().length > 0) {
                return rawLabel.trim();
            }
            return fallbackLabel;
        };

        const normalizeCaseAction = (actionConfig, fallbackLabel, fallbackVariant) => ({
            enabled: actionConfig?.enabled !== false,
            label: resolveCaseActionLabel(actionConfig, fallbackLabel),
            variant: String(actionConfig?.variant || fallbackVariant || '').trim() || fallbackVariant,
            url: String(this.getLang(actionConfig?.url) || '').trim(),
            videoSrc: actionConfig?.videoSrc ?? actionConfig?.['video-src'],
            vttSrc: actionConfig?.vttSrc ?? actionConfig?.['vtt-src'],
            tooltip: String(this.getLang(actionConfig?.tooltip) || '').trim(),
            ariaLabel: String(this.getLang(actionConfig?.ariaLabel ?? actionConfig?.['aria-label']) || '').trim(),
            hasText: actionConfig?.hasText ?? actionConfig?.['has-text'],
            hasIcon: actionConfig?.hasIcon ?? actionConfig?.['has-icon'],
            icon: actionConfig?.icon,
            iconVariant: actionConfig?.iconVariant ?? actionConfig?.['icon-variant'],
            iconPosition: actionConfig?.iconPosition ?? actionConfig?.['icon-position'],
            hasImage: actionConfig?.hasImage ?? actionConfig?.['has-image'],
            imageSrc: String(this.getLang(actionConfig?.imageSrc ?? actionConfig?.['image-src']) || '').trim(),
            imageAlt: String(this.getLang(actionConfig?.imageAlt ?? actionConfig?.['image-alt']) || '').trim(),
            imagePosition: actionConfig?.imagePosition ?? actionConfig?.['image-position']
        });

        const resolveCaseActionConfig = (key, legacyKey = '') => {
            const candidate = caseActions?.[key] ?? caseActions?.[legacyKey] ?? {};
            return candidate && typeof candidate === 'object' ? candidate : {};
        };

        const primaryAction = normalizeCaseAction(resolveCaseActionConfig('primary'), '', 'primary');
        const secondaryAction = normalizeCaseAction(resolveCaseActionConfig('secondary', 'secondary1'), '', 'secondary');
        const tertiaryAction = normalizeCaseAction(resolveCaseActionConfig('tertiary', 'secondary2'), '', 'tertiary');

        const hasPrimaryUrl = primaryAction.url.length > 0;
        const hasSecondaryUrl = secondaryAction.url.length > 0;
        const hasTertiaryUrl = tertiaryAction.url.length > 0;

        // Chooses CTA labels from case config with i18n fallbacks.
        const primaryLabel = primaryAction.label || '';
        const secondary1Label = secondaryAction.label || '';
        const secondary2Label = tertiaryAction.label || '';
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
        const {
            breadcrumbMenuLabels,
            breadcrumbMenuIconConfig,
            caseMenuItems,
            videoMenuItems
        } = this._buildBreadcrumbMenuContext(activeCase.id, 'caseReader');
        const normalizedThumbCategory = String(thumbCategory || '').trim().toLowerCase();
        const largeDeviceSignal = `${normalizedThumbCategory} ${String(thumbModel || '').trim().toLowerCase()}`;
        const isLargeReaderDevice = /(desktop|laptop|tablet|tv|television|monitor|imac|macbook|ipad)/.test(largeDeviceSignal);
        const readerThumbnailCoverMaxHeight = isLargeReaderDevice
            ? 'min(52vh, 400px)'
            : 'min(52vh, 380px)';
        const readerThumbnailCoverMaxHeightMobile = isLargeReaderDevice
            ? 'min(36vh, 280px)'
            : 'min(34vh, 260px)';
        const readerThumbnailCoverMaxWidth = isLargeReaderDevice
            ? '640px'
            : '100%';
        const readerThumbnailStyleAttr = `style="--ds-article-cover-max-height: ${readerThumbnailCoverMaxHeight}; --ds-article-cover-max-height-mobile: ${readerThumbnailCoverMaxHeightMobile}; --ds-article-cover-max-height-cap: 400px; --ds-article-cover-max-height-cap-mobile: 280px; --ds-article-cover-max-width: ${readerThumbnailCoverMaxWidth}; justify-content: center; margin: 0 auto; transform: none;"`;
        // Resolves display toggles derived from markdown rules.
        const display = activeCase.display || {};
        const showReader = display.showReader !== false;
        const showSummary = Boolean(display.showSummary);
        const showCover = display.showCover !== false;
        const showPlayer = (display.showPlayer !== false) && Boolean(audioSrc);
        if (showPlayer) {
            console.log('[case-reader][audio] resolved source', {
                caseId: activeCase.id,
                lang: this.state.currentLang,
                audioSrcRaw: this.getLang(activeCase.audioSrc),
                audioSrcResolved: audioSrc,
                locationHref: typeof window !== 'undefined' ? window.location.href : ''
            });
        } else {
            console.warn('[case-reader][audio] player hidden (no source or disabled)', {
                caseId: activeCase.id,
                lang: this.state.currentLang,
                audioSrcRaw: this.getLang(activeCase.audioSrc),
                audioSrcResolved: audioSrc,
                showPlayerConfig: display.showPlayer
            });
        }
        const showToc = Boolean(display.showToc);
        const showNavigator = display.showNavigator !== false;
        const activeCaseIndex = this._portfolioCases.findIndex((item) => item.id === activeCase.id);
        const summaryMarkup = this._buildSummaryMarkup(activeCase, summary, showSummary);
        const navigatorLabels = this._buildCaseNavigatorLabels(activeCaseIndex);
        const openSearchShortcut = getShortcutTooltipParts('case-search-open');
        const closeSearchShortcut = getShortcutTooltipParts('case-search-close');

        const audioPlayerReaderLabel = String(
            this.getLangCurrentLocaleOnly(activeCase?.audioLabel)
            || t('player_audio_reader')
            || ''
        ).trim();
        const audioPlayerTitle = audioPlayerReaderLabel;
        const playerMarkup = showPlayer
            ? `<ds-audio-player slot="player" data-mobile-breakpoint="${this._isMobileBreakpoint() ? 'true' : 'false'}" debug-audio="true" title="${this._escapeHtmlAttr(audioPlayerTitle)}" label-reader="${this._escapeHtmlAttr(audioPlayerReaderLabel)}" label-play="${this._escapeHtmlAttr(t('player_audio_play'))}" label-pause="${this._escapeHtmlAttr(t('player_audio_pause'))}" label-mute="${this._escapeHtmlAttr(t('player_audio_mute'))}" label-unmute="${this._escapeHtmlAttr(t('player_audio_unmute'))}" label-speed="${this._escapeHtmlAttr(t('player_audio_speed'))}" label-hide="${this._escapeHtmlAttr(t('player_audio_hide'))}" label-show="${this._escapeHtmlAttr(t('player_audio_show'))}" label-autoscroll-on="${this._escapeHtmlAttr(t('player_audio_autoscroll_on'))}" label-autoscroll-off="${this._escapeHtmlAttr(t('player_audio_autoscroll_off'))}" label-volume="${this._escapeHtmlAttr(t('player_audio_volume'))}" label-volume-level="${this._escapeHtmlAttr(t('player_audio_volume_level'))}" label-audio-pos="${this._escapeHtmlAttr(t('player_audio_position'))}" playing="false" time="0" duration="184" speed="1X" hide-on-scroll="true" auto-scroll="false" volume="100" muted="false" audio-src="${this._escapeHtmlAttr(audioSrc || '')}"></ds-audio-player>`
            : '';

        const navigatorMarkup = showNavigator
            ? `<ds-case-navigator slot="navigator" data-mobile-breakpoint="${this._isMobileBreakpoint() ? 'true' : 'false'}" current-index="${Math.max(0, activeCaseIndex)}" total-cases="${this._portfolioCases.length}" label-prev="${this._escapeHtmlAttr(navigatorLabels.labelPrev)}" label-next="${this._escapeHtmlAttr(navigatorLabels.labelNext)}" tooltip-prev="${this._escapeHtmlAttr(navigatorLabels.tooltipPrev)}" tooltip-next="${this._escapeHtmlAttr(navigatorLabels.tooltipNext)}" tooltip-search="${this._escapeHtmlAttr(t('search_cases_tooltip_open'))}" tooltip-close-search="${this._escapeHtmlAttr(t('search_cases_tooltip_close'))}" kbd-search-label="${this._escapeHtmlAttr(openSearchShortcut.kbdLabel)}" kbd-search-key="${this._escapeHtmlAttr(openSearchShortcut.kbdKey)}" ${openSearchShortcut.showPlus ? 'kbd-search-show-plus' : ''} kbd-close-search-label="${this._escapeHtmlAttr(closeSearchShortcut.kbdLabel)}" kbd-close-search-key="${this._escapeHtmlAttr(closeSearchShortcut.kbdKey)}" ${closeSearchShortcut.showPlus ? 'kbd-close-search-show-plus' : ''} placeholder="${this._escapeHtmlAttr(t('search_cases_placeholder'))}"></ds-case-navigator>`
            : '';

                caseView.breadcrumbItems = [
                    { id: 'home', label: homeLabel, hasMenu: false },
                    {
                        id: 'case',
                        label: title,
                        hasMenu: caseMenuItems.length > 0,
                        menuItems: caseMenuItems,
                        menuHeader: breadcrumbMenuLabels.caseHeader,
                        menuItemIcon: breadcrumbMenuIconConfig.caseStudies.itemIcon,
                        menuItemIconVariant: breadcrumbMenuIconConfig.caseStudies.itemIconVariant,
                        menuItemShowIcon: breadcrumbMenuIconConfig.caseStudies.showItemIcon
                    }
                ];

                this._setAttributes(caseView, {
                    'aria-label': title,
                    kicker: kicker || '',
                    'title-text': title,
                    'subtitle-text': this._resolveSubtitleVisibility(activeCase, true) ? (subtitle || '') : '',
                    'primary-label': primaryLabel,
                    'secondary1-label': secondary1Label,
                    'secondary2-label': secondary2Label,
                    'show-title': this._resolveTitleVisibility(activeCase, true) ? 'true' : 'false',
                    'show-action-primary': (primaryAction.enabled && primaryLabel && (hasPrimaryUrl || hasVideo || hasDemo)) ? 'true' : 'false',
                    'show-action-secondary1': (secondaryAction.enabled && secondary1Label && (hasSecondaryUrl || hasRepo)) ? 'true' : 'false',
                    'show-action-secondary2': (tertiaryAction.enabled && secondary2Label && (hasTertiaryUrl || hasDemo)) ? 'true' : 'false',
                    'show-cover': showCover ? 'true' : 'false',
                    'show-player': showPlayer ? 'true' : 'false',
                    'show-summary': showSummary ? 'true' : 'false',
                    'show-social-share': socialControls.share?.enabled ? 'true' : 'false',
                    'show-social-linkedin': socialControls.linkedin?.enabled ? 'true' : 'false',
                    'show-social-x': socialControls.x?.enabled ? 'true' : 'false',
                    'show-social-facebook': socialControls.facebook?.enabled ? 'true' : 'false',
                    'show-toc': showToc ? 'true' : 'false',
                    'show-navigator': showNavigator ? 'true' : 'false'
                });

                const caseMarkup = `
                    ${showCover
                        ? `<ds-thumbnail
                        slot="cover"
                        data-mobile-breakpoint="${this._isMobileBreakpoint() ? 'true' : 'false'}"
                        category="${thumbCategory}"
                        brand="${thumbBrand}"
                        model="${thumbModel}"
                        color="${thumbColor}"
                        screen-image="${thumbSrc || ''}"
                        ${readerThumbnailStyleAttr}
                    ></ds-thumbnail>`
                        : ''}
                    ${summaryMarkup}
                    ${playerMarkup}
                    ${showReader ? (body || '') : ''}
                    ${navigatorMarkup}
                `;

                const caseRenderSignature = [
                    'case',
                    activeCase.id,
                    this.state.lang,
                    this.state.isRecruiterMode ? '1' : '0',
                    this._isMobileBreakpoint() ? '1' : '0',
                    title,
                    subtitle,
                    kicker,
                    primaryLabel,
                    secondary1Label,
                    secondary2Label,
                    showCover ? '1' : '0',
                    showPlayer ? '1' : '0',
                    showSummary ? '1' : '0',
                    showToc ? '1' : '0',
                    showNavigator ? '1' : '0',
                    caseMarkup
                ].join('::');

                if (this._caseViewRenderSignature !== caseRenderSignature) {
                    caseView.innerHTML = caseMarkup;
                    this._caseViewRenderSignature = caseRenderSignature;
                }

                this._syncMermaidErrorLabels(caseView);

                this._bindCaseAudioPlayerRuntime(caseView);
                this._syncCaseViewControls(activeCaseIndex);
                this._syncCaseArticleRuntimeControls(caseView, {
                    customButtons: caseCustomButtons,
                    primaryAction,
                    secondaryAction,
                    tertiaryAction,
                    socialControls
                });
                this._applyCasePrimaryActionTooltipKeyLabel(caseView);

                this._animateCaseArticleTextReveal(activeCase.id);
    }

    _teardownCaseAudioPlayerRuntime(reason = 'runtime-reset') {
        const runtime = this._caseAudioRuntime;
        const player = runtime.player;

        this._logResumeToast('Case audio runtime teardown', {
            reason,
            hasPlayer: player instanceof HTMLElement,
            pinned: runtime.pinned,
            playing: runtime.playing,
            hideOnScroll: runtime.hideOnScroll,
            currentView: this.state.currentView,
            activeCaseId: this.state.activeCaseId
        });

        if (player instanceof HTMLElement) {
            this._persistActiveCaseAudioPosition(runtime.caseId || this.state.activeCaseId, { persist: true });
            player.setAttribute('playing', 'false');
            if (player.audioEl && typeof player.audioEl.pause === 'function') {
                player.audioEl.pause();
            }
        }

        if (runtime.observer) {
            runtime.observer.disconnect();
        }

        if (runtime.scrollRoot instanceof HTMLElement && typeof runtime.scrollHandler === 'function') {
            runtime.scrollRoot.removeEventListener('scroll', runtime.scrollHandler);
        }

        if (typeof runtime.resizeHandler === 'function') {
            window.removeEventListener('resize', runtime.resizeHandler);
        }

        if (player instanceof HTMLElement) {
            if (runtime.sentinel instanceof HTMLElement && player.parentElement !== runtime.sentinel.parentElement) {
                runtime.sentinel.after(player);
            }

            if (typeof runtime.onPlayToggle === 'function') {
                player.removeEventListener('ds-audio-play-toggle', runtime.onPlayToggle);
            }
            if (typeof runtime.onHideToggle === 'function') {
                player.removeEventListener('ds-audio-hide-toggle', runtime.onHideToggle);
            }
            if (typeof runtime.onAutoToggle === 'function') {
                player.removeEventListener('ds-audio-autoscroll-toggle', runtime.onAutoToggle);
            }
            if (typeof runtime.onTimeUpdate === 'function') {
                player.removeEventListener('ds-audio-timeupdate', runtime.onTimeUpdate);
            }
            if (typeof runtime.onEnded === 'function') {
                player.removeEventListener('ds-audio-ended', runtime.onEnded);
            }
            if (typeof runtime.onError === 'function') {
                player.removeEventListener('ds-audio-error', runtime.onError);
            }
            player.removeAttribute('variant');
            player.style.removeProperty('position');
            player.style.removeProperty('top');
            player.style.removeProperty('left');
            player.style.removeProperty('transform');
            player.style.removeProperty('z-index');
            player.style.removeProperty('width');
            player.style.removeProperty('max-width');
            player.style.removeProperty('margin');
        }

        if (runtime.sentinel instanceof HTMLElement) {
            runtime.sentinel.remove();
        }

        this._caseAudioRuntime = {
            caseId: null,
            player: null,
            sentinel: null,
            observer: null,
            scrollRoot: null,
            scrollHandler: null,
            resizeHandler: null,
            onPlayToggle: null,
            onHideToggle: null,
            onAutoToggle: null,
            onTimeUpdate: null,
            onEnded: null,
            onError: null,
            playing: false,
            hideOnScroll: false,
            autoScroll: false,
            pinned: false,
            anchorTime: 0,
            anchorScrollTop: 0
        };
    }

    _readCaseAudioRuntimeFlags(player) {
        this._caseAudioRuntime.playing = player.getAttribute('playing') === 'true';
        this._caseAudioRuntime.hideOnScroll = player.getAttribute('hide-on-scroll') === 'true';
        this._caseAudioRuntime.autoScroll = player.getAttribute('auto-scroll') === 'true';
    }

    _bindCaseAudioPlayerRuntime(caseView) {
        const casePlayer = caseView?.querySelector('ds-audio-player[slot="player"]');
        const floatingPlayer = this._getFloatingAudioLayer()?.querySelector('ds-audio-player[slot="player"]');
        const runtimePlayer = this._caseAudioRuntime.player instanceof HTMLElement && this._caseAudioRuntime.player.isConnected
            ? this._caseAudioRuntime.player
            : null;
        const player = casePlayer || floatingPlayer || runtimePlayer;

        if (!(player instanceof HTMLElement)) {
            this._teardownCaseAudioPlayerRuntime('bind-missing-player');
            return;
        }

        // Remove host title to suppress native browser hover tooltip.
        player.removeAttribute('title');

        this._logResumeToast('Case audio runtime bind candidate', {
            source: casePlayer === player ? 'case-view' : (floatingPlayer === player ? 'floating-layer' : 'runtime-cache'),
            pinned: this._caseAudioRuntime.pinned,
            playing: this._caseAudioRuntime.playing,
            parentTag: player.parentElement?.tagName || null
        });

        if (this._caseAudioRuntime.player === player) {
            this._readCaseAudioRuntimeFlags(player);
            this._updateCaseAudioPlayerStickyState();
            return;
        }

        this._teardownCaseAudioPlayerRuntime('bind-switch-player-instance');

        const runtime = this._caseAudioRuntime;
        runtime.caseId = String(this.state.activeCaseId || '').trim() || null;
        runtime.player = player;

        const savedAudioPosition = this._getCaseAudioPosition(runtime.caseId);
        if (Number.isFinite(savedAudioPosition) && savedAudioPosition > 0) {
            player.setAttribute('time', String(savedAudioPosition));
        }

        const sentinel = document.createElement('span');
        sentinel.className = 'case-audio-player-sentinel';
        sentinel.style.display = 'block';
        sentinel.style.width = '100%';
        sentinel.style.height = '0';
        sentinel.style.pointerEvents = 'none';
        player.before(sentinel);
        runtime.sentinel = sentinel;

        const refreshFlags = () => {
            this._readCaseAudioRuntimeFlags(player);
        };

        const resetAutoscrollAnchor = () => {
            runtime.anchorTime = Number.parseFloat(player.getAttribute('time')) || 0;
            runtime.anchorScrollTop = this._getAppScrollRoot()?.scrollTop || 0;
        };

        runtime.onPlayToggle = (event) => {
            if (typeof event?.detail?.playing === 'boolean') {
                runtime.playing = event.detail.playing;
            } else {
                refreshFlags();
            }

            if (runtime.autoScroll && runtime.playing) {
                resetAutoscrollAnchor();
            }

            this._updateCaseAudioPlayerStickyState();
        };

        runtime.onHideToggle = (event) => {
            if (typeof event?.detail?.hideOnScroll === 'boolean') {
                runtime.hideOnScroll = event.detail.hideOnScroll;
            } else {
                refreshFlags();
            }
            this._updateCaseAudioPlayerStickyState();
        };

        runtime.onAutoToggle = (event) => {
            if (typeof event?.detail?.autoScroll === 'boolean') {
                runtime.autoScroll = event.detail.autoScroll;
            } else {
                refreshFlags();
            }

            if (runtime.autoScroll) {
                resetAutoscrollAnchor();
            }
        };

        runtime.onTimeUpdate = (event) => {
            this._setCaseAudioPosition(runtime.caseId, event?.detail?.time, { persist: false });
            this._handleCaseAudioAutoScrollProgress(event?.detail || {});
        };

        runtime.onEnded = () => {
            runtime.playing = false;
            this._updateCaseAudioPlayerStickyState();
        };

        runtime.onError = () => {
            runtime.playing = false;
            this._updateCaseAudioPlayerStickyState();
        };

        player.addEventListener('ds-audio-play-toggle', runtime.onPlayToggle);
        player.addEventListener('ds-audio-hide-toggle', runtime.onHideToggle);
        player.addEventListener('ds-audio-autoscroll-toggle', runtime.onAutoToggle);
        player.addEventListener('ds-audio-timeupdate', runtime.onTimeUpdate);
        player.addEventListener('ds-audio-ended', runtime.onEnded);
        player.addEventListener('ds-audio-error', runtime.onError);

        runtime.scrollRoot = this._getAppScrollRoot();
        runtime.scrollHandler = () => this._updateCaseAudioPlayerStickyState();
        runtime.resizeHandler = () => this._updateCaseAudioPlayerStickyState();

        if (runtime.scrollRoot instanceof HTMLElement) {
            runtime.scrollRoot.addEventListener('scroll', runtime.scrollHandler, { passive: true });
        }
        window.addEventListener('resize', runtime.resizeHandler);

        runtime.observer = new MutationObserver(() => {
            refreshFlags();
            this._updateCaseAudioPlayerStickyState();
        });
        runtime.observer.observe(player, {
            attributes: true,
            attributeFilter: ['playing', 'hide-on-scroll', 'auto-scroll', 'time', 'duration']
        });

        refreshFlags();
        if (runtime.autoScroll && runtime.playing) {
            resetAutoscrollAnchor();
        }
        this._updateCaseAudioPlayerStickyState();
    }

    _getCaseAudioStickyTopOffset(floatingEl = null) {
        const globalHeaderWrap = this.shadowRoot?.getElementById('global-header-wrap');
        const headerRect = globalHeaderWrap instanceof HTMLElement
            ? globalHeaderWrap.getBoundingClientRect()
            : null;
        const headerBottom = headerRect ? headerRect.bottom : 0;

        if (this._isMobileBreakpoint()) {
            const dockGap = 8;
            return Math.max(0, Math.round(headerBottom + dockGap));
        }

        const globalHeader = this.shadowRoot?.getElementById('global-header');
        const headerContent = globalHeader?.shadowRoot?.querySelector('.header-content');
        const headerContentRect = headerContent instanceof HTMLElement
            ? headerContent.getBoundingClientRect()
            : headerRect;

        const overlayHeight = floatingEl instanceof HTMLElement
            ? Math.max(0, floatingEl.getBoundingClientRect().height)
            : 0;
        const fallbackOverlayHeight = 40;
        const effectiveOverlayHeight = overlayHeight > 0 ? overlayHeight : fallbackOverlayHeight;

        if (headerContentRect) {
            const centerY = headerContentRect.top + (headerContentRect.height / 2);
            return Math.max(0, Math.round(centerY - (effectiveOverlayHeight / 2)));
        }

        return Math.max(0, Math.round(headerBottom + 4));
    }

    _resolveToastTopOffset() {
        const fallbackOffset = this._getCaseAudioStickyTopOffset();
        const runtime = this._caseAudioRuntime;
        const player = runtime?.player;

        if (!(runtime?.pinned) || !(player instanceof HTMLElement) || this.state.currentView !== 'case') {
            return fallbackOffset;
        }

        const playerRect = player.getBoundingClientRect();
        if (playerRect.height <= 0 || playerRect.width <= 0) {
            return fallbackOffset;
        }

        const gap = this._isMobileBreakpoint() ? 8 : 12;
        const minOffset = Math.max(0, fallbackOffset);
        const maxOffset = Math.max(minOffset, window.innerHeight - 96);
        const anchoredOffset = Math.round(playerRect.bottom + gap);

        return Math.min(maxOffset, Math.max(minOffset, anchoredOffset));
    }

    _syncToastTopOffset() {
        const toast = this.shadowRoot?.getElementById('app-toast');
        if (!(toast instanceof HTMLElement)) return;

        const topOffset = this._resolveToastTopOffset();
        toast.style.setProperty('--app-floating-top-offset', `${topOffset}px`);
    }

    _getFloatingAudioLayer() {
        const layer = this.shadowRoot?.getElementById('floating-audio-layer');
        return layer instanceof HTMLElement ? layer : null;
    }

    _applyCaseAudioPlayerFloating(player, topOffset) {
        const runtime = this._caseAudioRuntime;
        const sentinel = runtime?.sentinel;
        const shouldUseTopLayer = !this._isMobileBreakpoint();

        if (sentinel instanceof HTMLElement) {
            if (shouldUseTopLayer) {
                const floatingLayer = this._getFloatingAudioLayer();
                if (floatingLayer && player.parentElement !== floatingLayer) {
                    floatingLayer.appendChild(player);
                }
            } else if (player.parentElement !== sentinel.parentElement) {
                sentinel.after(player);
            }
        }

        player.setAttribute('variant', 'scrolled');
        player.style.position = 'fixed';
        player.style.top = `${topOffset}px`;
        player.style.left = '50%';
        player.style.transform = 'translateX(-50%)';
        player.style.width = 'min(560px, calc(100vw - 24px))';
        player.style.maxWidth = '100%';
        player.style.margin = '0';
    }

    _clearCaseAudioPlayerFloating(player) {
        const sentinel = this._caseAudioRuntime?.sentinel;
        if (sentinel instanceof HTMLElement && player.parentElement !== sentinel.parentElement) {
            sentinel.after(player);
        }

        player.removeAttribute('variant');
        player.style.removeProperty('position');
        player.style.removeProperty('top');
        player.style.removeProperty('left');
        player.style.removeProperty('transform');
        player.style.removeProperty('z-index');
        player.style.removeProperty('width');
        player.style.removeProperty('max-width');
        player.style.removeProperty('margin');
    }

    _updateCaseAudioPlayerStickyState() {
        const runtime = this._caseAudioRuntime;
        const player = runtime.player;
        const sentinel = runtime.sentinel;

        if (!(player instanceof HTMLElement) || !(sentinel instanceof HTMLElement)) {
            return;
        }

        const topOffset = this._getCaseAudioStickyTopOffset(player);
        const isPastSentinel = sentinel.getBoundingClientRect().top <= topOffset;

        if (runtime.pinned) {
            // Stay pinned through pause — only release on explicit hide or scrolling back up
            if (!runtime.hideOnScroll || !isPastSentinel) {
                runtime.pinned = false;
                this._clearCaseAudioPlayerFloating(player);
            } else {
                this._applyCaseAudioPlayerFloating(player, topOffset);
            }
            if (this.state.toast.visible) {
                this._syncToastTopOffset();
            }
            return;
        }

        // Initial pin requires playing + hideOnScroll + scrolled past sentinel
        if (this.state.currentView === 'case'
                && runtime.playing
                && runtime.hideOnScroll
                && isPastSentinel) {
            runtime.pinned = true;
            this._applyCaseAudioPlayerFloating(player, topOffset);
            if (this.state.toast.visible) {
                this._syncToastTopOffset();
            }
            return;
        }

        this._clearCaseAudioPlayerFloating(player);
        if (this.state.toast.visible) {
            this._syncToastTopOffset();
        }
    }

    _scrollAppWithLenis(top) {
        const clamped = Math.max(0, Number(top) || 0);
        if (this._appLenis && typeof this._appLenis.scrollTo === 'function') {
            this._appLenis.scrollTo(clamped, { duration: 0.25 });
            return;
        }
        this._scrollAppTo(clamped, 'auto');
    }

    _handleCaseAudioAutoScrollProgress(detail = {}) {
        const runtime = this._caseAudioRuntime;
        if (!runtime.autoScroll || !runtime.playing || this.state.currentView !== 'case') {
            return;
        }

        const time = Number.parseFloat(detail.time);
        const duration = Number.parseFloat(detail.duration);
        if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
            return;
        }

        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return;

        const maxScrollTop = Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight);
        if (maxScrollTop <= 0) return;

        if (!Number.isFinite(runtime.anchorTime) || runtime.anchorTime < 0) {
            runtime.anchorTime = time;
        }
        if (!Number.isFinite(runtime.anchorScrollTop) || runtime.anchorScrollTop < 0) {
            runtime.anchorScrollTop = scrollRoot.scrollTop;
        }

        const startTime = Math.min(runtime.anchorTime, duration);
        const startTop = Math.min(Math.max(0, runtime.anchorScrollTop), maxScrollTop);
        const normalizedProgress = Math.min(1, Math.max(0, (time - startTime) / Math.max(0.001, duration - startTime)));
        const targetTop = startTop + ((maxScrollTop - startTop) * normalizedProgress);

        this._scrollAppWithLenis(targetTop);
    }

    _syncCaseArticleRuntimeControls(caseView, {
        customButtons = [],
        primaryAction = {},
        secondaryAction = {},
        tertiaryAction = {},
        socialControls = {}
    } = {}) {
        requestAnimationFrame(() => {
            const article = caseView?.shadowRoot?.querySelector('ds-article');
            if (!(article instanceof HTMLElement)) return;

            const primaryButtonEl = article.shadowRoot?.querySelector('.btn-primary');
            const secondary1ButtonEl = article.shadowRoot?.querySelector('.btn-secondary1');
            const secondary2ButtonEl = article.shadowRoot?.querySelector('.btn-secondary2');

            if (primaryButtonEl instanceof HTMLElement) {
                this._applyButtonConfigToElement(primaryButtonEl, primaryAction, primaryAction.label || '');
            }
            if (secondary1ButtonEl instanceof HTMLElement) {
                this._applyButtonConfigToElement(secondary1ButtonEl, secondaryAction, secondaryAction.label || '');
            }
            if (secondary2ButtonEl instanceof HTMLElement) {
                this._applyButtonConfigToElement(secondary2ButtonEl, tertiaryAction, tertiaryAction.label || '');
            }

            this._syncArticleActionTooltips(article, {
                primaryAction,
                secondaryAction,
                tertiaryAction
            });

            this._syncArticleCustomActionButtons(article, customButtons, 'case');
            this._syncArticleSocialButtons(article, socialControls);
        });
    }

    _syncArticleActionTooltips(articleEl, {
        primaryAction = {},
        secondaryAction = {},
        tertiaryAction = {}
    } = {}) {
        const articleRoot = articleEl?.shadowRoot;
        if (!articleRoot) return;

        const resolveTooltipText = (actionConfig = {}) => {
            const tooltipText = String(actionConfig?.tooltip || '').trim();
            if (tooltipText) return tooltipText;
            return String(actionConfig?.label || '').trim();
        };

        const tooltipBindings = [
            ['.tooltip-primary', resolveTooltipText(primaryAction)],
            ['.tooltip-secondary1', resolveTooltipText(secondaryAction)],
            ['.tooltip-secondary2', resolveTooltipText(tertiaryAction)]
        ];

        tooltipBindings.forEach(([selector, text]) => {
            const tooltipEl = articleRoot.querySelector(selector);
            if (!(tooltipEl instanceof HTMLElement)) return;
            this._setOrRemoveAttribute(tooltipEl, 'text', text || null);
        });
    }

    // MARK: PLAYER VIEW
    // Keeps player seek layer interactive when global fixed header is enabled.
    _syncPlayerSeekLayerInteractivity(playerView) {
        if (!(playerView instanceof HTMLElement)) return;

        const playerRoot = playerView.shadowRoot;
        const topSeekWrap = playerRoot?.querySelector('.top-seek-wrap');
        const seekBar = topSeekWrap?.querySelector('ds-seek-bar') || playerRoot?.querySelector('ds-seek-bar');

        if (topSeekWrap instanceof HTMLElement) {
            // Global header sits at z-index 4700. Keep seek slightly above it so drag reaches ds-seek-bar.
            topSeekWrap.style.zIndex = '4705';
            topSeekWrap.style.pointerEvents = 'none';
        }

        if (seekBar instanceof HTMLElement) {
            seekBar.style.pointerEvents = 'auto';
            // Prevent host scroll gestures from hijacking touch dragging on the seek timeline.
            seekBar.style.touchAction = 'none';
        }
    }

    // Renders the dedicated player view when a case video is selected.
    renderPlayerView() {
        const playerViewHost = this.shadowRoot.getElementById('player-view-host');
        if (!playerViewHost) return;

        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
        const mountedPlayerViews = [...playerViewHost.querySelectorAll('ds-player-view')];

        if (mountedPlayerViews.length > 1) {
            mountedPlayerViews.slice(1).forEach((duplicateView) => duplicateView.remove());
        }

        let playerView = mountedPlayerViews[0] || null;
        const activeLocale = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        const activeCaseId = String(this.state.activeCaseId || '');

        // Language switches can leave the underlying media element in a stale loading state.
        // Recreate the player host component on locale changes so source pipelines restart cleanly.
        if (playerView && playerView.dataset.locale !== activeLocale) {
            playerView.remove();
            playerView = null;
        }

        // Switching between videos from breadcrumb menus can leave the internal media
        // element in a stale loading state. Recreate PlayerView when case id changes.
        if (playerView && playerView.dataset.caseId !== activeCaseId) {
            playerView.remove();
            playerView = null;
        }

        if (!playerView) {
            playerView = document.createElement('ds-player-view');
            playerView.id = 'player-view';

            // Pre-apply header contract before first mount to avoid a visible about/avatar rerender.
            this._applyHeaderContractToElement(playerView, {
                fallbackVisibility: {
                    'show-breadcrumb': 'true',
                    'show-language-menu': 'true',
                    'show-navigation-region': 'true'
                }
            });

            playerViewHost.appendChild(playerView);
        }

        playerView.dataset.locale = activeLocale;
        playerView.dataset.caseId = activeCaseId;

        this._setAttributes(playerView, {
            'data-mobile-breakpoint': this._isMobileBreakpoint() ? 'true' : null
        });

        if (playerView.dataset.uiVisibilityBound !== 'true') {
            playerView.addEventListener('ds-player-ui-visibility-change', (event) => {
                const visible = event.detail?.visible !== false;
                console.debug('[app-shell][player] ui visibility request', {
                    visible,
                    activeCaseId: this.state.activeCaseId,
                    currentView: this.state.currentView
                });
                this._playerUiHidden = !visible;
                this._queueContextualMenuVisibilitySync();
            });
            playerView.dataset.uiVisibilityBound = 'true';
        }

        if (this.state.currentView !== 'player') {
            this._playerUiHidden = false;
            playerView.removeAttribute('ui-hidden');
            this._detachPlayerHeaderDebugObserver();

            const existingVideoEl = playerView?.shadowRoot
                ?.querySelector('ds-thumbnail')
                ?.shadowRoot
                ?.querySelector('.screen-cover-video, video');
            if (existingVideoEl instanceof HTMLVideoElement && !existingVideoEl.paused) {
                existingVideoEl.pause();
            }

            return;
        }

        this._syncPlayerUiHiddenState();
        this._syncNavigationLanguageMenus();
        this._attachPlayerHeaderDebugObserver(playerView);
        this._syncPlayerSeekLayerInteractivity(playerView);

        if (playerView.dataset.bound === 'true') {
            // Existing listeners remain attached while the route stays mounted.
        } else {
            playerView.addEventListener('ds-breadcrumb-home', () => {
                console.debug('[app-shell][nav] breadcrumb-home', {
                    source: 'player-view',
                    currentView: this.state.currentView,
                    history: this._getNormalizedViewHistory(),
                    smartPath: this._buildSmartBreadcrumbViewPath()
                });
                this._transitionToView({ currentView: 'home', activeCaseId: null });
            });
            playerView.addEventListener('ds-breadcrumb-return', () => {
                console.debug('[app-shell][nav] breadcrumb-return', {
                    source: 'player-view',
                    currentView: this.state.currentView,
                    history: this._getNormalizedViewHistory(),
                    smartPath: this._buildSmartBreadcrumbViewPath()
                });
                this._handleReturnNavigation({ source: 'player-view' });
            });
            playerView.addEventListener('ds-breadcrumb-select', (event) => {
                const crumbId = event.detail?.id;
                const parentCrumbId = event.detail?.parentItem?.id;
                const selectedCaseId = event.detail?.selectedMenuItem?.id || event.detail?.id;

                console.debug('[app-shell][nav] breadcrumb-select', {
                    source: 'player-view',
                    crumbId,
                    parentCrumbId,
                    selectedCaseId,
                    currentView: this.state.currentView,
                    history: this._getNormalizedViewHistory(),
                    smartPath: this._buildSmartBreadcrumbViewPath()
                });

                if (this._handleCaseVideoBreadcrumbSelection(parentCrumbId, selectedCaseId)) return;

                if (crumbId === 'home') {
                    this._transitionToBreadcrumbSelection('home', { activeCaseId: null });
                    return;
                }

                if (crumbId === 'case') {
                    this._transitionToBreadcrumbSelection('case', { activeCaseId: this.state.activeCaseId });
                }
            });
            playerView.dataset.bound = 'true';
        }
        if (!activeCase) {
            playerView.caseMenuItems = [];
            playerView.videoMenuItems = [];
            playerView.caseMenuHeader = t('breadcrumb_menu_case_header');
            playerView.videoMenuHeader = t('breadcrumb_menu_video_header');
            this._setAttributes(playerView, {
                'aria-label': t('player_video_title'),
                'show-breadcrumb': 'true',
                'video-src': '',
                'case-title': '',
                'video-title': t('player_video_title')
            });
            playerView.removeAttribute('title');
            return;
        }

        const title = this.getLang(activeCase.title);
        const rawVideoSrc = this.getLang(this._resolveCasePrimaryVideoProp(activeCase));
        const videoSrc = this._resolveRuntimeMediaUrl(rawVideoSrc);
        const thumbCategory = activeCase.thumbCategory || 'mobile';
        const thumbBrand = activeCase.thumbBrand || 'apple';
        const thumbModel = activeCase.thumbModel || 'Apple iPhone 12';
        const thumbColor = activeCase.thumbColor || 'Black';
        const subtitleSrc = String(this.getLangCurrentLocaleOnly(this._resolveCasePrimaryVttProp(activeCase)) || '').trim();
        const rawSubtitleConfig = this._resolveCasePrimaryVttProp(activeCase);
        const {
            breadcrumbMenuLabels,
            breadcrumbMenuIconConfig,
            caseMenuItems,
            videoMenuItems
        } = this._buildBreadcrumbMenuContext(activeCase.id, 'playerView');

        playerView.caseMenuItems = caseMenuItems;
        playerView.videoMenuItems = videoMenuItems;
        playerView.caseMenuHeader = breadcrumbMenuLabels.caseHeader;
        playerView.videoMenuHeader = breadcrumbMenuLabels.videoHeader;
        playerView.caseMenuIcon = breadcrumbMenuIconConfig.caseStudies.itemIcon;
        playerView.caseMenuIconVariant = breadcrumbMenuIconConfig.caseStudies.itemIconVariant;
        playerView.caseMenuShowIcon = breadcrumbMenuIconConfig.caseStudies.showItemIcon;
        playerView.videoMenuIcon = breadcrumbMenuIconConfig.videos.itemIcon;
        playerView.videoMenuIconVariant = breadcrumbMenuIconConfig.videos.itemIconVariant;
        playerView.videoMenuShowIcon = breadcrumbMenuIconConfig.videos.showItemIcon;

        this._setAttributes(playerView, {
            'aria-label': title || t('player_video_title'),
            'show-breadcrumb': 'true',
            autoplay: 'true',
            'case-title': title || activeCase.id,
            'video-title': title || t('player_video_title'),
            'label-play': t('player_label_play'),
            'label-pause': t('player_label_pause'),
            'label-cc-on': t('player_label_cc_on'),
            'label-cc-off': t('player_label_cc_off'),
            'label-mute': t('player_label_mute'),
            'label-unmute': t('player_label_unmute'),
            'label-speed': t('player_label_speed'),
            'video-src': videoSrc || '',
            category: thumbCategory,
            brand: thumbBrand,
            model: thumbModel,
            color: thumbColor,
            'screen-video': videoSrc || ''
        });
        console.debug('[app-shell][player] bind video case', {
            caseId: activeCase.id,
            lang: this.state.currentLang,
            rawSubtitleConfig,
            rawVideoSrc,
            videoSrc,
            subtitleSrc,
            showBreadcrumb: true
        });
        playerView.removeAttribute('title');

        playerView.removeAttribute('device-src');

        if (subtitleSrc) {
            this._setAttributes(playerView, { 'subtitle-src': subtitleSrc });
            console.debug('[app-shell][player] applied subtitle-src', {
                caseId: activeCase.id,
                lang: this.state.currentLang,
                subtitleSrc,
                currentAttr: playerView.getAttribute('subtitle-src')
            });
        } else {
            playerView.removeAttribute('subtitle-src');
            console.debug('[app-shell][player] removed subtitle-src due to empty active-locale value', {
                caseId: activeCase.id,
                lang: this.state.currentLang,
                rawSubtitleConfig,
                currentAttr: playerView.getAttribute('subtitle-src')
            });
        }

        const videoSrcCandidates = this._buildRuntimeMediaCandidates(rawVideoSrc);

        if (videoSrcCandidates.length > 1) {
            const resolveToken = `${activeCaseId}:${activeLocale}:${Date.now()}`;
            this._pendingPlayerVideoResolveToken = resolveToken;

            this._pickReachableRuntimeMediaUrl(videoSrcCandidates)
                .then((resolvedVideoSrc) => {
                    if (!resolvedVideoSrc) return;
                    if (this._pendingPlayerVideoResolveToken !== resolveToken) return;
                    if (playerView.dataset.caseId !== activeCaseId || playerView.dataset.locale !== activeLocale) return;
                    if (resolvedVideoSrc === videoSrc) return;

                    this._setAttributes(playerView, {
                        'video-src': resolvedVideoSrc,
                        'screen-video': resolvedVideoSrc
                    });

                    console.debug('[app-shell][player] switched to reachable video source candidate', {
                        caseId: activeCase.id,
                        lang: this.state.currentLang,
                        resolvedVideoSrc,
                        attemptedCandidates: videoSrcCandidates
                    });
                })
                .catch(() => {
                    // Keep initial bound source when candidate probing fails.
                });
        }
    }

    // MARK: ABOUT VIEW
    // Renders About Me markdown into a plain article view (no reader controls or TOC).
    renderAboutView() {
        const aboutArticle = this.shadowRoot.getElementById('about-article');
        if (!(aboutArticle instanceof HTMLElement)) return;
        if (this.state.currentView !== 'about') return;

        this._setAttributes(aboutArticle, {
            'data-mobile-breakpoint': this._isMobileBreakpoint() ? 'true' : null
        });

        const aboutPayload = this._aboutPayload || parseAboutMarkdown(aboutMeMarkdownRaw);
        const aboutConfig = aboutPayload.config || {};
        const socialConfig = aboutConfig.social || {};
        const customButtons = Array.isArray(aboutConfig.customButtons) ? aboutConfig.customButtons : [];
        const actionPrimary = aboutConfig.actions?.primary || {};
        const actionSecondary1 = aboutConfig.actions?.secondary1 || {};
        const actionSecondary2 = aboutConfig.actions?.secondary2 || {};
        const socialControls = this._resolveSocialControlsMap(socialConfig, { shareEnabledByDefault: false });
        const aboutSocialLinks = this._resolveSocialLinksMap(socialConfig);

        const resolveAboutAction = (actionConfig, fallbackLabel, fallbackVariant) => {
            const resolvedLabel = this._resolveLocalizedConfigText(actionConfig?.label).trim() || fallbackLabel;
            const resolvedUrl = this._resolveLocalizedConfigText(actionConfig?.url).trim();
            return {
                ...actionConfig,
                enabled: actionConfig?.enabled !== false,
                label: resolvedLabel,
                variant: String(actionConfig?.variant || fallbackVariant || '').trim() || fallbackVariant,
                url: resolvedUrl,
                tooltip: this._resolveLocalizedConfigText(actionConfig?.tooltip).trim(),
                imageSrc: this._resolveLocalizedConfigText(actionConfig?.imageSrc ?? actionConfig?.['image-src']).trim(),
                imageAlt: this._resolveLocalizedConfigText(actionConfig?.imageAlt ?? actionConfig?.['image-alt']).trim(),
                ariaLabel: this._resolveLocalizedConfigText(actionConfig?.ariaLabel ?? actionConfig?.['aria-label']).trim()
            };
        };

        const primaryAction = resolveAboutAction(actionPrimary, '', 'primary');
        const secondaryAction = resolveAboutAction(actionSecondary1, '', 'secondary');
        const tertiaryAction = resolveAboutAction(actionSecondary2, '', 'tertiary');

        const showPrimary = primaryAction.enabled !== false && primaryAction.url.length > 0;
        const showSecondary1 = secondaryAction.enabled !== false && secondaryAction.url.length > 0;
        const showSecondary2 = tertiaryAction.enabled !== false && tertiaryAction.url.length > 0;

        const aboutTitle = this.getLang(aboutPayload.title) || t('about_title');
        const aboutSubtitle = this.getLang(aboutPayload.subtitle) || '';

        const aboutViewShell = this.shadowRoot.getElementById('about-view-shell');
        if (aboutViewShell instanceof HTMLElement) {
            aboutViewShell.setAttribute('aria-label', t('view_about_aria_label'));
        }

        this._setAttributes(aboutArticle, {
            'aria-label': aboutTitle,
            kicker: '',
            'title-text': aboutTitle,
            'subtitle-text': this._resolveSubtitleVisibility(aboutConfig, true) ? aboutSubtitle : '',
            'primary-label': primaryAction.label || '',
            'secondary1-label': secondaryAction.label || '',
            'secondary2-label': tertiaryAction.label || '',
            'show-kicker': 'false',
            'show-title': this._resolveTitleVisibility(aboutConfig, true) ? 'true' : 'false',
            'show-cover': 'false',
            'show-summary': 'false',
            'show-player': 'false',
            'show-toc': 'false',
            'show-navigator': 'false',
            'show-action-primary': (showPrimary && primaryAction.label) ? 'true' : 'false',
            'show-action-secondary1': (showSecondary1 && secondaryAction.label) ? 'true' : 'false',
            'show-action-secondary2': (showSecondary2 && tertiaryAction.label) ? 'true' : 'false',
            'show-social-share': socialControls.share?.enabled ? 'true' : 'false',
            'show-social-linkedin': socialControls.linkedin?.enabled ? 'true' : 'false',
            'show-social-x': socialControls.x?.enabled ? 'true' : 'false',
            'show-social-facebook': socialControls.facebook?.enabled ? 'true' : 'false'
        });

        const composedHtml = this.getLang(aboutPayload.bodyHtml) || '';

        if (aboutArticle.dataset.aboutHtml !== composedHtml) {
            aboutArticle.innerHTML = composedHtml;
            aboutArticle.dataset.aboutHtml = composedHtml;
        }

        this._syncMermaidErrorLabels(aboutArticle);

        const primaryButtonEl = aboutArticle.shadowRoot?.querySelector('.btn-primary');
        const secondary1ButtonEl = aboutArticle.shadowRoot?.querySelector('.btn-secondary1');
        const secondary2ButtonEl = aboutArticle.shadowRoot?.querySelector('.btn-secondary2');
        if (primaryButtonEl instanceof HTMLElement) {
            this._applyButtonConfigToElement(primaryButtonEl, primaryAction, primaryAction.label || '');
        }
        if (secondary1ButtonEl instanceof HTMLElement) {
            this._applyButtonConfigToElement(secondary1ButtonEl, secondaryAction, secondaryAction.label || '');
        }
        if (secondary2ButtonEl instanceof HTMLElement) {
            this._applyButtonConfigToElement(secondary2ButtonEl, tertiaryAction, tertiaryAction.label || '');
        }

        this._syncArticleActionTooltips(aboutArticle, {
            primaryAction,
            secondaryAction,
            tertiaryAction
        });

        this._syncArticleCustomActionButtons(aboutArticle, customButtons, 'about');
        this._syncArticleSocialButtons(aboutArticle, socialControls);

        aboutArticle.dataset.aboutPrimaryUrl = primaryAction.url || '';
        aboutArticle.dataset.aboutSecondary1Url = secondaryAction.url || '';
        aboutArticle.dataset.aboutSecondary2Url = tertiaryAction.url || '';

        aboutArticle.dataset.aboutLinkedinUrl = aboutSocialLinks.linkedin || '';
        aboutArticle.dataset.aboutXUrl = aboutSocialLinks.x || '';
        aboutArticle.dataset.aboutFacebookUrl = aboutSocialLinks.facebook || '';
        aboutArticle.dataset.aboutSocialLinks = JSON.stringify(aboutSocialLinks);

        this._ensureAboutSmoothScrolling();
    }

    _syncArticleCustomActionButtons(articleEl, customButtons, scope = 'article') {
        const mainActionsEl = articleEl?.shadowRoot?.querySelector('.main-actions');
        if (!(mainActionsEl instanceof HTMLElement)) return;

        const customActionClassName = `${scope}-custom-action`;
        mainActionsEl.querySelectorAll(`.${customActionClassName}`).forEach((node) => node.remove());

        if (!Array.isArray(customButtons) || customButtons.length === 0) {
            mainActionsEl.style.removeProperty('display');
            return;
        }

        customButtons.forEach((buttonConfig) => {
            const buttonLabel = this._resolveLocalizedConfigText(buttonConfig?.label).trim();
            const buttonUrl = this._resolveLocalizedConfigText(buttonConfig?.url).trim();
            const buttonTooltip = this._resolveLocalizedConfigText(buttonConfig?.tooltip).trim() || buttonLabel;
            if (!buttonLabel || !buttonUrl) return;

            const wrapper = document.createElement('div');
            wrapper.className = `tooltip-wrapper ${customActionClassName}`;

            const buttonEl = document.createElement('ds-button');
            buttonEl.textContent = buttonLabel;
            this._applyButtonConfigToElement(buttonEl, {
                ...buttonConfig,
                label: buttonLabel,
                imageSrc: this._resolveLocalizedConfigText(buttonConfig?.imageSrc ?? buttonConfig?.['image-src']).trim(),
                imageAlt: this._resolveLocalizedConfigText(buttonConfig?.imageAlt ?? buttonConfig?.['image-alt']).trim(),
                ariaLabel: this._resolveLocalizedConfigText(buttonConfig?.ariaLabel ?? buttonConfig?.['aria-label']).trim()
            }, buttonLabel);
            buttonEl.addEventListener('click', () => {
                window.open(buttonUrl, '_blank', 'noopener,noreferrer');
            });

            wrapper.appendChild(buttonEl);

            if (buttonTooltip) {
                const tooltipEl = document.createElement('ds-tooltip');
                tooltipEl.setAttribute('text', buttonTooltip);
                tooltipEl.setAttribute('position', 'bottom');
                wrapper.appendChild(tooltipEl);
            }

            mainActionsEl.appendChild(wrapper);
        });

        mainActionsEl.style.display = 'flex';
    }

    _syncMermaidErrorLabels(rootEl) {
        if (!(rootEl instanceof HTMLElement)) return;

        const localizedErrorText = String(t('mermaid_error') || '').trim();
        if (!localizedErrorText) return;

        rootEl.querySelectorAll('mermaid-diagram').forEach((diagramEl) => {
            if (!(diagramEl instanceof HTMLElement)) return;
            diagramEl.setAttribute('error-text', localizedErrorText);
        });
    }

    _resolveLocalizedConfigText(value) {
        if (typeof value === 'string') return value;
        if (!value || typeof value !== 'object') return '';

        const localized = this.getLang(value);
        return typeof localized === 'string' ? localized : '';
    }

    _resolveSummaryProps(caseData = {}) {
        const summaryProps = caseData?.summaryProps && typeof caseData.summaryProps === 'object'
            ? caseData.summaryProps
            : {};
        const currentLocale = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        const rawMetrics = Array.isArray(summaryProps.metrics)
            ? summaryProps.metrics
            : (Array.isArray(summaryProps.metrics?.[currentLocale])
                ? summaryProps.metrics[currentLocale]
                : (Array.isArray(summaryProps.metrics?.[DEFAULT_LOCALE]) ? summaryProps.metrics[DEFAULT_LOCALE] : []));
        const metrics = rawMetrics
            .filter((metric) => metric && typeof metric === 'object')
            .map((metric) => ({
                value: String(metric.value ?? '').trim(),
                label: String(this._resolveLocalizedConfigText(metric.label) || '').trim(),
                prefix: String(metric.prefix ?? '').trim(),
                suffix: String(metric.suffix ?? '').trim(),
                trend: String(metric.trend ?? '').trim(),
                icon: String(metric.icon ?? '').trim(),
                variant: this._normalizeMetricVariant(metric.variant),
                ariaLabel: String(this._resolveLocalizedConfigText(metric.ariaLabel) || '').trim()
            }))
            .filter((metric) => metric.value && metric.label);
        const showMetrics = this._toBooleanFlag(summaryProps.showMetrics, false) && metrics.length > 0;

        return {
            text: String(this._resolveLocalizedConfigText(summaryProps.text) || '').trim(),
            active: this._toBooleanFlag(summaryProps.active, false),
            labelHeader: String(this._resolveLocalizedConfigText(summaryProps.labelHeader) || '').trim(),
            showMetrics,
            ariaLabel: String(this._resolveLocalizedConfigText(summaryProps.ariaLabel) || '').trim(),
            metrics
        };
    }

    _buildSummaryMetricsMarkup(metrics = []) {
        return metrics
            .map((metric) => {
                const attributes = [
                    `value="${this._escapeHtmlAttr(metric.value)}"`,
                    `label="${this._escapeHtmlAttr(metric.label)}"`,
                    `variant="${this._escapeHtmlAttr(metric.variant || 'default')}"`
                ];

                if (metric.prefix) attributes.push(`prefix="${this._escapeHtmlAttr(metric.prefix)}"`);
                if (metric.suffix) attributes.push(`suffix="${this._escapeHtmlAttr(metric.suffix)}"`);
                if (metric.trend) attributes.push(`trend="${this._escapeHtmlAttr(metric.trend)}"`);
                if (metric.icon) attributes.push(`icon="${this._escapeHtmlAttr(metric.icon)}"`);
                if (metric.ariaLabel) attributes.push(`aria-label="${this._escapeHtmlAttr(metric.ariaLabel)}"`);

                return `<ds-metric-card ${attributes.join(' ')}></ds-metric-card>`;
            })
            .join('');
    }

    _buildSummaryMarkup(caseData, summaryHtml, showSummary) {
        if (!showSummary) return '';

        const summaryProps = this._resolveSummaryProps(caseData);
        const summaryText = summaryProps.text || this._extractPlainTextFromHtml(summaryHtml);
        if (!summaryText) return '';

        const attributes = [
            'slot="summary"',
            `text="${this._escapeHtmlAttr(summaryText)}"`,
            `label-header="${this._escapeHtmlAttr(summaryProps.labelHeader || '')}"`,
            `show-metrics="${summaryProps.showMetrics ? 'true' : 'false'}"`,
            `active="${summaryProps.active ? 'true' : 'false'}"`
        ];

        if (summaryProps.ariaLabel) {
            attributes.push(`aria-label="${this._escapeHtmlAttr(summaryProps.ariaLabel)}"`);
        }

        const metricsMarkup = summaryProps.showMetrics
            ? this._buildSummaryMetricsMarkup(summaryProps.metrics)
            : '';

        return `<ds-summary ${attributes.join(' ')}>${metricsMarkup}</ds-summary>`;
    }

    _buildRuntimeMediaCandidates(value, { preferTemplatePrefix = false } = {}) {
        const raw = String(value || '').trim();
        if (!raw) return [];

        const candidates = [];
        const addCandidate = (candidate) => {
            const normalized = String(candidate || '').trim();
            if (!normalized || candidates.includes(normalized)) return;
            candidates.push(normalized);
        };

        const normalized = raw.replace(/\\/g, '/');

        if (/^(?:https?:|data:|blob:)/i.test(normalized)) {
            addCandidate(normalized);
            return candidates;
        }

        const canonical = /^(?:\/)/.test(normalized)
            ? normalized
            : (normalized.startsWith('./') || normalized.startsWith('../'))
                ? normalized
                : `/${normalized}`;

        addCandidate(canonical);

        const sourcePrefix = '/src/content/cases/';
        const templatePrefix = '/templates/src/content/cases/';

        if (canonical.startsWith(sourcePrefix)) {
            addCandidate(canonical.replace(sourcePrefix, templatePrefix));
        }

        if (canonical.startsWith(templatePrefix)) {
            addCandidate(canonical.replace(templatePrefix, sourcePrefix));
        }

        if (preferTemplatePrefix && candidates.length > 1) {
            const templateIndex = candidates.findIndex((candidate) => candidate.startsWith(templatePrefix));
            if (templateIndex > 0) {
                const [templateCandidate] = candidates.splice(templateIndex, 1);
                candidates.unshift(templateCandidate);
            }
        }

        return candidates;
    }

    _resolveRuntimeMediaUrl(value, { preferTemplatePrefix = false } = {}) {
        const candidates = this._buildRuntimeMediaCandidates(value, { preferTemplatePrefix });
        return candidates[0] || '';
    }

    // Resolves to '' when no candidate is confirmed so callers keep the already bound source.
    _pickReachableRuntimeMediaUrl(candidates = []) {
        return pickReachableRuntimeMediaUrl(candidates);
    }

    _buildRuntimeImageCandidates(value) {
        const raw = String(value || '').trim();
        if (!raw) return [];

        const candidates = [];
        const addCandidate = (candidate) => {
            const normalized = String(candidate || '').trim();
            if (!normalized || candidates.includes(normalized)) return;
            candidates.push(normalized);
        };

        const normalized = raw.replace(/\\/g, '/');
        const canonical = /^(?:https?:|data:|blob:|\/)/i.test(normalized) ? normalized : `/${normalized}`;

        addCandidate(canonical);

        const sourcePrefix = '/src/content/cases/';
        const templatePrefix = '/templates/src/content/cases/';

        if (canonical.startsWith(sourcePrefix)) {
            addCandidate(canonical.replace(sourcePrefix, templatePrefix));
        }

        if (canonical.startsWith(templatePrefix)) {
            addCandidate(canonical.replace(templatePrefix, sourcePrefix));
        }

        return candidates;
    }

    _resolveRuntimeImageUrl(value) {
        const candidates = this._buildRuntimeImageCandidates(value);
        if (candidates.length === 0) {
            return Promise.resolve('');
        }

        const tryCandidate = (index) => {
            const candidate = candidates[index];
            if (!candidate) return Promise.resolve('');

            if (/^(?:https?:|data:|blob:)/i.test(candidate)) {
                return Promise.resolve(candidate);
            }

            return new Promise((resolve) => {
                const image = new Image();
                image.onload = () => resolve(candidate);
                image.onerror = () => {
                    if (index + 1 < candidates.length) {
                        resolve(tryCandidate(index + 1));
                        return;
                    }
                    resolve('');
                };
                image.src = candidate;
            });
        };

        return tryCandidate(0);
    }

    _normalizeButtonVariant(value, fallbackValue = 'tertiary') {
        const normalized = String(value || '').trim().toLowerCase();
        if (['primary', 'secondary', 'tertiary', 'floating'].includes(normalized)) {
            return normalized;
        }
        return fallbackValue;
    }

    _normalizeMetricVariant(value, fallbackValue = 'default') {
        const normalized = String(value || '').trim().toLowerCase();
        if (['default', 'success', 'accent', 'warning', 'error'].includes(normalized)) {
            return normalized;
        }
        return fallbackValue;
    }

    _normalizePosition(value, fallbackValue = 'left') {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'right' ? 'right' : fallbackValue;
    }

    _normalizeIconVariant(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'fill' ? 'fill' : 'outline';
    }

    _toBooleanFlag(value, fallbackValue = false) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true') return true;
            if (normalized === 'false') return false;
        }
        return fallbackValue;
    }

    _setOrRemoveAttribute(element, name, value) {
        if (!(element instanceof HTMLElement)) return;
        if (value === null || typeof value === 'undefined' || value === '') {
            element.removeAttribute(name);
            return;
        }
        element.setAttribute(name, String(value));
    }

    _setBooleanAttribute(element, name, isEnabled) {
        if (!(element instanceof HTMLElement)) return;
        if (isEnabled) {
            element.setAttribute(name, '');
            return;
        }
        element.removeAttribute(name);
    }

    _applyButtonConfigToElement(buttonEl, buttonConfig = {}, fallbackLabel = '') {
        if (!(buttonEl instanceof HTMLElement)) return;

        const variant = this._normalizeButtonVariant(buttonConfig?.variant, 'tertiary');
        const ariaLabel = String(buttonConfig?.ariaLabel || fallbackLabel || '').trim();
        const icon = String(buttonConfig?.icon || '').trim();
        const imageSrc = String(buttonConfig?.imageSrc || '').trim();
        const hasImage = this._toBooleanFlag(buttonConfig?.hasImage, imageSrc.length > 0);
        const hasIcon = this._toBooleanFlag(buttonConfig?.hasIcon, icon.length > 0);
        const hasText = this._toBooleanFlag(buttonConfig?.hasText, true);

        this._setOrRemoveAttribute(buttonEl, 'variant', variant);
        this._setOrRemoveAttribute(buttonEl, 'aria-label', ariaLabel || fallbackLabel || null);
        this._setOrRemoveAttribute(buttonEl, 'has-text', hasText ? null : 'false');

        this._setBooleanAttribute(buttonEl, 'has-image', hasImage);
        this._setOrRemoveAttribute(buttonEl, 'image-src', hasImage ? imageSrc : null);
        this._setOrRemoveAttribute(buttonEl, 'image-alt', hasImage ? String(buttonConfig?.imageAlt || fallbackLabel || '').trim() : null);
        this._setOrRemoveAttribute(buttonEl, 'image-position', hasImage ? this._normalizePosition(buttonConfig?.imagePosition, 'left') : null);

        this._setBooleanAttribute(buttonEl, 'has-icon', !hasImage && hasIcon);
        this._setOrRemoveAttribute(buttonEl, 'icon', !hasImage && hasIcon ? icon : null);
        this._setOrRemoveAttribute(buttonEl, 'icon-variant', !hasImage && hasIcon ? this._normalizeIconVariant(buttonConfig?.iconVariant) : null);
        this._setOrRemoveAttribute(buttonEl, 'icon-position', !hasImage && hasIcon ? this._normalizePosition(buttonConfig?.iconPosition, 'left') : null);
    }

    _resolveSocialControl(value, fallbackEnabled = true, fallbackIcon = '') {
        if (typeof value === 'boolean') {
            return {
                enabled: value,
                icon: fallbackIcon,
                iconVariant: 'outline'
            };
        }

        if (!value || typeof value !== 'object') {
            return {
                enabled: fallbackEnabled,
                icon: fallbackIcon,
                iconVariant: 'outline'
            };
        }

        return {
            enabled: this._toBooleanFlag(value.enabled, fallbackEnabled),
            icon: String(value.icon || fallbackIcon).trim(),
            tooltip: this._resolveLocalizedConfigText(value.tooltip).trim(),
            iconVariant: value.iconVariant ?? value['icon-variant'] ?? 'outline',
            iconPosition: value.iconPosition ?? value['icon-position'] ?? 'left',
            hasIcon: value.hasIcon ?? value['has-icon'],
            hasImage: value.hasImage ?? value['has-image'],
            imageSrc: this._resolveLocalizedConfigText(value.imageSrc ?? value['image-src']).trim(),
            imageAlt: this._resolveLocalizedConfigText(value.imageAlt ?? value['image-alt']).trim(),
            imagePosition: value.imagePosition ?? value['image-position'] ?? 'left',
            variant: value.variant || 'tertiary',
            ariaLabel: this._resolveLocalizedConfigText(value.ariaLabel ?? value['aria-label']).trim()
        };
    }

    _resolveSocialLinksMap(socialConfig = {}) {
        const social = socialConfig && typeof socialConfig === 'object' ? socialConfig : {};
        const links = social.links && typeof social.links === 'object' ? social.links : {};
        const output = {};

        Object.entries(links).forEach(([platformKey, rawValue]) => {
            const normalizedKey = String(platformKey || '').trim().toLowerCase();
            if (!normalizedKey) return;

            const resolved = this._resolveLocalizedConfigText(rawValue).trim();
            if (resolved) {
                output[normalizedKey] = resolved;
            }
        });

        Object.entries(social).forEach(([platformKey, value]) => {
            const normalizedKey = String(platformKey || '').trim().toLowerCase();
            if (!normalizedKey || normalizedKey === 'links') return;
            if (output[normalizedKey]) return;
            if (!value || typeof value !== 'object') return;

            const directUrl = this._resolveLocalizedConfigText(value.url).trim();
            if (directUrl) {
                output[normalizedKey] = directUrl;
            }
        });

        return output;
    }

    _humanizeSocialKey(platformKey = '') {
        const normalized = String(platformKey || '').trim().toLowerCase();
        if (!normalized) return '';

        const aliases = {
            x: 'X',
            github: 'GitHub',
            youtube: 'YouTube',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn'
        };

        if (aliases[normalized]) {
            return aliases[normalized];
        }

        return normalized
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' ');
    }

    _resolveSocialControlsMap(socialConfig = {}, { shareEnabledByDefault = true } = {}) {
        const social = socialConfig && typeof socialConfig === 'object' ? socialConfig : {};
        const linksMap = this._resolveSocialLinksMap(social);
        const defaultPlatforms = ['share', 'linkedin', 'x', 'facebook'];

        const configuredKeys = Object.keys(social)
            .map((key) => String(key || '').trim().toLowerCase())
            .filter((key) => key && key !== 'links');

        const customKeys = configuredKeys.filter((key) => !defaultPlatforms.includes(key));
        const orderedKeys = [...defaultPlatforms, ...customKeys];
        const controls = {};

        orderedKeys.forEach((platformKey) => {
            const rawConfig = social[platformKey];
            const fallbackEnabled = platformKey === 'share' ? shareEnabledByDefault : true;
            const control = this._resolveSocialControl(rawConfig, fallbackEnabled, platformKey);
            const fallbackLabel = this._humanizeSocialKey(platformKey) || platformKey;
            const ariaLabel = String(control.ariaLabel || fallbackLabel).trim();

            controls[platformKey] = {
                ...control,
                key: platformKey,
                icon: String(control.icon || platformKey).trim() || platformKey,
                ariaLabel,
                label: ariaLabel,
                tooltip: String(control.tooltip || '').trim(),
                link: linksMap[platformKey] || ''
            };
        });

        return controls;
    }

    _syncArticleSocialButtons(articleEl, socialControls = {}) {
        const articleRoot = articleEl?.shadowRoot;
        if (!articleRoot) return;

        const socialActionsEl = articleRoot.querySelector('.social-actions');
        if (!(socialActionsEl instanceof HTMLElement)) return;

        const fixedControls = {
            share: {
                wrapper: articleRoot.querySelector('.wrapper-share'),
                button: articleRoot.querySelector('.btn-share')
            },
            linkedin: {
                wrapper: articleRoot.querySelector('.wrapper-linkedin'),
                button: articleRoot.querySelector('.btn-linkedin')
            },
            x: {
                wrapper: articleRoot.querySelector('.wrapper-x'),
                button: articleRoot.querySelector('.btn-x')
            },
            facebook: {
                wrapper: articleRoot.querySelector('.wrapper-facebook'),
                button: articleRoot.querySelector('.btn-facebook')
            }
        };

        socialActionsEl.querySelectorAll('.wrapper-dynamic-social').forEach((node) => node.remove());

        const availableControls = socialControls && typeof socialControls === 'object'
            ? socialControls
            : this._resolveSocialControlsMap({});

        Object.values(fixedControls).forEach(({ wrapper }) => {
            if (wrapper instanceof HTMLElement) {
                wrapper.style.display = 'none';
            }
        });

        let visibleCount = 0;

        Object.entries(availableControls).forEach(([platformKey, control]) => {
            if (!control || control.enabled === false) return;

            const label = String(control.ariaLabel || control.label || this._humanizeSocialKey(platformKey) || platformKey).trim();
            const tooltipText = String(control.tooltip || label).trim();
            const buttonConfig = {
                ...control,
                hasText: false,
                variant: control.variant || 'tertiary',
                icon: control.icon || platformKey,
                ariaLabel: label
            };

            const fixed = fixedControls[platformKey];
            if (fixed?.wrapper instanceof HTMLElement && fixed?.button instanceof HTMLElement) {
                this._applyButtonConfigToElement(fixed.button, buttonConfig, label);
                fixed.wrapper.style.display = 'inline-flex';

                const tooltipEl = fixed.wrapper.querySelector('ds-tooltip');
                this._setOrRemoveAttribute(tooltipEl, 'text', tooltipText || null);
                this._setOrRemoveAttribute(tooltipEl, 'position', 'bottom');

                visibleCount += 1;
                return;
            }

            const dynamicWrapper = document.createElement('div');
            dynamicWrapper.className = `tooltip-wrapper wrapper-dynamic-social wrapper-${this._slugify(platformKey, 'social')}`;

            const dynamicButton = document.createElement('ds-button');
            dynamicButton.className = `btn-dynamic-social btn-${this._slugify(platformKey, 'social')}`;
            dynamicButton.dataset.socialPlatform = platformKey;
            this._applyButtonConfigToElement(dynamicButton, buttonConfig, label);

            if (dynamicButton.dataset.shareBound !== 'true') {
                dynamicButton.addEventListener('click', () => {
                    articleEl.dispatchEvent(new CustomEvent('ds-article-share', {
                        detail: { platform: platformKey },
                        bubbles: true,
                        composed: true
                    }));
                });
                dynamicButton.dataset.shareBound = 'true';
            }

            const dynamicTooltip = document.createElement('ds-tooltip');
            dynamicTooltip.setAttribute('position', 'bottom');
            this._setOrRemoveAttribute(dynamicTooltip, 'text', tooltipText || null);

            dynamicWrapper.append(dynamicButton, dynamicTooltip);
            socialActionsEl.appendChild(dynamicWrapper);
            visibleCount += 1;
        });

        socialActionsEl.style.display = visibleCount > 0 ? 'flex' : 'none';
    }

    _animateAboutEntryCaseStyleReveal() {
        if (this.state.currentView !== 'about') return;
        if (!this._aboutEntranceAnimationPending) return;

        if (this._shouldReduceMotion()) {
            this._aboutEntranceAnimationPending = false;
            return;
        }

        const resolveAndAnimate = (attempt = 0) => {
            const aboutArticle = this.shadowRoot.getElementById('about-article');
            const breadcrumbTarget = this._shouldAnimateBreadcrumbEntryForView('about')
                ? this._getGlobalBreadcrumbAnimationTarget()
                : null;
            const contentEl = aboutArticle?.shadowRoot?.querySelector('.content-column, .article-body-layout')
                || this.shadowRoot.getElementById('about-view-shell');

            if (!(contentEl instanceof HTMLElement) && attempt < 20) {
                requestAnimationFrame(() => resolveAndAnimate(attempt + 1));
                return;
            }

            if (breadcrumbTarget instanceof HTMLElement) {
                this._runCaseStyleEntryReveal(breadcrumbTarget);
            }

            if (contentEl instanceof HTMLElement) {
                this._runCaseStyleEntryReveal(contentEl);
            }

            this._aboutEntranceAnimationPending = false;
        };

        resolveAndAnimate();
    }

    _ensureAboutSmoothScrolling() {
        if (!this._appLenis) {
            this._ensureAppSmoothScrolling();
        }
        this._aboutLenis = this._appLenis;
    }

    _destroyAboutSmoothScrolling() {
        this._aboutLenis = null;
    }

    _ensureAppSmoothScrolling() {
        if (this._appLenis) return;

        const appScrollRoot = this.shadowRoot?.getElementById('app-scroll-root');
        const appScrollContent = this.shadowRoot?.getElementById('app-scroll-content');
        if (!(appScrollRoot instanceof HTMLElement) || !(appScrollContent instanceof HTMLElement)) return;

        this._appLenis = new Lenis({
            wrapper: appScrollRoot,
            content: appScrollContent,
            // lerp mode normalizes across frame rates, more consistent on WebKit than duration + easing
            lerp: 0.1
        });
        this._registerLenisInstance(this._appLenis);
    }

    _destroyAppSmoothScrolling() {
        if (this._appLenis) {
            this._unregisterLenisInstance(this._appLenis);
            this._appLenis.destroy();
        }

        this._appLenis = null;
        this._aboutLenis = null;
    }

    _getAppScrollRoot() {
        const appScrollRoot = this.shadowRoot?.getElementById('app-scroll-root');
        return appScrollRoot instanceof HTMLElement ? appScrollRoot : null;
    }

    _bindMobileCaseHeaderBorderSync() {
        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return;
        scrollRoot.addEventListener('scroll', this._boundHeaderScrollStateSync, { passive: true });
    }

    _unbindMobileCaseHeaderBorderSync() {
        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return;
        scrollRoot.removeEventListener('scroll', this._boundHeaderScrollStateSync);
    }

    _syncMobileCaseHeaderBorderState() {
        const globalHeaderWrap = this.shadowRoot?.getElementById('global-header-wrap');
        if (!(globalHeaderWrap instanceof HTMLElement)) return;

        const scrollRoot = this._getAppScrollRoot();
        const scrollTop = scrollRoot instanceof HTMLElement ? Number(scrollRoot.scrollTop || 0) : 0;
        const isBorderEnabledView = this.state.currentView === 'case' || this.state.currentView === 'about';
        const shouldShowBorder = isBorderEnabledView
            && scrollTop > 1;

        this._setAttributes(globalHeaderWrap, {
            'data-scrolled': shouldShowBorder ? 'true' : null
        });
    }

    _bindResumeProgressPersistence() {
        if (!this._isResumeToastEnabled()) {
            this._logResumeToast('Persistence binding skipped because feature is disabled');
            return;
        }

        const scrollRoot = this._getAppScrollRoot();
        if (scrollRoot) {
            scrollRoot.addEventListener('scroll', this._boundResumeProgressFromScroll, { passive: true });
        }
        window.addEventListener('beforeunload', this._boundPersistResumeOnUnload);
        this._logResumeToast('Persistence listeners attached', {
            hasScrollRoot: Boolean(scrollRoot)
        });
    }

    _unbindResumeProgressPersistence() {
        const scrollRoot = this._getAppScrollRoot();
        if (scrollRoot) {
            scrollRoot.removeEventListener('scroll', this._boundResumeProgressFromScroll);
        }
        window.removeEventListener('beforeunload', this._boundPersistResumeOnUnload);

        if (this._resumeWriteTimer) {
            clearTimeout(this._resumeWriteTimer);
            this._resumeWriteTimer = null;
        }
    }

    _scheduleResumeProgressPersistence() {
        if (!this._isResumeToastEnabled()) return;
        if (this.state.currentView !== 'case' || !this.state.activeCaseId) return;

        const now = Date.now();
        const elapsed = now - this._resumeWriteLastAt;
        if (elapsed >= RESUME_WRITE_THROTTLE_MS) {
            this._persistResumeProgress();
            return;
        }

        if (this._resumeWriteTimer) return;

        this._resumeWriteTimer = setTimeout(() => {
            this._resumeWriteTimer = null;
            this._persistResumeProgress();
        }, Math.max(0, RESUME_WRITE_THROTTLE_MS - elapsed));
    }

    _persistResumeProgress({ force = false } = {}) {
        if (!this._isResumeToastEnabled()) return;
        if (this.state.currentView !== 'case' || !this.state.activeCaseId) return;

        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return;

        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
        if (!activeCase) return;

        const scrollTop = Math.max(0, Math.round(scrollRoot.scrollTop || 0));
        const caseName = String(this.getLang(activeCase.title) || activeCase.id || '').trim();
        if (!caseName) return;

        this._persistActiveCaseAudioPosition(activeCase.id, { persist: true });
        this._setCaseScrollTop(activeCase.id, scrollTop);

        const snapshot = `${activeCase.id}|${scrollTop}|${caseName}`;
        if (!force && snapshot === this._resumeLastSavedSnapshot) return;

        try {
            localStorage.setItem(RESUME_CASE_ID_STORAGE_KEY, activeCase.id);
            localStorage.setItem(RESUME_CASE_NAME_STORAGE_KEY, caseName);
            localStorage.setItem(RESUME_SCROLL_TOP_STORAGE_KEY, String(scrollTop));
            this._resumeLastSavedSnapshot = snapshot;
            this._resumeWriteLastAt = Date.now();
            this._logResumeToast('Resume progress saved', {
                caseId: activeCase.id,
                caseName,
                scrollTop,
                force
            });
        } catch {
            // Storage can fail in hardened browser modes; resume toast quietly degrades.
            this._logResumeToast('Failed to save resume progress to localStorage');
        }
    }

    _scheduleResumeScrollRestore(caseId, scrollTop) {
        if (!this._isResumeToastEnabled()) return;
        const normalizedCaseId = String(caseId || '').trim();
        const parsedTop = Number.parseInt(String(scrollTop ?? ''), 10);
        if (!normalizedCaseId || Number.isNaN(parsedTop)) return;

        this._pendingResumeRestore = {
            caseId: normalizedCaseId,
            scrollTop: Math.max(0, parsedTop),
            attempts: 0
        };

        this._logResumeToast('Queued scroll restore from toast CTA', {
            caseId: normalizedCaseId,
            scrollTop: Math.max(0, parsedTop)
        });
    }

    _applyPendingResumeScrollRestore() {
        const pending = this._pendingResumeRestore;
        if (!pending) return;
        if (this.state.currentView !== 'case' || this.state.activeCaseId !== pending.caseId) return;

        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return;

        const maxScrollTop = Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight);
        const targetTop = Math.max(0, Math.min(pending.scrollTop, maxScrollTop || pending.scrollTop));
        scrollRoot.scrollTo({ top: targetTop, behavior: 'auto' });

        if (Math.abs(scrollRoot.scrollTop - targetTop) <= 2 || pending.attempts >= 4) {
            this._logResumeToast('Applied queued scroll restore', {
                caseId: pending.caseId,
                targetTop,
                actualTop: Math.round(scrollRoot.scrollTop || 0),
                attempts: pending.attempts
            });
            this._pendingResumeRestore = null;
            return;
        }

        pending.attempts += 1;
        requestAnimationFrame(() => this._applyPendingResumeScrollRestore());
    }

    _scrollAppToTop() {
        this._scrollAppTo(0);
    }

    _scrollAppTo(top, behavior = 'auto') {
        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return;

        scrollRoot.scrollTo({
            top: Math.max(0, Number(top) || 0),
            behavior
        });
    }

    _queueAboutScrollToTop() {
        this._pendingAboutScrollToTop = true;
        this._pendingAboutScrollAttempts = 0;
        requestAnimationFrame(() => this._applyPendingAboutScrollToTop());
    }

    _applyPendingAboutScrollToTop() {
        if (!this._pendingAboutScrollToTop) return;

        if (this.state.currentView !== 'about') {
            if (this._pendingAboutScrollAttempts >= 24) {
                this._pendingAboutScrollToTop = false;
                this._pendingAboutScrollAttempts = 0;
                return;
            }

            this._pendingAboutScrollAttempts += 1;
            requestAnimationFrame(() => this._applyPendingAboutScrollToTop());
            return;
        }

        this._scrollAppWithLenis(0);
        this._pendingAboutScrollToTop = false;
        this._pendingAboutScrollAttempts = 0;
    }

    _readCaseScrollCache() {
        try {
            const rawValue = localStorage.getItem(CASE_SCROLL_CACHE_STORAGE_KEY);
            if (!rawValue) return {};

            const parsedValue = JSON.parse(rawValue);
            return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
        } catch {
            return {};
        }
    }

    _readCaseAudioPositionCache() {
        try {
            const rawValue = localStorage.getItem(CASE_AUDIO_POSITION_CACHE_STORAGE_KEY);
            if (!rawValue) return {};

            const parsedValue = JSON.parse(rawValue);
            if (!parsedValue || typeof parsedValue !== 'object') return {};

            const normalized = {};
            Object.entries(parsedValue).forEach(([caseId, seconds]) => {
                const parsedSeconds = Number.parseFloat(String(seconds));
                if (Number.isFinite(parsedSeconds) && parsedSeconds >= 0) {
                    normalized[String(caseId)] = parsedSeconds;
                }
            });

            return normalized;
        } catch {
            return {};
        }
    }

    _writeCaseAudioPositionCache() {
        try {
            localStorage.setItem(CASE_AUDIO_POSITION_CACHE_STORAGE_KEY, JSON.stringify(this._caseAudioPositionCache || {}));
        } catch {
            this._logResumeToast('Failed to save case audio position cache to localStorage');
        }
    }

    _getCaseAudioPosition(caseId) {
        const normalizedCaseId = String(caseId || '').trim();
        if (!normalizedCaseId) return null;

        const cachedSeconds = this._caseAudioPositionCache?.[normalizedCaseId];
        const parsedSeconds = Number.parseFloat(String(cachedSeconds ?? ''));
        if (!Number.isFinite(parsedSeconds) || parsedSeconds < 0) return null;
        return parsedSeconds;
    }

    _setCaseAudioPosition(caseId, seconds, { persist = true } = {}) {
        const normalizedCaseId = String(caseId || '').trim();
        if (!normalizedCaseId) return;

        const parsedSeconds = Number.parseFloat(String(seconds));
        if (!Number.isFinite(parsedSeconds) || parsedSeconds < 0) return;

        const clampedSeconds = Math.max(0, parsedSeconds);
        const prevSeconds = this._caseAudioPositionCache?.[normalizedCaseId];
        if (Number.isFinite(prevSeconds) && Math.abs(prevSeconds - clampedSeconds) < 0.15) {
            return;
        }

        this._caseAudioPositionCache = {
            ...(this._caseAudioPositionCache || {}),
            [normalizedCaseId]: clampedSeconds
        };

        if (persist) {
            this._writeCaseAudioPositionCache();
        }
    }

    _persistActiveCaseAudioPosition(caseId, { persist = true } = {}) {
        const normalizedCaseId = String(caseId || '').trim();
        if (!normalizedCaseId) return;

        const runtimePlayer = this._caseAudioRuntime?.player;
        if (!(runtimePlayer instanceof HTMLElement)) return;

        const rawTime = runtimePlayer.getAttribute('time');
        const parsedTime = Number.parseFloat(String(rawTime ?? ''));
        if (!Number.isFinite(parsedTime) || parsedTime < 0) return;

        this._setCaseAudioPosition(normalizedCaseId, parsedTime, { persist });
    }

    _writeCaseScrollCache() {
        try {
            localStorage.setItem(CASE_SCROLL_CACHE_STORAGE_KEY, JSON.stringify(this._caseScrollCache || {}));
        } catch {
            this._logResumeToast('Failed to save case scroll cache to localStorage');
        }
    }

    _getCaseScrollTop(caseId) {
        const normalizedCaseId = String(caseId || '').trim();
        if (!normalizedCaseId) return null;

        const cachedTop = this._caseScrollCache?.[normalizedCaseId];
        const parsedTop = Number.parseInt(String(cachedTop ?? ''), 10);
        return Number.isNaN(parsedTop) ? null : Math.max(0, parsedTop);
    }

    _setCaseScrollTop(caseId, scrollTop) {
        const normalizedCaseId = String(caseId || '').trim();
        if (!normalizedCaseId) return;

        const parsedTop = Number.parseInt(String(scrollTop ?? ''), 10);
        if (Number.isNaN(parsedTop)) return;

        this._caseScrollCache = {
            ...(this._caseScrollCache || {}),
            [normalizedCaseId]: Math.max(0, parsedTop)
        };
        this._writeCaseScrollCache();
    }

    _formatCaseNavLabel(title, fallbackLabel) {
        const normalizedTitle = this._normalizeCaseSearchQuery(title);
        if (!normalizedTitle) return fallbackLabel;

        const limit = 14;
        if (normalizedTitle.length <= limit) return normalizedTitle;
        return `${normalizedTitle.slice(0, limit)}...`;
    }

    _buildCaseNavigatorLabels(activeCaseIndex) {
        const prevCase = this._portfolioCases[activeCaseIndex - 1] || null;
        const nextCase = this._portfolioCases[activeCaseIndex + 1] || null;

        const prevCaseTitle = this._isCaseLocked(prevCase) ? '' : prevCase?.title;
        const nextCaseTitle = this._isCaseLocked(nextCase) ? '' : nextCase?.title;

        const resolvedPrevTitle = this.getLang(prevCaseTitle) || '';
        const resolvedNextTitle = this.getLang(nextCaseTitle) || '';
        const basePrevLabel = t('case_nav_prev');
        const baseNextLabel = t('case_nav_next');

        return {
            labelPrev: basePrevLabel,
            labelNext: baseNextLabel,
            tooltipPrev: resolvedPrevTitle ? `${basePrevLabel}: ${resolvedPrevTitle}` : t('case_nav_prev_locked'),
            tooltipNext: resolvedNextTitle ? `${baseNextLabel}: ${resolvedNextTitle}` : t('case_nav_next_locked')
        };
    }

    _buildCaseNavigatorSearchText(caseData = {}) {
        const summaryText = this._extractPlainTextFromHtml(this.getLang(caseData.summary) || '');
        const bodyText = this._extractPlainTextFromHtml(this.getLang(caseData.desc) || '');
        const recruiterBodyText = this._extractPlainTextFromHtml(this.getLang(caseData.descRecruiter) || '');

        return [summaryText, bodyText, recruiterBodyText]
            .map((value) => String(value || '').trim())
            .filter(Boolean)
            .join(' ');
    }

    _getCaseNavigatorResults() {
        const activeLang = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        const lockSignature = this._portfolioCases
            .map((caseData) => `${caseData.id}:${this._isCaseLocked(caseData) ? 1 : 0}`)
            .join('|');

        if (
            this._caseNavigatorResultsCacheSource === this._portfolioCases
            && this._caseNavigatorResultsCacheLang === activeLang
            && this._caseNavigatorResultsCacheLockSignature === lockSignature
        ) {
            return this._caseNavigatorResultsCache;
        }

        const caseResults = this._portfolioCases
            .filter((caseData) => this._resolveVisibilityFlags(caseData?.visibility).web !== false)
            .filter((caseData) => !this._isCaseLocked(caseData))
            .map((caseData, index) => ({
                id: caseData.id,
                index,
                title: this.getLang(caseData.title) || caseData.id || '',
                snippet: '',
                searchableText: this._buildCaseNavigatorSearchText(caseData),
                searchInTitle: false
            }));

        this._caseNavigatorResultsCache = activeLang === DEFAULT_LOCALE
            ? [
                {
                    id: SEARCH_RESULT_MAIN_VIEW_ID,
                    index: -1,
                    title: t('search_main_view_title'),
                    snippet: t('search_main_view_snippet'),
                    searchInTitle: true,
                    searchableText: [
                        t('search_main_view_title'),
                        t('search_main_view_snippet'),
                        t('nav_home'),
                        t('search_case_studies_label')
                    ].join(' ')
                },
                ...caseResults
            ]
            : caseResults;

        this._caseNavigatorResultsCacheSource = this._portfolioCases;
        this._caseNavigatorResultsCacheLang = activeLang;
        this._caseNavigatorResultsCacheLockSignature = lockSignature;

        return this._caseNavigatorResultsCache;
    }

    _queueCaseScrollRestore(caseId) {
        const normalizedCaseId = String(caseId || '').trim();
        if (!normalizedCaseId) return;

        const scrollTop = this._getCaseScrollTop(normalizedCaseId);
        this._caseScrollRestorePending = scrollTop === null ? null : { caseId: normalizedCaseId, scrollTop };
    }

    _applyPendingCaseScrollRestore(caseId) {
        const pending = this._caseScrollRestorePending;
        if (!pending || pending.caseId !== caseId) return false;

        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) return false;

        const maxScrollTop = Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight);
        const targetTop = Math.max(0, Math.min(pending.scrollTop, maxScrollTop || pending.scrollTop));
        scrollRoot.scrollTo({ top: targetTop, behavior: 'auto' });
        this._caseScrollRestorePending = null;
        return true;
    }

    _normalizeCaseSearchQuery(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    _clearCaseSearchHighlight() {
        this._caseSearchHighlight = null;

        const caseView = this.shadowRoot.getElementById('case-view');
        const highlightedNodes = caseView?.querySelectorAll('[data-case-search-highlight="true"]') || [];

        highlightedNodes.forEach((node) => {
            const parent = node.parentNode;
            const replacement = document.createTextNode(node.textContent || '');
            if (parent) {
                parent.replaceChild(replacement, node);
                if (typeof parent.normalize === 'function') {
                    parent.normalize();
                }
            }
        });
    }

    _highlightCaseSearchQuery(caseView, caseId) {
        const highlight = this._caseSearchHighlight;
        if (!highlight || highlight.caseId !== caseId) return;

        const query = this._normalizeCaseSearchQuery(highlight.query);
        if (!query) return;

        requestAnimationFrame(() => {
            if (this.state.currentView !== 'case' || this.state.activeCaseId !== caseId) {
                return;
            }

            const currentCaseView = this.shadowRoot.getElementById('case-view');
            if (currentCaseView !== caseView) return;

            this._clearCaseSearchHighlight();

            const queryLower = query.toLowerCase();
            const walker = document.createTreeWalker(caseView, NodeFilter.SHOW_TEXT, {
                acceptNode: (node) => {
                    const text = String(node?.nodeValue || '');
                    if (!text.trim()) return NodeFilter.FILTER_REJECT;

                    const parentElement = node.parentElement;
                    if (!parentElement) return NodeFilter.FILTER_REJECT;
                    if (parentElement.closest('ds-thumbnail, ds-summary, ds-audio-player, ds-case-navigator')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (!text.toLowerCase().includes(queryLower)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            const matchNode = walker.nextNode();
            if (!(matchNode instanceof Text)) return;

            const text = String(matchNode.nodeValue || '');
            const matchIndex = text.toLowerCase().indexOf(queryLower);
            if (matchIndex < 0) return;

            const matchedTextNode = matchNode.splitText(matchIndex);
            matchedTextNode.splitText(query.length);

            const mark = document.createElement('mark');
            mark.dataset.caseSearchHighlight = 'true';
            mark.style.background = 'var(--color-search-highlight, rgba(255, 214, 102, 0.75))';
            mark.style.color = 'inherit';
            mark.style.padding = '0 0.08em';
            mark.style.borderRadius = '0.18em';
            mark.textContent = matchedTextNode.nodeValue || '';

            matchedTextNode.parentNode?.replaceChild(mark, matchedTextNode);

            const scrollRoot = this._getAppScrollRoot();
            if (scrollRoot instanceof HTMLElement) {
                const markRect = mark.getBoundingClientRect();
                const containerRect = scrollRoot.getBoundingClientRect();
                const nextTop = scrollRoot.scrollTop + (markRect.top - containerRect.top) - 96;
                this._scrollAppTo(nextTop, this._shouldReduceMotion() ? 'auto' : 'smooth');
            }
        });
    }

    // MARK: CASE VIEW TOC AND NAVIGATOR
    // Configures TOC and navigator after case content is projected into ds-article slots.
    _syncCaseViewControls(activeCaseIndex) {
        requestAnimationFrame(() => {
            const caseView = this.shadowRoot.getElementById('case-view');
            const navigatorLabels = this._buildCaseNavigatorLabels(activeCaseIndex);
            const scrollRoot = this._getAppScrollRoot();
            const articleEl = caseView?.shadowRoot?.querySelector('ds-article');
            const tocEl = articleEl?.shadowRoot?.querySelector('.article-toc, ds-toc');

            if (!tocEl && typeof this._caseTocActiveSyncCleanup === 'function') {
                this._caseTocActiveSyncCleanup();
                this._caseTocActiveSyncCleanup = null;
            }

            if (tocEl && scrollRoot) {
                const runtimeDirection = this.state.direction || document.documentElement.getAttribute('dir') || 'ltr';
                tocEl.setAttribute('dir', runtimeDirection);

                const forceMinimapLineAlignment = () => {
                    const alignItemsValue = runtimeDirection === 'rtl' ? 'flex-end' : 'flex-end';
                    const wrapperEl = tocEl.shadowRoot?.querySelector('.toc-wrapper');
                    const stripEl = tocEl.shadowRoot?.querySelector('.minimap-strip');
                    const lineEls = tocEl.shadowRoot?.querySelectorAll('.minimap-line') || [];

                    if (wrapperEl instanceof HTMLElement) {
                        wrapperEl.style.alignItems = alignItemsValue;
                    }

                    if (stripEl instanceof HTMLElement) {
                        stripEl.style.alignItems = alignItemsValue;
                    }

                    lineEls.forEach((lineEl) => {
                        if (!(lineEl instanceof HTMLElement)) return;
                        lineEl.style.alignSelf = alignItemsValue;
                        if (runtimeDirection === 'rtl') {
                            lineEl.style.marginLeft = '0';
                            lineEl.style.marginRight = 'auto';
                            lineEl.style.marginInlineStart = '';
                            lineEl.style.marginInlineEnd = '';
                        } else {
                            lineEl.style.marginLeft = 'auto';
                            lineEl.style.marginRight = '0';
                            lineEl.style.marginInlineStart = '';
                            lineEl.style.marginInlineEnd = '';
                        }
                    });

                    console.debug('[rtl][toc-force-align]', JSON.stringify({
                        runtimeDirection,
                        alignItemsValue,
                        lineCount: lineEls.length
                    }));
                };

                const tocWrapperEl = tocEl.shadowRoot?.querySelector('.toc-wrapper');
                const minimapStripEl = tocEl.shadowRoot?.querySelector('.minimap-strip');
                const wrapperAlign = tocWrapperEl ? getComputedStyle(tocWrapperEl).alignItems : null;
                const stripAlign = minimapStripEl ? getComputedStyle(minimapStripEl).alignItems : null;

                const tocSyncDebug = {
                    stateDirection: this.state.direction || null,
                    runtimeDirection,
                    appHostDir: this.getAttribute('dir') || null,
                    caseViewDir: caseView.getAttribute('dir') || null,
                    articleDir: articleEl?.getAttribute('dir') || null,
                    tocDir: tocEl.getAttribute('dir') || null,
                    wrapperAlign,
                    stripAlign,
                    headingCount: caseView.querySelectorAll('h1, h2, h3, h4').length
                };

                console.debug('[rtl][toc-sync]', JSON.stringify(tocSyncDebug));

                const expectedAlign = runtimeDirection === 'rtl' ? 'flex-end' : 'flex-end';
                if (tocSyncDebug.tocDir !== runtimeDirection
                    || tocSyncDebug.wrapperAlign !== expectedAlign
                    || tocSyncDebug.stripAlign !== expectedAlign) {
                    console.warn('[rtl][toc-sync][mismatch]', JSON.stringify({
                        ...tocSyncDebug,
                        expectedAlign
                    }));
                }

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
                forceMinimapLineAlignment();
                requestAnimationFrame(() => forceMinimapLineAlignment());
                tocEl.removeAttribute('opened');
                this._bindCaseTocSelection(tocEl, caseView);
                this._bindCaseTocActiveSync(tocEl, caseView, scrollRoot);
                this._lockControlScroll(tocEl);
            }

            const navigatorEl = caseView?.querySelector('ds-case-navigator[slot="navigator"]');
            if (navigatorEl) {
                navigatorEl.setAttribute('current-index', String(Math.max(0, activeCaseIndex)));
                navigatorEl.setAttribute('total-cases', String(this._portfolioCases.length));
                navigatorEl.setAttribute('label-prev', navigatorLabels.labelPrev);
                navigatorEl.setAttribute('label-next', navigatorLabels.labelNext);
                navigatorEl.setAttribute('tooltip-prev', navigatorLabels.tooltipPrev);
                navigatorEl.setAttribute('tooltip-next', navigatorLabels.tooltipNext);
                navigatorEl.results = this._getCaseNavigatorResults();
                this._lockControlScroll(navigatorEl);
            }

            const activeCase = this._portfolioCases[activeCaseIndex];
            if (activeCase) {
                const hasPendingRestore = this._applyPendingCaseScrollRestore(activeCase.id);
                const isFirstSyncForCase = this._caseViewLastSyncedCaseId !== activeCase.id;

                if (!hasPendingRestore && isFirstSyncForCase) {
                    this._scrollAppToTop();
                }

                this._caseViewLastSyncedCaseId = activeCase.id;
                this._highlightCaseSearchQuery(caseView, activeCase.id);
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

            const scrollRoot = this._getAppScrollRoot();
            if (selectedId === 'scroll-top') {
                if (scrollRoot) {
                    this._scrollAppToTop();
                }
                if (typeof tocEl._setActiveHeading === 'function') {
                    tocEl._setActiveHeading('scroll-top');
                }
                return;
            }

            const heading = Array.from(caseView.querySelectorAll('h1, h2, h3, h4')).find((node) => node.id === selectedId);
            if (heading && scrollRoot) {
                const headingRect = heading.getBoundingClientRect();
                const containerRect = scrollRoot.getBoundingClientRect();
                const nextTop = scrollRoot.scrollTop + (headingRect.top - containerRect.top) - 96;
                this._scrollAppTo(nextTop, 'smooth');
            }

            if (typeof tocEl._setActiveHeading === 'function') {
                tocEl._setActiveHeading(selectedId);
            }
        });

        tocEl.dataset.caseTocBound = 'true';
    }

    // Keeps TOC active/minimap highlight in sync with headings while case container scrolls.
    _bindCaseTocActiveSync(tocEl, caseView, scrollRoot) {
        if (!tocEl || !caseView || !scrollRoot || tocEl.dataset.caseTocActiveSyncBound === 'true') {
            return;
        }

        if (typeof this._caseTocActiveSyncCleanup === 'function') {
            this._caseTocActiveSyncCleanup();
            this._caseTocActiveSyncCleanup = null;
        }

        const syncActiveFromScroll = () => {
            if (scrollRoot.scrollTop <= 8) {
                if (typeof tocEl._setActiveHeading === 'function') {
                    tocEl._setActiveHeading('scroll-top');
                }
                return;
            }

            const headingIds = Array.isArray(tocEl.items) ? tocEl.items.map((item) => item.id) : [];
            const headings = headingIds
                .map((id) => caseView.querySelector(`#${CSS.escape(id)}`))
                .filter(Boolean);

            if (headings.length === 0) {
                return;
            }

            const atBottom = (scrollRoot.scrollTop + scrollRoot.clientHeight) >= (scrollRoot.scrollHeight - 6);
            if (atBottom) {
                const lastHeading = headings[headings.length - 1];
                if (lastHeading && typeof tocEl._setActiveHeading === 'function') {
                    tocEl._setActiveHeading(lastHeading.id);
                }
                return;
            }

            const containerRect = scrollRoot.getBoundingClientRect();
            const activationY = containerRect.top + 120;
            // Pick the heading closest to the activation line, but prefer passed headings.
            let activeHeading = headings[0];
            let closestPassedDistance = Number.POSITIVE_INFINITY;
            let closestUpcomingDistance = Number.POSITIVE_INFINITY;
            let closestUpcomingHeading = headings[0];

            for (const heading of headings) {
                const delta = heading.getBoundingClientRect().top - activationY;
                if (delta <= 0) {
                    const passedDistance = Math.abs(delta);
                    if (passedDistance <= closestPassedDistance) {
                        closestPassedDistance = passedDistance;
                        activeHeading = heading;
                    }
                } else if (delta < closestUpcomingDistance) {
                    closestUpcomingDistance = delta;
                    closestUpcomingHeading = heading;
                }
            }

            if (!activeHeading && closestUpcomingHeading) {
                activeHeading = closestUpcomingHeading;
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

        scrollRoot.addEventListener('scroll', onContainerScroll, { passive: true });
        this._caseTocActiveSyncCleanup = () => {
            scrollRoot.removeEventListener('scroll', onContainerScroll);
        };
        requestAnimationFrame(syncActiveFromScroll);
        tocEl.dataset.caseTocActiveSyncBound = 'true';
    }

    // MARK: CASE VIEW ACTIONS AND SHARING
    // Handles article CTA actions (video playback, repository, and live demo links).
    _handleArticleAction(action, caseData) {
        if (!caseData) return;

        const caseActions = caseData.actions && typeof caseData.actions === 'object' ? caseData.actions : {};
        const resolveActionConfig = (actionKey, legacyActionKey = '') => {
            const candidate = caseActions[actionKey] ?? caseActions[legacyActionKey] ?? {};
            const actionConfig = candidate && typeof candidate === 'object'
                ? candidate
                : {};

            return {
                enabled: actionConfig.enabled !== false,
                url: String(this.getLang(actionConfig.url) || '').trim(),
                videoSrc: actionConfig.videoSrc ?? actionConfig['video-src']
            };
        };

        const primaryAction = resolveActionConfig('primary');
        const secondaryAction = resolveActionConfig('secondary', 'secondary1');
        const tertiaryAction = resolveActionConfig('tertiary', 'secondary2');

        const hasVideo = this._hasLocalizedValue(primaryAction.videoSrc || this._resolveCasePrimaryVideoProp(caseData));
        const hasRepo = this._hasLocalizedValue(this._resolveCaseSecondaryUrlProp(caseData));
        const hasDemo = this._hasLocalizedValue(this._resolveCaseTertiaryUrlProp(caseData));

        // Handles primary action branch (video or live URL fallback).
        if (action === 'primary') {
            if (!primaryAction.enabled) return;

            if (primaryAction.url) {
                window.open(primaryAction.url, '_blank', 'noopener,noreferrer');
                return;
            }

            if (hasVideo) {
                this._transitionToView({ currentView: 'player', activeCaseId: caseData.id });
                return;
            }

            if (hasDemo) {
                window.open(this.getLang(this._resolveCaseTertiaryUrlProp(caseData)), '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Opens repository URL on secondary action when available.
        if (action === 'secondary1') {
            if (!secondaryAction.enabled) return;

            if (secondaryAction.url) {
                window.open(secondaryAction.url, '_blank', 'noopener,noreferrer');
                return;
            }

            if (!hasRepo) return;
            window.open(this.getLang(this._resolveCaseSecondaryUrlProp(caseData)), '_blank', 'noopener,noreferrer');
            return;
        }

        // Opens live URL on tertiary action when available.
        if (action === 'secondary2') {
            if (!tertiaryAction.enabled) return;

            if (tertiaryAction.url) {
                window.open(tertiaryAction.url, '_blank', 'noopener,noreferrer');
                return;
            }

            if (!hasDemo) return;
            window.open(this.getLang(this._resolveCaseTertiaryUrlProp(caseData)), '_blank', 'noopener,noreferrer');
        }
    }

    // Builds and dispatches sharing actions for native share and social providers.
    _handleArticleShare(platform, caseData) {
        if (!caseData) return;
        const caseSocial = caseData.social && typeof caseData.social === 'object' ? caseData.social : {};
        const socialLinks = caseSocial.links && typeof caseSocial.links === 'object' ? caseSocial.links : {};
        const platformConfig = caseSocial[platform] && typeof caseSocial[platform] === 'object' ? caseSocial[platform] : null;

        const directPlatformUrl = String(
            this.getLang(socialLinks[platform])
            || this.getLang(platformConfig?.url)
            || ''
        ).trim();
        if (directPlatformUrl) {
            window.open(directPlatformUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // Computes canonical share URL for the active case route.
        const caseUrl = this._buildCaseUrl(caseData, this.state.lang, { includePlayerView: false });
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

    // MARK: OVERLAYS AND TOAST
    // Synchronizes toast UI with current state.
    renderOverlays() {
        // Resolves toast component used for resume-reading prompts.
        const toast = this.shadowRoot.getElementById('app-toast');
        const toastEl = this.shadowRoot.getElementById('app-toast-el');
        if (!(toast instanceof HTMLElement) || !(toastEl instanceof HTMLElement)) return;
        this._syncToastTopOffset();
        const topOffset = this._resolveToastTopOffset();
        if (!this._isResumeToastEnabled()) {
            toast.setAttribute('visible', 'false');
            toast.setAttribute('aria-hidden', 'true');
            toast.removeAttribute('data-exit-animating');
            toastEl.setAttribute('visible', 'false');
            toastEl.setAttribute('aria-hidden', 'true');
            toastEl.innerHTML = '';
            this._lastRenderedToastVisibility = false;
            return;
        }

        toast.setAttribute('visible', this.state.toast.visible.toString());
        toast.setAttribute('aria-hidden', this.state.toast.visible ? 'false' : 'true');
        toastEl.setAttribute('managed-dismiss', 'host');
        toastEl.setAttribute('visible', this.state.toast.visible.toString());
        toastEl.setAttribute('aria-hidden', this.state.toast.visible ? 'false' : 'true');
        toastEl.setAttribute('show-close', this.state.toast.showClose ? 'true' : 'false');
        toastEl.setAttribute('show-never-show', this.state.toast.showNeverShow ? 'true' : 'false');
        toastEl.setAttribute('label-close', t('toast_label_close'));
        toastEl.setAttribute('label-never-show', t('toast_label_never_show'));
        toastEl.innerHTML = this.state.toast.content;
        toastEl.setAttribute('aria-label', this.state.toast.content.replace(/<[^>]*>?/gm, ''));

        if (this._lastRenderedToastVisibility !== this.state.toast.visible) {
            this._logResumeToast('Toast visibility changed', {
                visible: this.state.toast.visible,
                caseId: this.state.toast.caseId,
                scrollTop: this.state.toast.scrollTop,
                topOffset
            });

            if (this.state.toast.visible) {
                this._runToastEntranceAnimation(toast);
            }

            this._lastRenderedToastVisibility = this.state.toast.visible;
        }

        if (this.state.toast.visible) {
            const rect = toast.getBoundingClientRect();
            this._logResumeToast('Toast host bounds', {
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            });
        }
    }

    // Updates header visibility and active-case label based on current view state.
    updateHeader() {
        const homeView = this.shadowRoot.getElementById('home-view');
        const globalHeaderWrap = this.shadowRoot.getElementById('global-header-wrap');
        const globalHeader = this.shadowRoot.getElementById('global-header');
        if (!(globalHeader instanceof HTMLElement)) return;
        const canShowLanguageMenu = this._canShowLanguageMenu();

        this._configureGlobalHeaderHitboxPassThrough();
        this._setAttributes(globalHeaderWrap, {
            'data-mobile-breakpoint': this._isMobileBreakpoint() ? 'true' : null,
            'data-current-view': this.state.currentView || 'home'
        });
        this._setAttributes(globalHeader, {
            'data-mobile-breakpoint': this._isMobileBreakpoint() ? 'true' : null
        });

        const fallbackHomeBreadcrumb = homeView?.showBreadcrumb ? 'true' : 'false';
        const currentView = this.state.currentView;
        const isPlayerUiHidden = this._resolveEffectivePlayerUiHidden();
        const isMobileLayout = this._isMobileBreakpoint();
        const hideGlobalHeader = false;
        let fallbackVisibility = {
            'show-breadcrumb': 'true',
            'show-language-menu': isPlayerUiHidden || !canShowLanguageMenu ? 'false' : 'true',
            'show-navigation-region': isPlayerUiHidden ? 'false' : 'true',
            'show-about': currentView === 'about' ? 'false' : 'true'
        };

        if (currentView === 'home') {
            fallbackVisibility = {
                'show-breadcrumb': fallbackHomeBreadcrumb,
                'show-language-menu': canShowLanguageMenu ? 'true' : 'false',
                'show-navigation-region': 'true',
                'show-about': 'true'
            };
        }

        const headerContract = this._resolveHeaderContract();
        const resolvedShowBreadcrumb = resolveHeaderVisibilityAttributeValue(
            headerContract.visibility[HEADER_VISIBILITY_CONFIG_KEYS.showBreadcrumb],
            fallbackVisibility[HEADER_VISIBILITY_CONFIG_KEYS.showBreadcrumb],
            'true'
        );

        if (resolvedShowBreadcrumb !== 'false') {
            const breadcrumbItems = this._buildGlobalHeaderBreadcrumbItems();
            globalHeader.breadcrumbItems = breadcrumbItems;
        }

        if (globalHeaderWrap instanceof HTMLElement) {
            globalHeaderWrap.hidden = hideGlobalHeader;
            globalHeaderWrap.style.display = hideGlobalHeader ? 'none' : '';
        }

        this._applyHeaderContractToElement(globalHeader, { fallbackVisibility });
        if (!canShowLanguageMenu) {
            globalHeader.showLanguageMenu = false;
        }
        this._applyGlobalHeaderReturnOnlyMode(globalHeader, isPlayerUiHidden || isMobileLayout);
        this._applyBreadcrumbReturnTooltipKeyLabel(globalHeader);
        this._syncEmbeddedHeadersVisibility();

        this._logHeaderStability('Header contract applied for active view', {
            activeView: currentView,
            globalWrap: globalHeaderWrap instanceof HTMLElement ? {
                hidden: globalHeaderWrap.hidden,
                display: globalHeaderWrap.style.display
            } : null,
            global: this._collectHeaderState(globalHeader),
            home: this._collectHeaderState(homeView)
        });

        if (this.getAttribute('data-header-ready') !== 'true') {
            this.setAttribute('data-header-ready', 'true');
        }
    }

    // MARK: EVENTS CROSS VIEW BINDINGS
    // Wires shared events that bridge Home, Case, Player, About, and global shell state.
    _handleCaseVideoBreadcrumbSelection(parentCrumbId, selectedCaseId) {
        const currentView = parentCrumbId === 'case' ? 'case' : parentCrumbId === 'video' ? 'player' : '';
        if (!currentView) return false;

        const normalizedSelectedCaseId = String(selectedCaseId || '').trim();
        if (!normalizedSelectedCaseId) {
            return false;
        }

        const matchedCase = this._portfolioCases.find((item) => String(item.id) === normalizedSelectedCaseId);
        if (!matchedCase) {
            return false;
        }

        // Never allow protected cases to jump straight into player from breadcrumb menus.
        // Route through _openCaseById so unlock checks/prompts are consistently enforced.
        if (this._isCaseLocked(matchedCase)) {
            this._openCaseById(matchedCase.id);
            return true;
        }

        this._clearCaseSearchHighlight();
        this._transitionToView({ currentView, activeCaseId: matchedCase.id });
        return true;
    }

    _bindNavigationMenuListeners(targetElement) {
        if (!(targetElement instanceof HTMLElement)) return;

        // Sync after menu open/close transitions so ui-hidden waits until menus are closed.
        const queueMenuSync = () => {
            this._queueContextualMenuVisibilitySync();
        };

        targetElement.addEventListener('ds-navigation-menu-accessibility', queueMenuSync);
        targetElement.addEventListener('ds-navigation-menu-language', queueMenuSync);
        targetElement.addEventListener('ds-close', queueMenuSync);

        targetElement.addEventListener('ds-navigation-menu-language-select', queueMenuSync);
        targetElement.addEventListener('ds-navigation-menu-about', queueMenuSync);
        targetElement.addEventListener('ds-navigation-menu-accessibility-select', queueMenuSync);
    }

    _handleNavigationAboutRequest() {
        if (this.state.currentView !== 'about') {
            this._transitionToView({ currentView: 'about' });
        }

        this._queueAboutScrollToTop();
    }

    // Registers all event listeners for case navigation, contextual menus, toast, and keyboard controls.
    _addEventListeners() {
        // Resolves frequently used component references for event binding.
        const caseView = this.shadowRoot.getElementById('case-view');
        // Resolves toast wrapper and component elements.
        const toastHost = this.shadowRoot.getElementById('app-toast');
        const toast = this.shadowRoot.getElementById('app-toast-el');

        // Handles case selection emitted from HomeView/gallery interactions.
        this.shadowRoot.addEventListener('ds-case-select', (e) => {
            if (e.target?.tagName === 'DS-CASE-NAVIGATOR') {
                return;
            }

            // Resolves case identifier from detail payload, target dataset, or composed path datasets.
            const resolvedCaseId = this._resolveCaseIdFromEvent(e);

            if (resolvedCaseId) {
                this._captureHomeGalleryOffset();
                this._captureHomeTransitionSourceHint(e, resolvedCaseId);
                this._openCaseById(resolvedCaseId);
                return;
            }
        });

        // Opens matching case from navigator autocomplete selections.
        this.shadowRoot.addEventListener('ds-search-select', (e) => {
            const resolvedCaseId = this._resolveCaseIdFromEvent(e);
            if (!resolvedCaseId) return;

            if (resolvedCaseId === SEARCH_RESULT_MAIN_VIEW_ID) {
                this._caseNavigatorSearchQuery = '';
                this._clearCaseSearchHighlight();
                this._transitionToView({ currentView: 'home', activeCaseId: null });
                return;
            }

            const selectedQuery = this._normalizeCaseSearchQuery(e.target?.value);
            if (selectedQuery) {
                this._caseNavigatorSearchQuery = selectedQuery;
                this._caseSearchHighlight = { caseId: resolvedCaseId, query: selectedQuery };
                this._ignoreNextEmptyCaseNavigatorSearchInput = true;
            }
            this._captureHomeGalleryOffset();
            this._captureHomeTransitionSourceHint(e, resolvedCaseId);
            this._openCaseById(resolvedCaseId, { searchQuery: this._caseNavigatorSearchQuery });
        });

        this.shadowRoot.addEventListener('ds-search-input', (e) => {
            const nextQuery = this._normalizeCaseSearchQuery(e.detail?.value);
            if (!nextQuery && this._ignoreNextEmptyCaseNavigatorSearchInput) {
                this._ignoreNextEmptyCaseNavigatorSearchInput = false;
                return;
            }

            if (nextQuery === this._caseNavigatorSearchQuery) return;

            this._caseNavigatorSearchQuery = nextQuery;
            if (!nextQuery || (this._caseSearchHighlight?.query && this._normalizeCaseSearchQuery(this._caseSearchHighlight.query) !== nextQuery)) {
                this._clearCaseSearchHighlight();
            }
        });

        this.shadowRoot.addEventListener('ds-case-prev', () => {
            this._openAdjacentCase(-1);
        });

        this.shadowRoot.addEventListener('ds-case-next', () => {
            this._openAdjacentCase(1);
        });

        // Route in-page hash anchors through the app scroll container (for footnotes/backrefs).
        this.shadowRoot.addEventListener('click', (event) => {
            this._handleCaseHashAnchorNavigation(event);
        });

        // Handle navigation menu events from any header instance (global, case, or player).
        this.shadowRoot.addEventListener('ds-navigation-menu-language-select', (event) => {
            const nextLang = event.detail?.id;
            if (!nextLang) return;
            const normalizedNextLang = resolveLocaleCode(String(nextLang || '').trim().toLowerCase(), DEFAULT_LOCALE);
            if (!normalizedNextLang || normalizedNextLang === this.state.lang) return;
            this._setLanguage(normalizedNextLang);
            this._queueContextualMenuVisibilitySync();
        });

        this.shadowRoot.addEventListener('ds-navigation-menu-accessibility-select', (event) => {
            this._applyA11ySelectionByItem(event.detail?.item);
            this._queueContextualMenuVisibilitySync();
        });

        this.shadowRoot.addEventListener('ds-navigation-menu-about', () => {
            this._handleNavigationAboutRequest();
            this._queueContextualMenuVisibilitySync();
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

            // Persist current drag offset as early as possible before any click-based selection opens a case.
            this._captureHomeGalleryOffset();
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
                const tappedCaseId = this._homeVisibleCases[tappedIndex]?.id;
                if (tappedCaseId) {
                    this._captureHomeGalleryOffset();
                    this._captureHomeTransitionSourceHint(e, tappedCaseId, tappedIndex);
                }
                this._openCaseByIndex(tappedIndex);
            }
        });

        // Fallback: open case route when a gallery card is clicked even if ds-case-select target payload is missing.
        this.shadowRoot.addEventListener('click', (e) => {
            if (this.state.currentView !== 'home') return;

            const indexFromCard = this._resolveGalleryIndexFromEvent(e);
            const clickedCaseId = Number.isInteger(indexFromCard) ? this._homeVisibleCases[indexFromCard]?.id : null;
            if (clickedCaseId) {
                this._captureHomeGalleryOffset();
                this._captureHomeTransitionSourceHint(e, clickedCaseId, indexFromCard);
            }
            this._openCaseByIndex(indexFromCard);
        });

        // Handles CaseView breadcrumb/home events to return to gallery route.
        caseView.addEventListener('ds-breadcrumb-home', () => {
            console.debug('[app-shell][nav] breadcrumb-home', {
                source: 'case-view',
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });
            this._transitionToView({ currentView: 'home', activeCaseId: null });
        });
        caseView.addEventListener('ds-breadcrumb-return', () => {
            console.debug('[app-shell][nav] breadcrumb-return', {
                source: 'case-view',
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });
            this._handleReturnNavigation({ source: 'case-view' });
        });
        caseView.addEventListener('ds-breadcrumb-select', (event) => {
            const parentCrumbId = event.detail?.parentItem?.id;
            const selectedCaseId = event.detail?.selectedMenuItem?.id || event.detail?.id;
            console.debug('[app-shell][nav] breadcrumb-select', {
                source: 'case-view',
                parentCrumbId,
                selectedCaseId,
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });
            this._handleCaseVideoBreadcrumbSelection(parentCrumbId, selectedCaseId);
        });

        const homeView = this.shadowRoot.getElementById('home-view');
        // Handles article actions and share events bubbling from CaseView.
        caseView.addEventListener('ds-article-action', (event) => {
            const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
            this._handleArticleAction(event.detail?.action, activeCase);
        });

        caseView.addEventListener('ds-article-share', (event) => {
            const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId);
            this._handleArticleShare(event.detail?.platform, activeCase);
        });

        const aboutArticle = this.shadowRoot.getElementById('about-article');
        if (aboutArticle) {
            aboutArticle.addEventListener('ds-article-action', (event) => {
                const action = String(event.detail?.action || '').trim();
                if (!action) return;

                const urlByAction = {
                    primary: aboutArticle.dataset.aboutPrimaryUrl || '',
                    secondary1: aboutArticle.dataset.aboutSecondary1Url || '',
                    secondary2: aboutArticle.dataset.aboutSecondary2Url || ''
                };

                const targetUrl = urlByAction[action];
                if (!targetUrl) return;
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
            });

            aboutArticle.addEventListener('ds-article-share', (event) => {
                const platform = String(event.detail?.platform || '').trim();
                if (!platform) return;

                let platformUrlByKey = {};
                try {
                    platformUrlByKey = JSON.parse(aboutArticle.dataset.aboutSocialLinks || '{}');
                } catch {
                    platformUrlByKey = {};
                }

                // Backward compatibility for older about payload snapshots.
                if (!platformUrlByKey.linkedin && aboutArticle.dataset.aboutLinkedinUrl) {
                    platformUrlByKey.linkedin = aboutArticle.dataset.aboutLinkedinUrl;
                }
                if (!platformUrlByKey.x && aboutArticle.dataset.aboutXUrl) {
                    platformUrlByKey.x = aboutArticle.dataset.aboutXUrl;
                }
                if (!platformUrlByKey.facebook && aboutArticle.dataset.aboutFacebookUrl) {
                    platformUrlByKey.facebook = aboutArticle.dataset.aboutFacebookUrl;
                }

                if (platform === 'native') {
                    const shareTitle = aboutArticle.getAttribute('title-text') || 'About Me';
                    const shareText = aboutArticle.getAttribute('subtitle-text') || '';
                    if (navigator.share) {
                        navigator.share({
                            title: shareTitle,
                            text: shareText,
                            url: window.location.href
                        }).catch(() => {});
                    }
                    return;
                }

                const targetUrl = String(platformUrlByKey?.[platform] || '').trim();
                if (!targetUrl) return;
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
            });

        }
        // Restores case view from toast CTA when resume context exists.
        toast.addEventListener('ds-toast-click', () => {
            if (!this._isResumeToastEnabled()) return;

            if (this.state.toast.caseId) {
                this._clearResumeToastTimers();
                this._logResumeToast('Toast CTA clicked', {
                    caseId: this.state.toast.caseId,
                    scrollTop: this.state.toast.scrollTop
                });
                this._scheduleResumeScrollRestore(this.state.toast.caseId, this.state.toast.scrollTop);
                this._transitionToView({ 
                    currentView: 'case', 
                    activeCaseId: this.state.toast.caseId,
                    toast: { visible: false, content: '', caseId: null, scrollTop: 0 }
                });
            }
        });

        toast.addEventListener('ds-toast-close', () => {
            this._traceResumeToast('Received ds-toast-close event', {
                stateVisible: this.state.toast.visible,
                snapshot: this._snapshotToastHost(toastHost)
            });
            if (!this._isResumeToastEnabled()) return;
            this._clearResumeToastTimers();
            this._logResumeToast('Toast close clicked');
            this._hideResumeToastAnimated('close-button');
        });

        toast.addEventListener('ds-toast-never-show', () => {
            this._traceResumeToast('Received ds-toast-never-show event', {
                stateVisible: this.state.toast.visible,
                snapshot: this._snapshotToastHost(toastHost)
            });
            if (!this._isResumeToastEnabled()) return;
            this._clearResumeToastTimers();

            try {
                localStorage.setItem(RESUME_TOAST_SUPPRESSED_STORAGE_KEY, 'true');
                this._logResumeToast('Toast suppression enabled by user');
            } catch {
                // Ignores persistence failures and still closes the toast.
                this._logResumeToast('Failed to persist toast suppression flag');
            }

            this._hideResumeToastAnimated('never-show');
        });
        
        // Handles global keyboard shortcuts.
        window.addEventListener('keydown', this._boundGlobalKeyDown);

        // Suppresses native browser title tooltips on hover to keep UI tooltip system consistent.
        document.addEventListener('mouseover', this._boundSuppressNativeTooltips, true);

        // Disables native context menus across the app shell.
        document.addEventListener('contextmenu', this._boundDisableContextMenu, true);
    }

    // MARK: I18N LANGUAGE STATE
    // Applies locale metadata to DOM and synchronizes runtime translation state.
    _applyDocumentLocaleMetadata(localeCode) {
        const normalizedLang = resolveLocaleCode(String(localeCode || '').trim().toLowerCase(), DEFAULT_LOCALE);
        const htmlLangTag = LANGUAGE_CONFIG[normalizedLang]?.htmlLang || normalizedLang;
        const direction = resolveLocaleDirection(normalizedLang, 'ltr');
        const appRoot = typeof document !== 'undefined' ? document.getElementById('app') : null;

        window.currentLang = normalizedLang;
        document.documentElement.lang = htmlLangTag;
        document.documentElement.dir = direction;
        this.setAttribute('dir', direction);
        this.setAttribute('data-dir', direction);
        if (appRoot instanceof HTMLElement) {
            appRoot.setAttribute('dir', direction);
            appRoot.setAttribute('data-dir', direction);
        }

        return {
            lang: normalizedLang,
            direction
        };
    }

    _setLanguage(nextLang) {
        const nextLocale = this._applyDocumentLocaleMetadata(nextLang);
        if (!nextLocale.lang) return;

        this.setState({
            lang: nextLocale.lang,
            direction: nextLocale.direction
        });
        applyTranslations();
    }

    _slugify(value, fallbackValue = 'item') {
        const normalized = String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (normalized.length > 0) {
            return normalized;
        }

        return String(fallbackValue || 'item')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'item';
    }

    _resolveCaseRouteSlug(caseData, localeCode = this.state.lang) {
        if (!caseData || typeof caseData !== 'object') return '';
        const normalizedLocale = resolveLocaleCode(localeCode, DEFAULT_LOCALE);
        const localizedSlugs = caseData.slugByLocale && typeof caseData.slugByLocale === 'object'
            ? caseData.slugByLocale
            : {};
        const localizedSlug = String(localizedSlugs[normalizedLocale] || '').trim();
        if (localizedSlug) {
            return this._slugify(localizedSlug, caseData.id || 'case');
        }

        return this._slugify(caseData.id || 'case', 'case');
    }

    _resolveAboutRouteSlug(localeCode = this.state.lang) {
        const normalizedLocale = resolveLocaleCode(localeCode, DEFAULT_LOCALE);
        const localizedSlugs = this._aboutPayload?.config?.slugByLocale;
        if (localizedSlugs && typeof localizedSlugs === 'object') {
            const candidate = String(localizedSlugs[normalizedLocale] || '').trim();
            if (candidate) {
                return this._slugify(candidate, 'about');
            }
        }

        return this._slugify('about', 'about');
    }

    _resolveCaseByRouteSlug(routeSlug, localeCode = this.state.lang) {
        const normalizedRouteSlug = this._slugify(routeSlug, '');
        if (!normalizedRouteSlug) return null;

        const normalizedLocale = resolveLocaleCode(localeCode, DEFAULT_LOCALE);
        return this._portfolioCases.find((caseData) => {
            const localizedMatch = this._resolveCaseRouteSlug(caseData, normalizedLocale);
            if (localizedMatch === normalizedRouteSlug) return true;
            return this._slugify(caseData.id || '', '') === normalizedRouteSlug;
        }) || null;
    }

    _resolveRouteStateFromLocation() {
        const pathSegments = String(window.location.pathname || '')
            .split('/')
            .filter(Boolean);
        if (pathSegments.length === 0) return null;

        const localeCandidate = String(pathSegments[0] || '').trim().toLowerCase();
        if (!SUPPORTED_LOCALES.includes(localeCandidate)) {
            return null;
        }

        const routeSegments = pathSegments.slice(1);
        if (routeSegments.length === 0) {
            return { lang: localeCandidate, currentView: 'home', activeCaseId: null };
        }

        if (routeSegments[0] === ROUTE_CASE_SEGMENT) {
            const routeCaseSlug = routeSegments[1];
            if (!routeCaseSlug) {
                return { lang: localeCandidate, currentView: 'home', activeCaseId: null };
            }

            const resolvedCase = this._resolveCaseByRouteSlug(routeCaseSlug, localeCandidate);
            if (!resolvedCase) {
                return { lang: localeCandidate, currentView: 'home', activeCaseId: null };
            }

            const queryParams = new URLSearchParams(window.location.search);
            const queryView = String(queryParams.get('view') || '').trim().toLowerCase();
            const currentView = queryView === ROUTE_PLAYER_QUERY_VALUE ? 'player' : 'case';

            return {
                lang: localeCandidate,
                currentView,
                activeCaseId: resolvedCase.id
            };
        }

        const aboutSlug = this._resolveAboutRouteSlug(localeCandidate);
        if (this._slugify(routeSegments[0], '') === aboutSlug) {
            return { lang: localeCandidate, currentView: 'about', activeCaseId: null };
        }

        return { lang: localeCandidate, currentView: 'home', activeCaseId: null };
    }

    _buildCanonicalPathForState(state = this.state, localeCode = this.state.lang) {
        const normalizedLocale = resolveLocaleCode(localeCode, DEFAULT_LOCALE);
        const currentView = state?.currentView || 'home';

        if (currentView === 'about') {
            const aboutSlug = this._resolveAboutRouteSlug(normalizedLocale);
            return `/${normalizedLocale}/${aboutSlug}`;
        }

        if ((currentView === 'case' || currentView === 'player') && state?.activeCaseId) {
            const activeCase = this._portfolioCases.find((item) => item.id === state.activeCaseId);
            if (activeCase) {
                const caseSlug = this._resolveCaseRouteSlug(activeCase, normalizedLocale);
                return `/${normalizedLocale}/${ROUTE_CASE_SEGMENT}/${caseSlug}`;
            }
        }

        return `/${normalizedLocale}`;
    }

    _syncLocalizedRouteUrl() {
        if (this._routeSyncInProgress) return;

        const nextPath = this._buildCanonicalPathForState(this.state, this.state.lang);
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('lang');
        queryParams.delete('case');

        if (this.state.currentView === 'player') {
            queryParams.set('view', ROUTE_PLAYER_QUERY_VALUE);
        } else {
            queryParams.delete('view');
        }

        const nextQuery = queryParams.toString();
        const nextUrl = `${nextPath}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextUrl === currentUrl) return;

        this._routeSyncInProgress = true;
        window.history.replaceState({}, '', nextUrl);
        this._routeSyncInProgress = false;
    }

    _isCaseLocked(caseData) {
        const isProtected = Boolean(caseData?.isProtected);
        if (!isProtected) return false;
        if (Boolean(caseData?.isUnlocked)) return false;
        return !this._unlockedCaseIds.has(caseData.id);
    }

    _promptUnlockCase(caseData) {
        const passwordValue = window.prompt(t('enter_passcode'));
        if (!passwordValue) return;

        const unlockEndpoint = String(portfoliableDesignConfig?.protection?.unlockEndpoint || '').trim();
        if (!unlockEndpoint) {
            this._queueResumeToast({
                content: `${t('protected_case')} - configure protection.unlockEndpoint in portfoliable.design.config.js`,
                caseId: null,
                scrollTop: 0
            });
            return;
        }

        fetch(unlockEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caseId: caseData?.id,
                password: passwordValue,
                locale: this.state.lang
            })
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error('unlock-failed'))))
            .then((payload) => {
                if (!payload?.ok) throw new Error('unlock-rejected');
                caseData.isUnlocked = true;
                this._unlockedCaseIds.add(caseData.id);
                this._caseNavigatorResultsCacheSource = null;
                this._caseNavigatorResultsCacheLockSignature = '';
                this._queueResumeToast({
                    content: t('case_unlocked'),
                    caseId: null,
                    scrollTop: 0,
                    showClose: false,
                    showNeverShow: false,
                    ignoreSuppression: true
                });
                this._openCaseById(caseData.id);
            })
            .catch(() => {
                this._queueResumeToast({
                    content: t('incorrect_passcode'),
                    caseId: null,
                    scrollTop: 0,
                    showClose: false,
                    showNeverShow: false
                });
            });
    }

    _buildCaseUrl(caseData, localeCode = this.state.lang, options = {}) {
        const normalizedLocale = resolveLocaleCode(localeCode, DEFAULT_LOCALE);
        const includePlayerView = options.includePlayerView === true;
        const state = {
            currentView: includePlayerView ? 'player' : 'case',
            activeCaseId: caseData?.id || null
        };
        const routePath = this._buildCanonicalPathForState(state, normalizedLocale);
        const query = includePlayerView ? '?view=player' : '';
        return `${window.location.origin}${routePath}${query}`;
    }

    _resolveVisibilityFlags(targetVisibility = null) {
        const globalVisibility = portfoliableDesignConfig?.visibility && typeof portfoliableDesignConfig.visibility === 'object'
            ? portfoliableDesignConfig.visibility
            : {};

        const localeCode = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        const localOverrides = targetVisibility?.locales?.[localeCode] || {};

        const toFlag = (value, fallbackValue = true) => {
            if (typeof value === 'boolean') return value;
            return fallbackValue;
        };

        return {
            web: toFlag(localOverrides.web, toFlag(targetVisibility?.web, toFlag(globalVisibility.web, true))),
            crawlers: toFlag(localOverrides.crawlers, toFlag(targetVisibility?.crawlers, toFlag(globalVisibility.crawlers, true))),
            ai: toFlag(localOverrides.ai, toFlag(targetVisibility?.ai, toFlag(globalVisibility.ai, true)))
        };
    }

    _upsertMetaTag(attributeName, attributeValue, contentValue) {
        if (!attributeValue) return;
        const selector = `meta[${attributeName}="${CSS.escape(attributeValue)}"]`;
        let tag = document.head.querySelector(selector);
        if (!(tag instanceof HTMLMetaElement)) {
            tag = document.createElement('meta');
            tag.setAttribute(attributeName, attributeValue);
            tag.setAttribute('data-owner', ROUTE_META_TAG_OWNER);
            document.head.appendChild(tag);
        }

        if (tag.getAttribute('content') !== contentValue) {
            tag.setAttribute('content', contentValue);
        }
    }

    _upsertLinkTag(rel, href, hreflang = '') {
        const selector = hreflang
            ? `link[rel="${CSS.escape(rel)}"][hreflang="${CSS.escape(hreflang)}"]`
            : `link[rel="${CSS.escape(rel)}"]:not([hreflang])`;
        let tag = document.head.querySelector(selector);
        if (!(tag instanceof HTMLLinkElement)) {
            tag = document.createElement('link');
            tag.rel = rel;
            tag.setAttribute('data-owner', ROUTE_META_TAG_OWNER);
            if (hreflang) {
                tag.hreflang = hreflang;
            }
            document.head.appendChild(tag);
        }

        if (tag.href !== href) {
            tag.href = href;
        }
    }

    _removeOwnedHeadAlternates() {
        document.head.querySelectorAll(`link[rel="alternate"][data-owner="${ROUTE_META_TAG_OWNER}"]`).forEach((el) => el.remove());
    }

    _removeOwnedHeadMetaTag(attributeName, attributeValue) {
        if (!attributeValue) return;
        document.head
            .querySelectorAll(`meta[${attributeName}="${CSS.escape(attributeValue)}"][data-owner="${ROUTE_META_TAG_OWNER}"]`)
            .forEach((el) => el.remove());
    }

    _upsertStructuredDataTag(tagId, payload) {
        if (!tagId) return;

        const selector = `script[type="application/ld+json"][data-owner="${ROUTE_META_TAG_OWNER}"][data-id="${CSS.escape(tagId)}"]`;
        let tag = document.head.querySelector(selector);

        if (!(tag instanceof HTMLScriptElement)) {
            tag = document.createElement('script');
            tag.type = 'application/ld+json';
            tag.setAttribute('data-owner', ROUTE_META_TAG_OWNER);
            tag.setAttribute('data-id', tagId);
            document.head.appendChild(tag);
        }

        const nextText = JSON.stringify(payload);
        if (tag.textContent !== nextText) {
            tag.textContent = nextText;
        }
    }

    _removeOwnedStructuredDataTags() {
        document.head
            .querySelectorAll(`script[type="application/ld+json"][data-owner="${ROUTE_META_TAG_OWNER}"]`)
            .forEach((el) => el.remove());
    }

    _resolveCaseSeoVisibility(caseData) {
        const visibility = this._resolveVisibilityFlags(caseData?.visibility);
        if (this._isCaseLocked(caseData)) {
            visibility.crawlers = false;
            visibility.ai = false;
        }
        return visibility;
    }

    _buildStructuredDataPayloads({
        localeCode,
        canonicalUrl,
        title,
        description,
        activeCase = null,
        aboutPayload = null,
        aboutVisibility = null,
        imageUrl = '',
        visibility = null
    }) {
        if (!visibility?.crawlers || this.state.currentView === 'player') {
            return [];
        }

        const homeUrl = `${window.location.origin}/${localeCode}`;
        const absoluteImageUrl = imageUrl
            ? (imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
            : '';

        if (this.state.currentView === 'home') {
            const itemListElement = [];
            if (aboutVisibility?.web !== false && aboutVisibility?.crawlers !== false) {
                itemListElement.push({
                    '@type': 'ListItem',
                    position: itemListElement.length + 1,
                    name: this.getLang(aboutPayload?.title) || t('about_title'),
                    url: `${window.location.origin}${this._buildCanonicalPathForState({ currentView: 'about', activeCaseId: null }, localeCode)}`
                });
            }

            this._portfolioCases
                .filter((caseData) => this._resolveVisibilityFlags(caseData?.visibility).web !== false)
                .filter((caseData) => this._resolveCaseSeoVisibility(caseData).crawlers)
                .forEach((caseData) => {
                    itemListElement.push({
                        '@type': 'ListItem',
                        position: itemListElement.length + 1,
                        name: this.getLang(caseData.title) || caseData.id || '',
                        url: this._buildCaseUrl(caseData, localeCode)
                    });
                });

            return [
                {
                    id: ROUTE_STRUCTURED_DATA_HOME_ID,
                    payload: {
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: title,
                        description,
                        url: homeUrl,
                        inLanguage: localeCode
                    }
                },
                {
                    id: ROUTE_STRUCTURED_DATA_GRAPH_ID,
                    payload: {
                        '@context': 'https://schema.org',
                        '@type': 'ItemList',
                        name: title,
                        url: canonicalUrl,
                        inLanguage: localeCode,
                        itemListElement
                    }
                }
            ];
        }

        const breadcrumbItems = [
            {
                '@type': 'ListItem',
                position: 1,
                name: t('nav_home'),
                item: homeUrl
            }
        ];

        if (this.state.currentView === 'about') {
            breadcrumbItems.push({
                '@type': 'ListItem',
                position: 2,
                name: title,
                item: canonicalUrl
            });

            return [
                {
                    id: ROUTE_STRUCTURED_DATA_GRAPH_ID,
                    payload: {
                        '@context': 'https://schema.org',
                        '@graph': [
                            {
                                '@type': 'BreadcrumbList',
                                itemListElement: breadcrumbItems
                            },
                            {
                                '@type': 'ProfilePage',
                                name: title,
                                description,
                                url: canonicalUrl,
                                inLanguage: localeCode,
                                ...(absoluteImageUrl ? { image: absoluteImageUrl } : {})
                            }
                        ]
                    }
                }
            ];
        }

        if (this.state.currentView === 'case' && activeCase) {
            breadcrumbItems.push({
                '@type': 'ListItem',
                position: 2,
                name: title,
                item: canonicalUrl
            });

            return [
                {
                    id: ROUTE_STRUCTURED_DATA_GRAPH_ID,
                    payload: {
                        '@context': 'https://schema.org',
                        '@graph': [
                            {
                                '@type': 'BreadcrumbList',
                                itemListElement: breadcrumbItems
                            },
                            {
                                '@type': 'Article',
                                headline: title,
                                description,
                                url: canonicalUrl,
                                inLanguage: localeCode,
                                ...(absoluteImageUrl ? { image: [absoluteImageUrl] } : {})
                            }
                        ]
                    }
                }
            ];
        }

        return [];
    }

    async _syncHeadMetadata() {
        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId) || null;
        const localeCode = resolveLocaleCode(this.state.lang, DEFAULT_LOCALE);
        const path = this._buildCanonicalPathForState(this.state, localeCode);
        const canonicalUrl = `${window.location.origin}${path}`;
        const aboutPayload = this._aboutPayload || parseAboutMarkdown(aboutMeMarkdownRaw);
        const aboutVisibility = this._resolveVisibilityFlags(aboutPayload?.config?.visibility);

        let title = t('meta_home_title') || t('h1_title');
        let description = t('meta_home_description') || t('footer_text');
        let imageUrl = '';
        let visibility = this._resolveVisibilityFlags();

        if (this.state.currentView === 'case' || this.state.currentView === 'player') {
            if (activeCase) {
                visibility = this._resolveCaseSeoVisibility(activeCase);
                if (this._isCaseLocked(activeCase)) {
                    title = t('protected_case') || title;
                    description = t('enter_passcode') || description;
                    imageUrl = '';
                } else {
                    title = this.getLang(activeCase.title) || title;
                    description = this.getLang(activeCase.shortDesc) || description;
                    imageUrl = await this._resolveRuntimeImageUrl(
                        this.getLang(activeCase.socialImage) || this.getLang(activeCase.thumbSrc) || ''
                    );
                }
            }
        } else if (this.state.currentView === 'about') {
            title = this.getLang(aboutPayload.title) || title;
            description = this.getLang(aboutPayload.subtitle) || description;
            imageUrl = await this._resolveRuntimeImageUrl(
                this._resolveLocalizedConfigText(aboutPayload?.config?.socialImage || '').trim()
            );
            visibility = aboutVisibility;
        }

        if (this.state.currentView === 'player') {
            visibility.crawlers = false;
            visibility.ai = false;
        }

        document.title = title;
        this._upsertMetaTag('name', 'description', description);
        this._upsertMetaTag('property', 'og:title', title);
        this._upsertMetaTag('property', 'og:description', description);
        this._upsertMetaTag('property', 'og:url', canonicalUrl);
        this._upsertMetaTag('property', 'og:type', this.state.currentView === 'home' ? 'website' : 'article');
        this._upsertMetaTag('name', 'twitter:card', 'summary_large_image');
        this._upsertMetaTag('name', 'twitter:title', title);
        this._upsertMetaTag('name', 'twitter:description', description);
        if (imageUrl) {
            const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            this._upsertMetaTag('property', 'og:image', absoluteImageUrl);
            this._upsertMetaTag('name', 'twitter:image', absoluteImageUrl);
        } else {
            this._removeOwnedHeadMetaTag('property', 'og:image');
            this._removeOwnedHeadMetaTag('name', 'twitter:image');
        }

        const robotFlags = [visibility.crawlers ? 'index' : 'noindex', visibility.crawlers ? 'follow' : 'nofollow'];
        if (!visibility.ai) {
            robotFlags.push('noarchive', 'nosnippet');
        }
        this._upsertMetaTag('name', 'robots', robotFlags.join(','));
        this._upsertMetaTag('name', 'googlebot', robotFlags.join(','));
        this._upsertMetaTag('name', 'bingbot', robotFlags.join(','));
        this._upsertMetaTag('name', 'ai', visibility.ai ? 'index,train' : 'noai,noimageai');

        this._upsertLinkTag('canonical', canonicalUrl);
        this._removeOwnedHeadAlternates();
        SUPPORTED_LOCALES.forEach((supportedLocale) => {
            const href = `${window.location.origin}${this._buildCanonicalPathForState(this.state, supportedLocale)}`;
            this._upsertLinkTag('alternate', href, supportedLocale);
        });

        const structuredDataPayloads = this._buildStructuredDataPayloads({
            localeCode,
            canonicalUrl,
            title,
            description,
            activeCase,
            aboutPayload,
            aboutVisibility,
            imageUrl,
            visibility
        });

        this._removeOwnedStructuredDataTags();
        structuredDataPayloads.forEach(({ id, payload }) => {
            this._upsertStructuredDataTag(id, payload);
        });
    }

    _handlePopStateRoute() {
        if (this._routeSyncInProgress) return;
        const routeState = this._resolveRouteStateFromLocation();
        if (!routeState) return;

        const nextLocale = this._applyDocumentLocaleMetadata(routeState.lang);

        this.setState({
            lang: nextLocale.lang,
            direction: nextLocale.direction,
            currentView: routeState.currentView,
            activeCaseId: routeState.activeCaseId,
            viewHistory: this._buildViewHistoryForDirectRoute(routeState.currentView)
        });
        applyTranslations();
    }

    _syncNavigationLanguageMenus() {
        const roots = this._collectAllOpenShadowRoots(this.shadowRoot);
        const navigationMenus = [];

        roots.forEach((root) => {
            root.querySelectorAll('ds-navigation-menu').forEach((menuElement) => {
                if (!navigationMenus.includes(menuElement)) {
                    navigationMenus.push(menuElement);
                }
            });
        });

        if (navigationMenus.length === 0) return;

        const availableLanguageCodes = this._getAvailableLanguageCodes();
        if (availableLanguageCodes.length === 0) return;

        const activeLanguage = this._resolveEffectiveLanguageCode(this.state.lang, availableLanguageCodes[0] || DEFAULT_LOCALE);
        const languageItems = availableLanguageCodes.map((languageCode) => ({
            id: languageCode,
            label: resolveLocaleDisplayName(languageCode),
            showIcon: false,
            control: 'check',
            selected: languageCode === activeLanguage,
            checkHasBackground: false,
            category: 'main'
        }));

        const resolveI18nLabel = (key, fallback = '') => {
            const resolved = String(t(key) || '').trim();
            if (!resolved || resolved === key) return fallback;
            return resolved;
        };

        const languageMenuHeader = resolveI18nLabel('lang_cat', resolveI18nLabel('popup_lang_title', 'Language'));
        const accessibilityMenuHeader = resolveI18nLabel('a11y_cat_typography', resolveI18nLabel('popup_a11y_title', 'Accessibility'));
        const accessibilitySubcategoryTitle = resolveI18nLabel('a11y_cat_visuals', 'Visuals');

        navigationMenus.forEach((navigationMenu) => {
            if (typeof navigationMenu._cacheElements === 'function' && !navigationMenu.languageMenu) {
                navigationMenu._cacheElements();
            }

            navigationMenu.setAttribute('language-menu-header', languageMenuHeader);
            navigationMenu.setAttribute('accessibility-menu-header', accessibilityMenuHeader);
            navigationMenu.setAttribute('accessibility-menu-subcategory-title', accessibilitySubcategoryTitle);
            navigationMenu.setAttribute('a11y-label-text-size', t('a11y_size'));
            navigationMenu.setAttribute('a11y-label-dyslexia-font', t('a11y_dyslexia'));
            navigationMenu.setAttribute('a11y-label-dark-mode', t('a11y_dark'));
            navigationMenu.setAttribute('a11y-label-high-contrast', t('a11y_contrast'));
            navigationMenu.setAttribute('a11y-label-reduce-motion', t('a11y_motion'));
            navigationMenu.setAttribute('a11y-label-tab-navigation', t('a11y_tab'));

            if (Array.isArray(navigationMenu._languageItems)) {
                navigationMenu._languageItems = languageItems.map((item) => ({ ...item }));
            }

            if (navigationMenu.languageMenu) {
                navigationMenu.languageMenu.items = languageItems;
            }
        });
    }

    // MARK: GLOBAL INTERACTION UTILITIES
    // Keeps native browser scrolling behavior neutral so Lenis owns the smooth-motion surface.
    _enableGlobalSmoothScrolling() {
        document.documentElement.style.scrollBehavior = '';
        if (document.body) {
            document.body.style.scrollBehavior = '';
        }
    }

    _registerLenisInstance(instance) {
        if (!instance) return;
        this._lenisInstances.add(instance);
        this._startLenisLoop();
    }

    _unregisterLenisInstance(instance) {
        if (!instance) return;
        this._lenisInstances.delete(instance);
        if (this._lenisInstances.size === 0) {
            this._stopLenisLoop();
        }
    }

    _startLenisLoop() {
        if (this._lenisFrame) return;

        const tick = (time) => {
            if (this._lenisInstances.size === 0) {
                this._lenisFrame = 0;
                return;
            }

            this._lenisInstances.forEach((instance) => {
                if (instance && typeof instance.raf === 'function') {
                    instance.raf(time);
                }
            });

            this._lenisFrame = requestAnimationFrame(tick);
        };

        this._lenisFrame = requestAnimationFrame(tick);
    }

    _stopLenisLoop() {
        if (this._lenisFrame) {
            cancelAnimationFrame(this._lenisFrame);
            this._lenisFrame = 0;
        }
    }

    // Removes title attributes from hovered native elements to suppress browser tooltips.
    _suppressNativeTooltips(event) {
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
        const isPlayerRoute = this.state.currentView === 'player';
        const isPlayerEvent = path.some((node) => node instanceof HTMLElement && (node.id === 'player-view-host' || node.id === 'player-view' || node.tagName?.toLowerCase() === 'ds-player-view'));

        path.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (!node.hasAttribute('title')) return;

            if (!isPlayerRoute || !isPlayerEvent) {
                if (node.tagName.includes('-')) return;
            }

            node.removeAttribute('title');
        });
    }

    // Blocks browser context menus across app interactions.
    _handleContextMenu(event) {
        event.preventDefault();
    }

    _handleCaseHashAnchorNavigation(event) {
        if (this.state.currentView !== 'case') return false;

        const path = typeof event?.composedPath === 'function' ? event.composedPath() : [event?.target];
        const anchor = path.find((node) => node instanceof HTMLAnchorElement);
        if (!(anchor instanceof HTMLAnchorElement)) return false;

        const href = String(anchor.getAttribute('href') || '').trim();
        if (!href.startsWith('#')) return false;

        const targetId = decodeURIComponent(href.slice(1));
        if (!targetId) return false;

        const caseView = this.shadowRoot.getElementById('case-view');
        if (!(caseView instanceof HTMLElement)) return false;

        const targetNode = caseView.querySelector(`#${CSS.escape(targetId)}`);
        if (!(targetNode instanceof HTMLElement)) return false;

        event.preventDefault();

        const scrollRoot = this._getAppScrollRoot();
        if (!(scrollRoot instanceof HTMLElement)) {
            targetNode.scrollIntoView({ behavior: this._shouldReduceMotion() ? 'auto' : 'smooth', block: 'start' });
            return true;
        }

        const targetRect = targetNode.getBoundingClientRect();
        const containerRect = scrollRoot.getBoundingClientRect();
        const nextTop = scrollRoot.scrollTop + (targetRect.top - containerRect.top) - 96;
        this._scrollAppTo(nextTop, this._shouldReduceMotion() ? 'auto' : 'smooth');

        const nextHash = `#${encodeURIComponent(targetId)}`;
        if (window.location.hash !== nextHash) {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
        }

        return true;
    }

    // MARK: EVENTS PAYLOAD RESOLUTION HELPERS
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

    // Returns true only when a localized field has at least one non-empty value.
    _hasLocalizedValue(value) {
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        if (!value || typeof value !== 'object') {
            return false;
        }

        return Object.values(value).some((entry) => typeof entry === 'string' && entry.trim().length > 0);
    }

    // Returns normalized configured locales preserving the declaration order.
    _getConfiguredLanguageCodes() {
        const configuredCodes = [];

        SUPPORTED_LOCALES.forEach((localeCode) => {
            const normalized = String(localeCode || '').trim().toLowerCase();
            if (!normalized || configuredCodes.includes(normalized)) return;
            configuredCodes.push(normalized);
        });

        if (configuredCodes.length === 0) {
            configuredCodes.push(DEFAULT_LOCALE);
        }

        return configuredCodes;
    }

    // Resolves locale variants to configured locale codes (for example en-US -> en).
    _resolveEffectiveLanguageCode(localeCode, fallback = '') {
        const normalized = String(localeCode || '').trim().toLowerCase();
        const configuredCodes = this._getConfiguredLanguageCodes();

        if (!normalized) {
            return fallback;
        }

        if (configuredCodes.includes(normalized)) {
            return normalized;
        }

        const baseLocale = normalized.split('-')[0];
        if (configuredCodes.includes(baseLocale)) {
            return baseLocale;
        }

        const mappedByBase = configuredCodes.find((configuredLocale) => configuredLocale.split('-')[0] === baseLocale);
        if (mappedByBase) {
            return mappedByBase;
        }

        return fallback;
    }

    // Hides language switching controls when there is only one effective locale.
    _canShowLanguageMenu() {
        return this._getAvailableLanguageCodes().length > 1;
    }

    // Resolves effective locale codes for language-switch UI.
    _getAvailableLanguageCodes() {
        return this._getConfiguredLanguageCodes();
    }

    // MARK: PLAYER VIEW THUMBNAIL RESOLUTION
    // Resolves the active player thumbnail element used inside ds-player-view.
    _getPlayerThumbnailElement() {
        const playerView = this.shadowRoot.getElementById('player-view');
        const source = playerView?.shadowRoot?.querySelector('ds-thumbnail')
            || playerView?.shadowRoot?.querySelector('.thumbnail-shell ds-thumbnail');
        return source instanceof HTMLElement ? source : null;
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

    // MARK: HEADER AND BREADCRUMB MENU BUILDERS
    // Builds menu datasets for headers and breadcrumbs from current locale and case context.
    _buildBreadcrumbMenuContext(activeCaseId, viewKey = 'playerView') {
        const breadcrumbMenuLabels = {
            caseHeader: t('breadcrumb_menu_case_header'),
            videoHeader: t('breadcrumb_menu_video_header'),
        };
        const breadcrumbMenuIconConfig = this._resolveBreadcrumbMenuIconConfig(viewKey);
        const caseMenuItems = this._buildBreadcrumbMenuItems(activeCaseId, breadcrumbMenuIconConfig.caseStudies);
        const videoMenuItems = this._buildBreadcrumbMenuItems(activeCaseId, breadcrumbMenuIconConfig.videos, true);

        return {
            breadcrumbMenuLabels,
            breadcrumbMenuIconConfig,
            caseMenuItems,
            videoMenuItems
        };
    }

    _resolveBreadcrumbMenuIconConfig(viewKey = 'playerView') {
        const config = portfoliableDesignConfig?.header?.breadcrumbMenus?.[viewKey] || {};
        const normalize = (menu = {}) => ({
            itemIcon: typeof menu.itemIcon === 'string' ? menu.itemIcon.trim() : '',
            itemIconVariant: typeof menu.itemIconVariant === 'string' && menu.itemIconVariant.trim() ? menu.itemIconVariant.trim() : 'fill',
            showItemIcon: menu.showItemIcon === true
        });

        return {
            caseStudies: normalize(config.caseStudies),
            videos: normalize(config.videos)
        };
    }

    _buildBreadcrumbMenuItems(activeCaseId, iconConfig, onlyWithVideo = false) {
        return this._portfolioCases
            .filter((item) => item.id !== activeCaseId)
            .filter((item) => this._resolveVisibilityFlags(item.visibility).web !== false)
            .filter((item) => !onlyWithVideo || this._hasLocalizedValue(this._resolveCasePrimaryVideoProp(item)))
            .map((item) => ({
                id: item.id,
                label: this._isCaseLocked(item) ? t('protected_case') : (this.getLang(item.title) || item.id),
                icon: iconConfig.itemIcon,
                iconVariant: iconConfig.itemIconVariant,
                showIcon: iconConfig.showItemIcon
            }));
    }

    // MARK: CASE VIEW ANIMATION
    // Animates case article content while keeping TOC and navigator fixed/static.
    _runCaseStyleEntryReveal(targetEl) {
        if (!(targetEl instanceof HTMLElement)) return;

        targetEl.style.willChange = 'transform, opacity';
        const entryAnimation = targetEl.animate(
            [
                { opacity: 0, transform: 'translateY(22px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            {
                duration: 520,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'both'
            }
        );

        entryAnimation.addEventListener('finish', () => {
            entryAnimation.cancel();
            targetEl.style.willChange = '';
        }, { once: true });
    }

    _animateCaseArticleTextReveal(caseKey = '') {
        if (this._shouldReduceMotion()) return;
        if (this.state.currentView !== 'case') return;
        if (!this._caseEntryAnimationPending && caseKey && this._caseEntryAnimationKey === caseKey) return;

        const resolveAndAnimate = (attempt = 0) => {
            const caseView = this.shadowRoot.getElementById('case-view');
            if (!caseView) return;

            const article = caseView.shadowRoot?.querySelector('ds-article');
            const breadcrumbTarget = this._shouldAnimateBreadcrumbEntryForView('case')
                ? this._getGlobalBreadcrumbAnimationTarget()
                : null;
            if (!(article instanceof HTMLElement) && attempt < 10) {
                requestAnimationFrame(() => resolveAndAnimate(attempt + 1));
                return;
            }

            const contentEl = article?.shadowRoot?.querySelector('.content-column, .article-body-layout');
            if (breadcrumbTarget instanceof HTMLElement) {
                this._runCaseStyleEntryReveal(breadcrumbTarget);
            }
            if (contentEl instanceof HTMLElement) {
                this._runCaseStyleEntryReveal(contentEl);
            }

            this._caseEntryAnimationKey = caseKey;
            this._caseEntryAnimationPending = false;
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

            let settled = false;
            const settle = () => {
                if (settled) return;
                settled = true;
                resolve();
            };

            const tryResolveImage = () => {
                const images = [
                    ...(element.shadowRoot?.querySelectorAll('img') || []),
                    ...element.querySelectorAll('img')
                ];
                if (images.length === 0) return false;

                const hasReadyImage = images.some((image) => image.complete && image.naturalWidth > 0);
                if (hasReadyImage) {
                    settle();
                    return true;
                }

                images.forEach((image) => {
                    image.addEventListener('load', settle, { once: true });
                    image.addEventListener('error', settle, { once: true });
                });
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
                settle();
            }, timeoutMs);
        });
    }

    // MARK: HOME VIEW THUMBNAIL RESOLUTION
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

        const source = itemEl.shadowRoot?.querySelector('ds-thumbnail');
        return source instanceof HTMLElement ? source : null;
    }

    // MARK: CASE VIEW THUMBNAIL RESOLUTION
    // Resolves the active case-view thumbnail element used inside ds-article.
    _getCaseThumbnailElement() {
        const caseView = this.shadowRoot.getElementById('case-view');
        const article = caseView?.shadowRoot?.querySelector('ds-article');
        const source = article?.shadowRoot?.querySelector('.article-cover-container ds-thumbnail')
            || article?.shadowRoot?.querySelector('ds-thumbnail')
            || caseView?.querySelector('ds-thumbnail[slot="cover"]');
        return source instanceof HTMLElement ? source : null;
    }

    // MARK: TRANSITIONS SHARED THUMBNAIL PREPARATION
    // Captures source thumbnail geometry before route swap for shared transition animation.
    _prepareThumbnailTransition(direction, caseId, prevView, nextView) {
        this._pendingThumbnailTransition = null;
        if (!caseId) {
            this._setTransitionDebug('skip', 'missing-case-id');
            return;
        }
        if (this._shouldReduceMotion()) {
            this._setTransitionDebug('skip', 'reduced-motion');
            return;
        }

        const sourceHint = (prevView === 'home' && nextView === 'case' && this._homeTransitionSourceHint?.caseId === caseId)
            ? this._homeTransitionSourceHint
            : null;
        const rememberedSource = this._getRememberedThumbnailSnapshot(prevView, caseId);
        let sourceEl = this._resolveThumbnailForView(prevView, caseId);
        if (sourceHint?.element instanceof HTMLElement && sourceHint.element.isConnected) {
            sourceEl = sourceHint.element;
        }

        const liveSourceRect = this._toRectSnapshot(sourceEl?.getBoundingClientRect?.());
        const sourceRect = this._isValidRect(liveSourceRect)
            ? liveSourceRect
            : (this._isValidRect(sourceHint?.rect)
                ? sourceHint.rect
                : (this._isValidRect(rememberedSource?.rect) ? rememberedSource.rect : null));

        const fallbackSourceRect = sourceRect || this._resolveFallbackSourceRect(prevView, nextView, caseId);

        if (!fallbackSourceRect) {
            this._setTransitionDebug('skip', 'missing-source-rect');
            return;
        }

        this._pendingThumbnailTransition = {
            caseId,
            direction,
            sourceRect: fallbackSourceRect,
            sourceEl,
            sourceImageSrc: this._extractThumbnailImageSource(sourceEl) || sourceHint?.sourceImageSrc || rememberedSource?.sourceImageSrc || '',
            sourceRadius: sourceHint?.sourceRadius || rememberedSource?.sourceRadius || this._readTransitionRadius(sourceEl, 24)
        };
        this._rememberThumbnailSnapshot({
            viewName: prevView,
            caseId,
            element: sourceEl,
            rect: fallbackSourceRect,
            sourceRadius: this._pendingThumbnailTransition.sourceRadius,
            sourceImageSrc: this._pendingThumbnailTransition.sourceImageSrc
        });
        this._setTransitionDebug('prepared', `${prevView}-to-${nextView}`);
        if (sourceHint) {
            this._homeTransitionSourceHint = null;
        }
    }

    _beginThumbnailHandoff(sourceEl, targetEl) {
        const state = {
            sourceEl: sourceEl instanceof HTMLElement ? sourceEl : null,
            targetEl: targetEl instanceof HTMLElement ? targetEl : null,
            previousSourceOpacity: '',
            previousTargetVisibility: '',
            previousTargetOpacity: ''
        };

        if (state.targetEl) {
            state.previousTargetVisibility = state.targetEl.style.visibility || '';
            state.previousTargetOpacity = state.targetEl.style.opacity || '';
            state.targetEl.style.visibility = 'hidden';
            state.targetEl.style.opacity = '0';
        }

        if (state.sourceEl) {
            state.previousSourceOpacity = state.sourceEl.style.opacity || '';
            state.sourceEl.style.opacity = '0';
        }

        return {
            revealTarget: () => {
                if (!state.targetEl) return;
                state.targetEl.style.visibility = 'visible';
                state.targetEl.style.opacity = state.previousTargetOpacity || '1';
            },
            restore: () => {
                if (state.sourceEl) {
                    state.sourceEl.style.opacity = state.previousSourceOpacity;
                }
                if (state.targetEl) {
                    state.targetEl.style.visibility = '';
                    state.targetEl.style.opacity = '';
                }
            }
        };
    }

    _playFadeOnlyTransition(pending, prevView, nextView, caseId, transitionId = this._transitionRunId) {
        if (transitionId !== this._transitionRunId) return;
        if (!pending || !caseId) {
            this._setTransitionDebug('skip', 'fade-missing-pending');
            return;
        }

        const layer = this.shadowRoot.getElementById('thumb-transition-layer');
        if (!layer) {
            this._setTransitionDebug('skip', 'fade-missing-layer');
            return;
        }
        layer.innerHTML = '';

        const targetEl = this._resolveThumbnailForView(nextView, caseId);
        const targetRect = this._resolveTransitionTargetRect(targetEl, nextView, caseId)
            || pending.sourceRect;

        this._rememberThumbnailSnapshot({
            viewName: nextView,
            caseId,
            element: targetEl,
            rect: targetRect,
            sourceRadius: this._readTransitionRadius(targetEl, 16),
            sourceImageSrc: this._extractThumbnailImageSource(targetEl)
        });

        const profile = this._getThumbnailTransitionProfile(prevView, nextView, pending.direction || 'forward');

        let sourceEl = pending.sourceEl instanceof HTMLElement ? pending.sourceEl : null;
        if (!(sourceEl instanceof HTMLElement) || !sourceEl.isConnected) {
            sourceEl = null;
        }

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            if (transitionId !== this._transitionRunId) return;

            layer.innerHTML = '';
            if (this._activeThumbnailTransition?.finish === finish) {
                this._activeThumbnailTransition = null;
            }
            this._setTransitionDebug('fade-only', `${prevView}-to-${nextView}`);
        };

        this._activeThumbnailTransition = { finish };

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (transitionId !== this._transitionRunId) return;
                finish();
            });
        });
    }

    // Plays the shared-element thumbnail movement between home and case views.
    async _playThumbnailTransition(direction, caseId, prevView, nextView, attempt = 0, transitionId = this._transitionRunId) {
        const pending = this._pendingThumbnailTransition;

        if (transitionId !== this._transitionRunId) {
            return;
        }

        if (this._fadeOnlyTransitions) {
            this._pendingThumbnailTransition = null;
            this._playFadeOnlyTransition(pending, prevView, nextView, caseId, transitionId);
            return;
        }

        if (!pending || !caseId) {
            this._setTransitionDebug('skip', 'missing-pending');
            return;
        }
        const targetEl = this._resolveThumbnailForView(nextView, caseId);

        if (this._forceUniformRectTransition) {
            const uniformTargetRect = this._resolveTransitionTargetRect(targetEl, nextView, caseId);
            if (!this._isValidRect(uniformTargetRect)) {
                this._setTransitionDebug('skip', 'uniform-missing-target-rect');
                this._pendingThumbnailTransition = null;
                return;
            }

            this._pendingThumbnailTransition = null;
            this._setTransitionDebug('uniform-rect-motion', `${prevView}-to-${nextView}`);
            return this._playRectFallbackTransition(pending, uniformTargetRect, prevView, nextView, transitionId);
        }

        // Hard guarantee: Home -> Case always animates via rect fallback path.
        if (prevView === 'home' && nextView === 'case') {
            const forcedTargetRect = this._resolveTransitionTargetRect(targetEl, nextView, caseId);

            if (!this._isValidRect(forcedTargetRect)) {
                this._setTransitionDebug('skip', 'home-case-no-target-rect');
                this._pendingThumbnailTransition = null;
                return;
            }

            this._pendingThumbnailTransition = null;
            this._setTransitionDebug('forced-home-case', 'rect-fallback');
            return this._playRectFallbackTransition(pending, forcedTargetRect, prevView, nextView, transitionId);
        }

        if (!targetEl) {
            if (nextView === 'case') {
                this.renderCaseView();
            }
            if (nextView === 'player') {
                this.renderPlayerView();
            }
            if (nextView === 'home') {
                this.renderHome();
            }
            if (attempt < 72) {
                requestAnimationFrame(() => {
                    this._playThumbnailTransition(direction, caseId, prevView, nextView, attempt + 1, transitionId);
                });
                return;
            }
            const fallbackTargetRect = this._resolveFallbackTargetRect(nextView, caseId);
            if (!this._isValidRect(fallbackTargetRect)) {
                this._setTransitionDebug('skip', 'missing-target-rect');
                this._pendingThumbnailTransition = null;
                return;
            }

            this._pendingThumbnailTransition = null;
            this._setTransitionDebug('fallback', `${nextView}-rect-only`);
            return this._playRectFallbackTransition(pending, fallbackTargetRect, prevView, nextView, transitionId);
        }

        this._pendingThumbnailTransition = null;

        const targetRect = this._resolveTransitionTargetRect(targetEl, nextView, caseId, { includeEstimate: false });
        if (!this._isValidRect(targetRect)) {
            this._setTransitionDebug('skip', 'invalid-target-rect');
            return;
        }
        this._rememberThumbnailSnapshot({
            viewName: nextView,
            caseId,
            element: targetEl,
            rect: targetRect,
            sourceRadius: this._readTransitionRadius(targetEl, 16),
            sourceImageSrc: this._extractThumbnailImageSource(targetEl)
        });
        const profile = this._getThumbnailTransitionProfile(prevView, nextView, direction);

        const layer = this.shadowRoot.getElementById('thumb-transition-layer');
        if (!layer) return;
        layer.innerHTML = '';

        const ghost = document.createElement('div');
        ghost.className = 'thumb-ghost';
        ghost.style.left = `${pending.sourceRect.left}px`;
        ghost.style.top = `${pending.sourceRect.top}px`;
        ghost.style.width = `${pending.sourceRect.width}px`;
        ghost.style.height = `${pending.sourceRect.height}px`;
        ghost.style.borderRadius = `${pending.sourceRadius || this._readTransitionRadius(pending.sourceEl, 24)}px`;

        const ghostTransfer = this._createThumbnailGhostTransfer(pending.sourceEl, targetEl);
        ghost.appendChild(ghostTransfer.node);
        if (pending.sourceImageSrc) {
            const ghostImageEl = ghost.querySelector('img');
            if (ghostImageEl instanceof HTMLImageElement && !ghostImageEl.src) {
                ghostImageEl.src = pending.sourceImageSrc;
            }
        }
        layer.appendChild(ghost);

        const sourceEl = pending.sourceEl instanceof HTMLElement ? pending.sourceEl : null;
        const handoff = this._beginThumbnailHandoff(sourceEl, targetEl);

        const duration = profile.duration;

        this._waitForThumbnailReady(targetEl, duration + 180);

        let ghostAnimation = null;
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            ghostAnimation?.cancel();
            handoff.revealTarget();
            if (targetEl instanceof HTMLElement) {
                targetEl.style.transform = '';
            }
            ghost.remove();
            layer.innerHTML = '';
            ghostTransfer.restore();
            handoff.restore();
            if (this._activeThumbnailTransition?.finish === finish) {
                this._activeThumbnailTransition = null;
            }
            this._setTransitionDebug('animated', `${prevView}-to-${nextView}`);
        };

        this._activeThumbnailTransition = { finish };
        const targetRadius = this._readTransitionRadius(targetEl, 16);
        const startRadius = pending.sourceRadius || this._readTransitionRadius(pending.sourceEl, 24);

        const sourceWidth = pending.sourceRect.width;
        const sourceHeight = pending.sourceRect.height;
        const scaleX = Number.isFinite(targetRect.width / sourceWidth) ? (targetRect.width / sourceWidth) : 1;
        const scaleY = Number.isFinite(targetRect.height / sourceHeight) ? (targetRect.height / sourceHeight) : 1;
        const dx = targetRect.left - pending.sourceRect.left;
        const dy = targetRect.top - pending.sourceRect.top;
        const overshootDx = dx * profile.overshoot;
        const overshootDy = dy * profile.overshoot;

        const useOvershoot = profile.overshoot > 1.001;
        const keyframes = useOvershoot
            ? [
                {
                    transform: 'translate(0px, 0px) scale(1, 1)',
                    borderRadius: `${startRadius}px`,
                    opacity: 1,
                    offset: 0
                },
                {
                    transform: `translate(${overshootDx}px, ${overshootDy}px) scale(${scaleX}, ${scaleY})`,
                    borderRadius: `${targetRadius}px`,
                    opacity: 1,
                    offset: 0.84
                },
                {
                    transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                    borderRadius: `${targetRadius}px`,
                    opacity: profile.settle,
                    offset: 1
                }
            ]
            : [
                {
                    transform: 'translate(0px, 0px) scale(1, 1)',
                    borderRadius: `${startRadius}px`,
                    opacity: 1,
                    offset: 0
                },
                {
                    transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                    borderRadius: `${targetRadius}px`,
                    opacity: profile.settle,
                    offset: 1
                }
            ];

        // Commit initial geometry before animation starts to prevent first-frame popping.
        ghost.getBoundingClientRect();

        ghostAnimation = ghost.animate(
            keyframes,
            {
                duration,
                easing: profile.ease,
                fill: 'forwards'
            }
        );

        ghostAnimation.addEventListener('finish', finish, { once: true });
        setTimeout(finish, duration + 120);

    }

    _playRectFallbackTransition(pending, targetRect, prevView, nextView, transitionId = this._transitionRunId) {
        if (transitionId !== this._transitionRunId) {
            return;
        }

        if (!this._isValidRect(pending?.sourceRect) || !this._isValidRect(targetRect)) {
            this._setTransitionDebug('skip', 'invalid-rect-fallback');
            return;
        }

        const layer = this.shadowRoot.getElementById('thumb-transition-layer');
        if (!layer) {
            this._setTransitionDebug('skip', 'missing-transition-layer');
            return;
        }
        layer.innerHTML = '';

        const targetEl = this._resolveThumbnailForView(nextView, pending.caseId);
        const targetRadius = this._readTransitionRadius(targetEl, 16);
        const sourceEl = pending.sourceEl instanceof HTMLElement ? pending.sourceEl : null;

        const ghost = document.createElement('div');
        ghost.className = 'thumb-ghost';
        ghost.style.left = `${pending.sourceRect.left}px`;
        ghost.style.top = `${pending.sourceRect.top}px`;
        ghost.style.width = `${pending.sourceRect.width}px`;
        ghost.style.height = `${pending.sourceRect.height}px`;
        ghost.style.borderRadius = `${pending.sourceRadius || 24}px`;

        ghost.appendChild(this._createThumbnailGhostContent(pending.sourceEl, null));

        if (pending.sourceImageSrc) {
            const ghostImageEl = ghost.querySelector('img');
            if (ghostImageEl instanceof HTMLImageElement && !ghostImageEl.src) {
                ghostImageEl.src = pending.sourceImageSrc;
            }
        }
        layer.appendChild(ghost);

        // Hide real source/target only after the ghost is in the layer to avoid one-frame disappearance.
        const handoff = this._beginThumbnailHandoff(sourceEl, targetEl);

        const profile = this._getThumbnailTransitionProfile(prevView, nextView, pending.direction || 'forward');
        this._rememberThumbnailSnapshot({
            viewName: nextView,
            caseId: pending.caseId,
            element: targetEl,
            rect: targetRect,
            sourceRadius: targetRadius,
            sourceImageSrc: this._extractThumbnailImageSource(targetEl)
        });
        const finish = () => {
            if (transitionId !== this._transitionRunId) {
                return;
            }
            handoff.revealTarget();
            ghost.remove();
            layer.innerHTML = '';
            handoff.restore();
            if (this._activeThumbnailTransition?.finish === finish) {
                this._activeThumbnailTransition = null;
            }
            this._setTransitionDebug('animated-fallback', `${prevView}-to-${nextView}`);
        };

        this._activeThumbnailTransition = { finish };

        // Commit initial geometry before animation starts to prevent first-frame popping.
        ghost.getBoundingClientRect();

        const fallbackAnimation = ghost.animate(
            [
                {
                    left: `${pending.sourceRect.left}px`,
                    top: `${pending.sourceRect.top}px`,
                    width: `${pending.sourceRect.width}px`,
                    height: `${pending.sourceRect.height}px`,
                    borderRadius: `${pending.sourceRadius || 24}px`,
                    opacity: 1
                },
                {
                    left: `${targetRect.left}px`,
                    top: `${targetRect.top}px`,
                    width: `${targetRect.width}px`,
                    height: `${targetRect.height}px`,
                    borderRadius: `${targetRadius}px`,
                    opacity: 1
                }
            ],
            {
                duration: Math.max(340, profile.duration - 60),
                easing: profile.ease,
                fill: 'forwards'
            }
        );

        fallbackAnimation.addEventListener('finish', finish, { once: true });
        setTimeout(() => {
            if (transitionId !== this._transitionRunId) {
                return;
            }
            finish();
        }, Math.max(400, profile.duration + 40));
    }

    // MARK: CASE VIEW ROUTING HELPERS
    // Opens a case route by normalized case ID when available.
    _openCaseById(caseId, { searchQuery = '' } = {}) {
        if (!caseId) return;
        const targetCase = this._portfolioCases.find((item) => item.id === caseId);
        if (!targetCase) return;
        if (this._isCaseLocked(targetCase)) {
            this._promptUnlockCase(targetCase);
            return;
        }
        const normalizedQuery = this._normalizeCaseSearchQuery(searchQuery);
        if (normalizedQuery) {
            this._caseSearchHighlight = { caseId, query: normalizedQuery };
        } else {
            this._clearCaseSearchHighlight();
        }
        if (this.state.currentView === 'home') {
            this._captureHomeGalleryOffset();
        }
        this._transitionToView({ activeCaseId: caseId, currentView: 'case' });
    }

    // Opens a case route from gallery index when the index is valid.
    _openCaseByIndex(index) {
        if (index === null || Number.isNaN(index)) return;
        const visibleCases = Array.isArray(this._homeVisibleCases)
            ? this._homeVisibleCases
            : this._portfolioCases;
        if (!visibleCases[index]) return;
        this._openCaseById(visibleCases[index].id);
    }

    _openAdjacentCase(offset) {
        const currentCaseIndex = this._portfolioCases.findIndex((item) => item.id === this.state.activeCaseId);
        if (currentCaseIndex < 0) return;

        const nextCaseIndex = currentCaseIndex + offset;
        if (nextCaseIndex < 0 || nextCaseIndex >= this._portfolioCases.length) return;

        const nextCase = this._portfolioCases[nextCaseIndex];
        if (!nextCase?.id) return;

        this._caseScrollRestorePending = null;
        this._openCaseById(nextCase.id);
    }

    _buildViewHistoryForDirectRoute(currentView) {
        if (currentView === 'player') {
            return ['home', 'case', 'player'];
        }

        if (currentView === 'case' || currentView === 'about') {
            return ['home', currentView];
        }

        return ['home'];
    }

    // MARK: ROUTING URL AND RESUME INITIALIZATION
    // Initializes starting view from URL params or persisted resume state.
    _initializeView() {
        this._logResumeToast('Initialize view started', {
            href: window.location.href
        });

        const pathRoute = this._resolveRouteStateFromLocation();
        if (pathRoute) {
            const routeLocale = this._applyDocumentLocaleMetadata(pathRoute.lang);
            if (pathRoute.currentView !== 'home' || pathRoute.activeCaseId) {
                this._logResumeToast('Path route takes precedence over resume toast', {
                    lang: routeLocale.lang,
                    currentView: pathRoute.currentView,
                    activeCaseId: pathRoute.activeCaseId
                });
                this.setState({
                    lang: routeLocale.lang,
                    direction: routeLocale.direction,
                    currentView: pathRoute.currentView,
                    activeCaseId: pathRoute.activeCaseId,
                    viewHistory: this._buildViewHistoryForDirectRoute(pathRoute.currentView)
                });
                return;
            }

            this._logResumeToast('Home path route resolved; continuing resume toast bootstrap', {
                lang: routeLocale.lang
            });
            this.state.lang = routeLocale.lang;
            this.state.direction = routeLocale.direction;
            this.state.currentView = 'home';
            this.state.activeCaseId = null;
            this.state.viewHistory = ['home'];
        }

        // Parses URL params for deep-link case route.
        const urlParams = new URLSearchParams(window.location.search);
        const deepLinkLang = resolveLocaleCode(urlParams.get('lang') || window.currentLang || this.state.lang, DEFAULT_LOCALE);
        const deepLinkLocale = this._applyDocumentLocaleMetadata(deepLinkLang);
        this.state.lang = deepLinkLocale.lang;
        this.state.direction = deepLinkLocale.direction;
        // Reads target case identifier from query string.
        const targetCaseId = urlParams.get('case');
        if (targetCaseId) {
            // Resolves case by localized route slug or ID to support compatibility links.
            const targetCase = this._resolveCaseByRouteSlug(targetCaseId, this.state.lang)
                || this._portfolioCases.find((c) => c.id === targetCaseId);
            if (targetCase) {
                this._logResumeToast('Deep-link case route takes precedence over resume toast', {
                    targetCaseId,
                    matchedCaseId: targetCase.id
                });
                this.setState({
                    currentView: 'case',
                    activeCaseId: targetCase.id,
                    viewHistory: this._buildViewHistoryForDirectRoute('case')
                });
                return;
            }
        }

        if (!this._isResumeToastEnabled()) {
            this._logResumeToast('Resume toast bootstrap skipped because feature is disabled');
            return;
        }

        // Reads persisted resume case ID from local storage.
        const resumeCaseId = localStorage.getItem(RESUME_CASE_ID_STORAGE_KEY);
        const resumeCaseName = localStorage.getItem(RESUME_CASE_NAME_STORAGE_KEY);
        // Reads persisted resume scroll offset from local storage.
        const resumeScrollTop = localStorage.getItem(RESUME_SCROLL_TOP_STORAGE_KEY);
        const toastSuppressed = localStorage.getItem(RESUME_TOAST_SUPPRESSED_STORAGE_KEY) === 'true';
        this._logResumeToast('Read resume payload from localStorage', {
            resumeCaseId,
            resumeCaseName,
            resumeScrollTop,
            toastSuppressed
        });

        if (toastSuppressed) {
            this._logResumeToast('Toast suppressed by persisted preference');
            return;
        }

        if (resumeCaseId && resumeScrollTop) {
            // Resolves resume case metadata to populate toast content.
            const caseData = this._portfolioCases.find(c => c.id === resumeCaseId);
            const parsedScrollTop = Number.parseInt(resumeScrollTop, 10);
            const resolvedCaseName = String(resumeCaseName || this.getLang(caseData?.title) || '').trim();
            if (!caseData || Number.isNaN(parsedScrollTop) || !resolvedCaseName) {
                this._logResumeToast('Resume payload invalid; toast not shown', {
                    hasCaseData: Boolean(caseData),
                    parsedScrollTop,
                    resolvedCaseName
                });
                return;
            }

            if (caseData) {
                this._logResumeToast('Showing resume toast from persisted payload', {
                    caseId: resumeCaseId,
                    caseName: resolvedCaseName,
                    scrollTop: parsedScrollTop
                });
                this._queueResumeToast({
                    content: `${t('resume_reading')} <strong>${resolvedCaseName}</strong>`,
                    caseId: resumeCaseId,
                    scrollTop: parsedScrollTop
                });
            }
            return;
        }

        this._logResumeToast('No resume payload found; toast not shown');
    }

    // MARK: A11Y PREFERENCES AND STATE PATCHING
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

        const storedSource = localStorage.getItem(A11Y_THEME_SOURCE_STORAGE_KEY);
        this._setThemePreferenceSource(this._resolveThemePreferenceSource(storedSource), { persist: false });

        if (this._themePreferenceSource === THEME_SOURCE_AUTO) {
            Object.assign(newA11yState, this._resolveSystemThemeA11yPatch());
        }

        this._commitA11yState(newA11yState, { persist: true });
    }

    _applyA11ySelectionByItem(item) {
        if (!item || typeof item.active !== 'boolean') return;

        const stateKey = A11Y_STATE_KEY_BY_ITEM_ID[item.id];
        if (!stateKey) return;

        this._applyA11yStatePatch(stateKey, item.active);
    }

    _applyA11yStatePatch(stateKey, isActive) {
        if (stateKey === 'darkMode' || stateKey === 'highContrast') {
            this._setThemePreferenceSource(THEME_SOURCE_MANUAL);
        }

        this._commitA11yState({ ...this.state.a11y, [stateKey]: isActive }, { persist: true });
    }

    _openNavigationContextMenu(menuType = 'accessibility') {
        const buttonSelector = menuType === 'language' ? '.language-btn' : '.accessibility-btn';
        const activeHosts = [];

        const registerHost = (menuHost) => {
            if (!(menuHost instanceof HTMLElement)) return;
            if (!activeHosts.includes(menuHost)) {
                activeHosts.push(menuHost);
            }
        };

        const isUsableTriggerButton = (triggerButton) => {
            if (!(triggerButton instanceof HTMLElement)) return false;
            if (triggerButton.hasAttribute('disabled')) return false;
            if (triggerButton.hidden) return false;
            if (triggerButton.getClientRects().length === 0) return false;
            const style = window.getComputedStyle(triggerButton);
            if (!style) return false;
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (style.pointerEvents === 'none') return false;
            return true;
        };

        const resolveNavigationMenuFromHeader = (headerEl) => {
            if (!(headerEl instanceof HTMLElement)) return null;
            const navigationMenu = headerEl.shadowRoot?.querySelector('ds-navigation-menu');
            return navigationMenu instanceof HTMLElement ? navigationMenu : null;
        };

        const resolveGlobalMenuHost = () => {
            const globalHeader = this.shadowRoot.getElementById('global-header');
            return resolveNavigationMenuFromHeader(globalHeader);
        };

        const resolveHomeMenuHost = () => {
            const homeHeader = this.shadowRoot.getElementById('home-view')
                ?.shadowRoot?.querySelector('ds-header');
            return resolveNavigationMenuFromHeader(homeHeader);
        };

        const resolveCaseMenuHost = () => {
            const caseHeader = this.shadowRoot.getElementById('case-view')
                ?.shadowRoot?.querySelector('ds-header');
            return resolveNavigationMenuFromHeader(caseHeader);
        };

        const resolvePlayerMenuHost = () => {
            const playerHeader = this.shadowRoot.getElementById('player-view-host')
                ?.querySelector('ds-player-view')?.shadowRoot?.querySelector('ds-header');
            return resolveNavigationMenuFromHeader(playerHeader);
        };

        const homeMenuHost = resolveHomeMenuHost();
        const caseMenuHost = resolveCaseMenuHost();
        const playerMenuHost = resolvePlayerMenuHost();
        const globalMenuHost = resolveGlobalMenuHost();

        registerHost(globalMenuHost);

        if (this.state.currentView === 'home') registerHost(homeMenuHost);
        if (this.state.currentView === 'case') registerHost(caseMenuHost);
        if (this.state.currentView === 'player') registerHost(playerMenuHost);

        if (activeHosts.length === 0) {
            registerHost(caseMenuHost);
            registerHost(playerMenuHost);
            registerHost(homeMenuHost);
        }

        this._syncNavigationLanguageMenus();

        for (const menuHost of activeHosts) {
            const triggerButton = menuHost?.shadowRoot?.querySelector(buttonSelector);
            if (!isUsableTriggerButton(triggerButton)) continue;
            triggerButton.click();
            this._queueContextualMenuVisibilitySync();
            return true;
        }

        return false;
    }

    _collectNavigationMenuHosts() {
        const roots = this._collectAllOpenShadowRoots(this.shadowRoot);
        const menuHosts = [];

        roots.forEach((root) => {
            root.querySelectorAll('ds-navigation-menu').forEach((menuHost) => {
                if (menuHost instanceof HTMLElement && !menuHosts.includes(menuHost)) {
                    menuHosts.push(menuHost);
                }
            });
        });

        return menuHosts;
    }

    _closeNavigationContextMenus() {
        const menuHosts = this._collectNavigationMenuHosts();
        let didCloseAnyMenu = false;

        menuHosts.forEach((menuHost) => {
            if (!(menuHost instanceof HTMLElement)) return;

            const isOpen = menuHost.hasAttribute('language-menu-open')
                || menuHost.hasAttribute('accessibility-menu-open')
                || Boolean(menuHost.shadowRoot?.querySelector('.language-menu[open], .accessibility-menu[open]'));

            if (!isOpen) return;

            if (typeof menuHost._closeMenus === 'function') {
                menuHost._closeMenus();
            } else {
                const languageMenu = menuHost.shadowRoot?.querySelector('.language-menu');
                const accessibilityMenu = menuHost.shadowRoot?.querySelector('.accessibility-menu');
                if (languageMenu instanceof HTMLElement) {
                    languageMenu.removeAttribute('open');
                }
                if (accessibilityMenu instanceof HTMLElement) {
                    accessibilityMenu.removeAttribute('open');
                }
                menuHost.removeAttribute('language-menu-open');
                menuHost.removeAttribute('accessibility-menu-open');
            }

            didCloseAnyMenu = true;
        });

        return didCloseAnyMenu;
    }

    _getDeepActiveElement(root = document) {
        let activeElement = root?.activeElement || null;

        while (activeElement?.shadowRoot?.activeElement) {
            activeElement = activeElement.shadowRoot.activeElement;
        }

        return activeElement;
    }

    _isEditableTextTarget(node) {
        if (!(node instanceof HTMLElement)) return false;
        if (node.isContentEditable) return true;

        const tagName = String(node.tagName || '').toUpperCase();
        if (tagName === 'TEXTAREA') return true;

        if (tagName === 'INPUT') {
            const inputType = String(node.getAttribute('type') || 'text').toLowerCase();
            return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(inputType);
        }

        const role = String(node.getAttribute('role') || '').toLowerCase();
        if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return true;

        return node.classList?.contains('case-search-input') === true;
    }

    _isTypingInTextControl(event) {
        if (this._isEditableTextTarget(this._getDeepActiveElement())) {
            return true;
        }

        const path = typeof event?.composedPath === 'function' ? event.composedPath() : [event?.target];
        return path.some((node) => this._isEditableTextTarget(node));
    }

    _isShortcutEnterBlockedByInteractiveFocus(event) {
        const isInteractive = (node) => {
            if (!(node instanceof HTMLElement)) return false;
            if (this._isEditableTextTarget(node)) return true;

            const tagName = String(node.tagName || '').toUpperCase();
            if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'OPTION'].includes(tagName)) {
                return true;
            }

            const role = String(node.getAttribute('role') || '').toLowerCase();
            if (['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'switch', 'option', 'combobox', 'textbox', 'searchbox', 'slider', 'spinbutton'].includes(role)) {
                return true;
            }

            return node.tabIndex >= 0;
        };

        if (isInteractive(this._getDeepActiveElement())) {
            return true;
        }

        const path = typeof event?.composedPath === 'function' ? event.composedPath() : [event?.target];
        return path.some((node) => isInteractive(node));
    }

    _handleShortcutOpenPlayer(event) {
        if (this.state.currentView !== 'case') return;
        if (this._isShortcutEnterBlockedByInteractiveFocus(event)) return;

        const activeCase = this._portfolioCases.find((item) => item.id === this.state.activeCaseId) || null;
        if (!activeCase || this._isCaseLocked(activeCase)) return;

        const hasVideo = this._hasLocalizedValue(this._resolveCasePrimaryVideoProp(activeCase));
        if (!hasVideo) return;

        event.preventDefault();
        this._transitionToView({ currentView: 'player', activeCaseId: activeCase.id });
    }

    _dispatchPlayerControlAction(action) {
        if (this.state.currentView !== 'player') return false;

        const playerView = this.shadowRoot
            ?.getElementById('player-view-host')
            ?.querySelector('ds-player-view');
        const controlsEl = playerView?.shadowRoot?.querySelector('ds-video-controls');
        if (!(controlsEl instanceof HTMLElement)) return false;

        controlsEl.dispatchEvent(new CustomEvent('ds-video-action', {
            bubbles: true,
            composed: true,
            detail: { action }
        }));

        return true;
    }

    _handlePlayerControlShortcut(event) {
        if (this.state.currentView !== 'player') return false;

        if (event.code === 'Escape') {
            return this._dispatchPlayerControlAction('stop');
        }

        if (event.altKey || event.ctrlKey || event.metaKey) {
            return false;
        }

        const actionByCode = {
            Space: 'play-pause',
            KeyM: 'mute',
            KeyS: 'speed',
            KeyC: 'cc'
        };

        const action = actionByCode[event.code];
        if (!action) return false;

        return this._dispatchPlayerControlAction(action);
    }

    // MARK: A11Y KEYBOARD SHORTCUTS
    // Handles global keyboard shortcuts that are valid outside text inputs.
    _handleGlobalKeyDown(e) {
        if (e.code === 'Escape') {
            const closedContextMenu = this._closeNavigationContextMenus();
            if (closedContextMenu) {
                e.preventDefault();
                this._queueContextualMenuVisibilitySync();
                return;
            }
        }

        // Ignores shortcuts when user is actively typing in text controls, including shadow-DOM search inputs.
        if (this._isTypingInTextControl(e)) return;

        if (this._handlePlayerControlShortcut(e)) {
            e.preventDefault();
            return;
        }

        const shortcut = matchShortcutEvent(e);
        if (!shortcut) return;

        if (shortcut.action === 'navigateBack' && this._isCaseNavigatorSearchExpanded()) {
            return;
        }

        if (shortcut.action === 'navigateBack' && e.repeat) {
            e.preventDefault();
            return;
        }

        if (shortcut.action === 'openPlayer') {
            this._handleShortcutOpenPlayer(e);
            return;
        }

        e.preventDefault();

        if (shortcut.action === 'toggleA11yModal') {
            this._openNavigationContextMenu('accessibility');
            return;
        }

        if (shortcut.action === 'toggleLanguageModal') {
            this._openNavigationContextMenu('language');
            return;
        }

        if (shortcut.action === 'toggleA11yState' && shortcut.stateKey) {
            const nextValue = !Boolean(this.state.a11y?.[shortcut.stateKey]);
            this._applyA11yStatePatch(shortcut.stateKey, nextValue);
            return;
        }

        if (shortcut.action === 'navigateBack') {
            this._handleShortcutNavigateBack();
            return;
        }

        if (shortcut.action === 'toggleAboutView') {
            this._handleShortcutToggleAboutView();
        }
    }

    _handleShortcutNavigateBack() {
        console.debug('[app-shell][nav] shortcut-navigate-back', {
            source: 'keyboard',
            currentView: this.state.currentView,
            history: this._getNormalizedViewHistory(),
            smartPath: this._buildSmartBreadcrumbViewPath()
        });
        this._handleReturnNavigation({ fromKeyboard: true, source: 'keyboard' });
    }

    _getNormalizedViewHistory() {
        const history = Array.isArray(this.state.viewHistory) && this.state.viewHistory.length > 0
            ? [...this.state.viewHistory]
            : ['home'];
        const currentView = this.state.currentView || history[history.length - 1] || 'home';

        if (history[history.length - 1] !== currentView) {
            history.push(currentView);
        }

        return history.slice(-20);
    }

    _getViewHierarchyLevel(viewId) {
        const levelByView = {
            home: 0,
            case: 1,
            player: 2,
            about: 2
        };

        return Number.isFinite(levelByView[viewId]) ? levelByView[viewId] : 0;
    }

    _resolvePreviousViewNavigation() {
        const history = this._getNormalizedViewHistory();
        const currentView = this.state.currentView || history[history.length - 1] || 'home';

        const smartPath = this._buildSmartBreadcrumbViewPath(currentView);
        if (smartPath.length > 1) {
            const previousView = smartPath[smartPath.length - 2];
            const nextHistory = smartPath.slice(0, -1);
            return {
                previousView,
                nextHistory
            };
        }

        const currentLevel = this._getViewHierarchyLevel(currentView);

        for (let index = history.length - 2; index >= 0; index -= 1) {
            const candidateView = history[index];
            if (!candidateView || candidateView === currentView) continue;

            const candidateLevel = this._getViewHierarchyLevel(candidateView);
            if (candidateLevel >= currentLevel) continue;

            return {
                previousView: candidateView,
                nextHistory: history.slice(0, index + 1)
            };
        }

        return {
            previousView: null,
            nextHistory: ['home']
        };
    }

    _handleReturnNavigation(options = {}) {
        const fromKeyboard = options.fromKeyboard === true;
        const source = String(options.source || 'unknown');

        if (source === 'player-view' && this.state.currentView !== 'player') {
            console.debug('[app-shell][nav] ignore-return-source-mismatch', {
                source,
                currentView: this.state.currentView
            });
            return;
        }

        if (source === 'case-view' && this.state.currentView !== 'case') {
            console.debug('[app-shell][nav] ignore-return-source-mismatch', {
                source,
                currentView: this.state.currentView
            });
            return;
        }

        if (this._closeNavigationContextMenus()) {
            this._queueContextualMenuVisibilitySync();
            return;
        }

        if (fromKeyboard) {
            const now = Date.now();
            if (now - this._lastNavigateBackAt < this._navigateBackDebounceMs) {
                return;
            }
            this._lastNavigateBackAt = now;
        }

        if (this._returnNavigationBurstLock) {
            console.debug('[app-shell][nav] ignore-return-burst', {
                source,
                currentView: this.state.currentView,
                history: this._getNormalizedViewHistory(),
                smartPath: this._buildSmartBreadcrumbViewPath()
            });
            return;
        }

        this._returnNavigationBurstLock = true;
        if (this._returnNavigationBurstTimer) {
            clearTimeout(this._returnNavigationBurstTimer);
        }
        this._returnNavigationBurstTimer = setTimeout(() => {
            this._returnNavigationBurstLock = false;
            this._returnNavigationBurstTimer = null;
        }, 0);

        const { previousView, nextHistory } = this._resolvePreviousViewNavigation();
        console.debug('[app-shell][nav] resolve-return', {
            source,
            triggerType: fromKeyboard ? 'keyboard' : 'breadcrumb',
            currentView: this.state.currentView,
            history: this._getNormalizedViewHistory(),
            smartPath: this._buildSmartBreadcrumbViewPath(),
            previousView,
            nextHistory
        });
        if (!previousView) return;

        const nextState = {
            currentView: previousView,
            viewHistory: nextHistory
        };

        if (previousView === 'home' || previousView === 'about') {
            nextState.activeCaseId = null;
        } else {
            nextState.activeCaseId = this.state.activeCaseId;
        }

        this._transitionToView(nextState);
    }

    _isCaseNavigatorSearchExpanded() {
        const activeNavigator = this.shadowRoot?.querySelector('ds-case-navigator[search-expanded="true"]');
        return activeNavigator instanceof HTMLElement && activeNavigator.getAttribute('search-expanded') === 'true';
    }

    _handleShortcutToggleAboutView() {
        if (this.state.currentView === 'about') {
            this._transitionToView({ currentView: 'home', activeCaseId: null });
            return;
        }

        this._transitionToView({ currentView: 'about' });
        this._queueAboutScrollToTop();
    }

    // MARK: A11Y CLASS AND THEME APPLICATION
    // Applies accessibility class flags on document element for global CSS hooks.
    applyA11ySettings() {
        // Resolves root html element where a11y classes are toggled.
        const htmlEl = document.documentElement;
        // Reads current accessibility state snapshot.
        const settings = this.state.a11y;
        const classNameByStateKey = {
            largeText: 'a11y-large-text',
            dyslexiaFont: 'a11y-dyslexia',
            darkMode: 'a11y-dark-mode',
            highContrast: 'a11y-high-contrast',
            reduceMotion: 'a11y-reduce-motion',
            tabNav: 'a11y-tab-nav'
        };
        // Converts each setting key to class form and toggles it based on value.
        Object.entries(settings).forEach(([key, value]) => {
            const className = classNameByStateKey[key] || `a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            htmlEl.classList.toggle(className, Boolean(value));
        });

        htmlEl.classList.toggle('a11y-forced-colors', this._prefersSystemForcedColors());

        this._applyA11yThemeTokenOverrides(settings);
    }
}

// Registers the root custom element used as the runtime application shell.
customElements.define('app-shell', AppShell);