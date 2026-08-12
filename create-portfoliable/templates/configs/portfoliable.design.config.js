// File: create-portfoliable/configs/portfoliable.design.config.js
// Purpose: Define starter runtime configuration values consumed by the app shell.
// Author: Lio Schimanko

// [MARK: Home view runtime defaults]
// === HOME VIEW CONFIGURATION ===
export default {
  // Configures runtime presentation options rendered in the portfolio Home view.
  homeView: {
    // Sets how many case cards are shown in the initial gallery view.
    itemCount: 8,
    // Chooses the rendering engine mode used by the home view component.
    engine: 'minimal',
    // Controls whether the breadcrumb trail is shown in the UI.
    showBreadcrumb: false,
    // Controls whether language-switch controls are visible to end users.
    showLanguageMenu: true,
    // Home gallery runtime overrides scoped to the Home view template.
    gallery: {
      // Optional desktop spacing between H1 title and gallery container.
      '--ds-home-title-gallery-gap-desktop': '70px',
      // Optional mobile spacing between H1 title and gallery container.
      '--ds-home-title-gallery-gap-mobile': null,
      // Sets the ds-gallery host height in Home view only.
      // Use a CSS size string, e.g. '420px', '52vh', 'min(52vh, 520px)'.
      '--ds-gallery-height': null,
      // Optional mobile-only item height override (applies on compact/mobile breakpoint).
      // When null, HomeView falls back to Valence mobile default token.
      '--ds-gallery-mobile-height': null,
      // Optional base heights by device category before compact/desktop scaling.
      categoryHeights: {
        wearable: null,
        mobile: null,
        tablet: null,
        desktop: null,
        television: null,
        tv: null
      },
      // Optional i18n override labels for GalleryItem pills in Home view.
      // When null, runtime falls back to i18n labels (gallery_pill_pitch/repo/demo).
      pillLabels: {
        pitch: null,
        repo: null,
        demo: null
      }
    },
    // Controls whether the resume-reading toast feature is active.
    resumeToastEnabled: true,
    // Enables console diagnostics for resume toast behavior.
    resumeToastDebug: true
  },

  // [MARK: Visibility and protection defaults]
  // === VISIBILITY CONFIGURATION ===
  visibility: {
    // Controls whether pages are eligible to be listed in app-level web navigation.
    web: true,
    // Controls search-engine indexing defaults (robots metadata).
    crawlers: true,
    // Controls AI indexing/training hints emitted as metadata.
    ai: true,
    // Optional per-locale overrides.
    locales: {}
  },

  // === PROTECTION CONFIGURATION ===
  protection: {
    // Default endpoint for self-hosted PHP deployments.
    // Local `npm run portfoliable` proxies this path to a local PHP server automatically.
    unlockEndpoint: '/api/unlock-case.php'
  },

  // === TRANSITIONS CONFIGURATION ===
  transitions: {
    // Enables native View Transitions shared-element behavior when browser support is available.
    preferNativeSharedElement: false
  },

  // [MARK: Header contract overrides]
  // === HEADER CONFIGURATION ===
  // Controls shared header behavior across home, case, and player views.
  header: {
    visibility: {
      showBreadcrumb: null,
      showLanguageMenu: null,
      showNavigationRegion: null,
      showAbout: null
    },
    navigationRegion: {
      disabled: null,
      language: {
        tooltip: null,
        kbdLabel: null,
        kbdKey: null,
        kbdShowPlus: null,
        ariaLabel: null
      },
      accessibility: {
        tooltip: null,
        kbdLabel: null,
        kbdKey: null,
        kbdShowPlus: null,
        ariaLabel: null
      },
      about: {
        tooltip: null,
        kbdLabel: null,
        kbdKey: null,
        kbdShowPlus: null,
        ariaLabel: null
      }
    },
    // The only intentional non-null default in this config file.
    aboutButton: {
      imageSrc: '/favicon.png',
      imageAlt: null
    },
    breadcrumbMenus: {
      caseReader: {
        caseStudies: {
          itemIcon: null,
          itemIconVariant: 'fill',
          showItemIcon: false
        },
        videos: {
          itemIcon: null,
          itemIconVariant: 'fill',
          showItemIcon: false
        }
      },
      playerView: {
        caseStudies: {
          itemIcon: null,
          itemIconVariant: 'fill',
          showItemIcon: false
        },
        videos: {
          itemIcon: null,
          itemIconVariant: 'fill',
          showItemIcon: false
        }
      }
    }
  },

  // [MARK: Full Valence component override surface]
  // === COMPONENT TOKENS ===
  // Set any value to override the design-system defaults.
  // Keep as null to inherit defaults from Valence.
  components: {
    subAtomic: {
      iconography: {
        '--ds-iconography-color': null,
        '--ds-iconography-size': null,
        '--ds-iconography-stroke-width': null
      },
      mermaidDiagram: {
        '--ds-mermaid-bg': null,
        '--ds-mermaid-border-color': null,
        '--ds-mermaid-radius': null
      }
    },
    atoms: {
      button: {
        '--ds-button-opacity': null,
        '--ds-button-hover-scale': null,
        '--ds-button-active-scale': null,
        '--ds-button-bg': null,
        '--ds-button-hover-bg': null,
        '--ds-button-active-bg': null,
        '--ds-button-border-width': null,
        '--ds-button-border-color': null,
        '--ds-button-radius': null,
        '--ds-button-size': null,
        '--ds-button-image-size': null,
        '--ds-button-icon-size': null,
        '--ds-button-shadow': null
      },
      check: {
        '--ds-check-size': null,
        '--ds-check-border-width': null,
        '--ds-check-border-color': null,
        '--ds-check-bg': null,
        '--ds-check-active-bg': null,
        '--ds-check-radius': null
      },
      divider: {
        '--ds-divider-margin': null,
        '--ds-divider-color': null,
        '--ds-divider-thickness': null
      },
      icon: {
        '--ds-icon-color': null,
        '--ds-icon-size': null,
        '--ds-icon-stroke-width': null
      },
      kbd: {
        '--ds-kbd-bg': null,
        '--ds-kbd-border-width': null,
        '--ds-kbd-border-color': null,
        '--ds-kbd-radius': null,
        '--ds-kbd-color': null,
        '--ds-kbd-padding': null,
        '--ds-kbd-font-size': null,
        '--ds-kbd-font-weight': null
      },
      loader: {
        '--ds-loader-size': null,
        '--ds-loader-color': null,
        '--ds-loader-track-color': null,
        '--ds-loader-stroke-width': null
      },
      metricCard: {
        '--ds-metric-card-bg': null,
        '--ds-metric-card-border-color': null,
        '--ds-metric-card-radius': null,
        '--ds-metric-card-padding': null,
        '--ds-metric-card-title-color': null,
        '--ds-metric-card-value-color': null
      },
      pill: {
        '--ds-pill-bg': null,
        '--ds-pill-color': null,
        '--ds-pill-border-color': null,
        '--ds-pill-radius': null,
        '--ds-pill-padding': null
      },
      radio: {
        '--ds-radio-size': null,
        '--ds-radio-border-width': null,
        '--ds-radio-border-color': null,
        '--ds-radio-active-color': null
      },
      seekBar: {
        '--ds-seekbar-height': null,
        '--ds-seekbar-track-bg': null,
        '--ds-seekbar-fill-bg': null,
        '--ds-seekbar-thumb-size': null,
        '--ds-seekbar-thumb-color': null
      },
      sliderDot: {
        '--ds-slider-dot-size': null,
        '--ds-slider-dot-color': null,
        '--ds-slider-dot-active-color': null
      },
      subtitle: {
        '--ds-subtitle-bg': null,
        '--ds-subtitle-color': null,
        '--ds-subtitle-radius': null,
        '--ds-subtitle-padding': null
      },
      toc: {
        '--ds-toc-position': null,
        '--ds-toc-top': null,
        '--ds-toc-right': null,
        '--ds-toc-bottom': null,
        '--ds-toc-left': null,
        '--ds-toc-transform': null,
        '--ds-toc-max-height': null,
        '--ds-toc-line-height': null,
        '--ds-toc-line-gap': null,
        '--ds-toc-line-color': null,
        '--ds-toc-line-active-color': null,
        '--ds-toc-top-line-width': null,
        '--ds-toc-top-line-gap': null
      },
      tab: {
        '--ds-tab-bg': null,
        '--ds-tab-color': null,
        '--ds-tab-active-bg': null,
        '--ds-tab-active-color': null,
        '--ds-tab-radius': null
      },
      thumbnail: {
        '--ds-thumbnail-bg': null,
        '--ds-thumbnail-radius': null,
        '--ds-thumbnail-border-color': null,
        '--ds-thumbnail-shadow': null
      },
      toggle: {
        '--ds-toggle-width': null,
        '--ds-toggle-height': null,
        '--ds-toggle-bg': null,
        '--ds-toggle-active-bg': null,
        '--ds-toggle-knob-size': null,
        '--ds-toggle-knob-bg': null
      }
    },
    molecules: {
      audioPlayer: {
        '--ds-audio-player-bg': null,
        '--ds-audio-player-border-color': null,
        '--ds-audio-player-radius': null,
        '--ds-audio-player-padding': null
      },
      breadcrumb: {
        '--ds-breadcrumb-gap': null,
        '--ds-breadcrumb-separator-color': null,
        '--ds-breadcrumb-link-color': null,
        '--ds-breadcrumb-link-active-color': null
      },
      caseNavigator: {
        '--ds-case-navigator-gap': null,
        '--ds-case-navigator-bg': null,
        '--ds-case-navigator-padding': null,
        '--ds-case-navigator-height': null,
        '--ds-case-navigator-radius': null,
        '--ds-case-navigator-border-width': null,
        '--ds-case-navigator-border-style': null,
        '--ds-case-navigator-border-color': null,
        '--ds-case-navigator-menu-width': null,
        '--ds-case-navigator-menu-bg': null,
        '--ds-case-navigator-menu-border-color': null,
        '--ds-case-navigator-menu-radius': null,
        '--ds-case-navigator-menu-shadow': null
      },
      comboTabs: {
        '--ds-combo-tabs-gap': null,
        '--ds-combo-tabs-bg': null,
        '--ds-combo-tabs-radius': null
      },
      galleryItem: {
        '--ds-gallery-item-bg': null,
        '--ds-gallery-item-border-color': null,
        '--ds-gallery-item-radius': null,
        '--ds-gallery-item-padding': null,
        '--ds-gallery-item-title-color': null,
        '--ds-gallery-item-text-color': null,
        '--ds-gallery-item-protected-blur': null
      },
      itemRow: {
        '--ds-item-row-height': null,
        '--ds-item-row-padding': null,
        '--ds-item-row-gap': null,
        '--ds-item-row-bg': null,
        '--ds-item-row-hover-bg': null,
        '--ds-item-row-active-bg': null,
        '--ds-item-row-border-color': null,
        '--ds-item-row-color': null
      },
      navigationMenu: {
        '--ds-navigation-menu-gap': null,
        '--ds-navigation-visual-size': null,
        '--ds-navigation-icon-color': null,
        '--ds-navigation-icon-hover-bg': null,
        '--ds-navigation-icon-active-bg': null,
        '--ds-navigation-avatar-bg': null,
        '--ds-navigation-contextual-width': null
      },
      summary: {
        '--ds-summary-bg': null,
        '--ds-summary-border-color': null,
        '--ds-summary-radius': null,
        '--ds-summary-padding': null,
        '--ds-summary-title-color': null,
        '--ds-summary-text-color': null
      },
      toast: {
        '--ds-toast-bg': null,
        '--ds-toast-color': null,
        '--ds-toast-border-color': null,
        '--ds-toast-radius': null,
        '--ds-toast-padding': null,
        '--ds-toast-shadow': null
      },
      tooltip: {
        '--ds-tooltip-bg': null,
        '--ds-tooltip-radius': null,
        '--ds-tooltip-border-width': null,
        '--ds-tooltip-border-color': null,
        '--tooltip-gap': null,
        '--tooltip-slide': null,
        '--ds-tooltip-color': null,
        '--ds-tooltip-padding': null
      },
      videoControls: {
        '--ds-video-controls-bg': null,
        '--ds-video-controls-border-color': null,
        '--ds-video-controls-radius': null,
        '--ds-video-controls-padding': null,
        '--ds-video-controls-gap': null
      }
    },
    organisms: {
      article: {
        '--ds-article-max-width': null
      },
      comboCard: {
        '--ds-combo-card-bg': null,
        '--ds-combo-card-border-color': null,
        '--ds-combo-card-radius': null,
        '--ds-combo-card-padding': null
      },
      contextualMenu: {
        '--ds-contextual-menu-width': null,
        '--ds-contextual-menu-min-width': null,
        '--ds-contextual-menu-max-height': null,
        '--ds-contextual-menu-bg': null,
        '--ds-contextual-menu-radius': null,
        '--ds-contextual-menu-border-color': null,
        '--ds-contextual-menu-shadow': null
      },
      gallery: {
        '--ds-gallery-gap': null,
        '--ds-gallery-padding': null,
        '--ds-gallery-card-width': null,
        '--ds-gallery-card-height': null
      },
      header: {
        '--ds-header-gap': null,
        '--ds-header-min-height': null,
        '--ds-header-padding': null,
        '--ds-header-bg': null,
        '--ds-header-border-color': null
      },
      videoPlayer: {
        '--ds-video-player-bg': null,
        '--ds-video-player-radius': null,
        '--ds-video-player-border-color': null,
        '--ds-video-player-shadow': null
      }
    },
    templates: {
      caseView: {
        '--ds-case-view-bg': null,
        '--ds-case-view-gap': null,
        '--ds-case-view-padding': null
      },
      homeView: {
        '--ds-home-view-bg': null,
        '--ds-home-view-gap': null,
        '--ds-home-view-padding': null,
        '--ds-home-view-title-color': null,
        '--ds-home-view-footer-color': null
      },
      playerView: {
        '--player-view-bg': null,
        '--player-view-fg': null,
        '--player-view-bg-dark': null,
        '--player-view-fg-dark': null,
        '--player-view-bg-high-contrast': null,
        '--player-view-fg-high-contrast': null,
        '--player-view-stage-gap': null,
        '--player-view-thumbnail-width': null,
        '--player-view-thumbnail-height': null,
        '--player-view-controls-width': null,
        '--player-view-viewport-padding': null,
        '--player-view-viewport-inline-padding': null,
        '--player-view-viewport-bottom-padding': null
      }
    }
  },


  // [MARK: Article design token overrides]
  // === ARTICLE CONFIGURATION ===
  // Central place for end users to tweak article layout, typography, media, and content surfaces.
  // Leave values as `null` to keep the design-system defaults from article.css.
  article: {
    layout: {
      '--ds-article-max-width': null,
      '--ds-article-padding': null,
      '--ds-article-copy-width': null,
      '--ds-article-header-gap': null,
      '--ds-article-title-gap': null,
      '--ds-article-stack-gap': null,
      '--ds-article-body-gap': null,
      '--ds-article-subtitle-max-width': null,
      '--ds-article-media-width': null
    },
    typography: {
      '--ds-article-kicker-size': null,
      '--ds-article-kicker-color': null,
      '--ds-article-title-size': null,
      '--ds-article-title-color': null,
      '--ds-article-subtitle-size': null,
      '--ds-article-subtitle-color': null,
      '--ds-article-h1-size': null,
      '--ds-article-h1-letter-spacing': null,
      '--ds-article-h1-line-height': null,
      '--ds-article-h2-size': null,
      '--ds-article-h2-letter-spacing': null,
      '--ds-article-h2-line-height': null,
      '--ds-article-h3-size': null,
      '--ds-article-h3-letter-spacing': null,
      '--ds-article-h3-line-height': null,
      '--ds-article-h3-margin-top': null,
      '--ds-article-h4-size': null,
      '--ds-article-h4-letter-spacing': null,
      '--ds-article-h4-line-height': null,
      '--ds-article-h5-size': null,
      '--ds-article-h5-letter-spacing': null,
      '--ds-article-h5-line-height': null,
      '--ds-article-h6-size': null,
      '--ds-article-h6-weight': null,
      '--ds-article-h6-letter-spacing': null,
      '--ds-article-h6-line-height': null,
      '--ds-article-heading-color': null,
      '--ds-article-heading-muted-color': null,
      '--ds-article-heading-weight': null,
      '--ds-article-paragraph-weight': null,
      '--ds-article-paragraph-size': null,
      '--ds-article-paragraph-letter-spacing': null,
      '--ds-article-paragraph-line-height': null,
      '--ds-article-paragraph-color': null,
      '--ds-article-subtext-weight': null,
      '--ds-article-subtext-size': null,
      '--ds-article-subtext-letter-spacing': null,
      '--ds-article-subtext-line-height': null,
      '--ds-article-paragraph-muted-color': null,
      '--ds-article-secondary-paragraph-color': null,
      '--ds-article-tertiary-weight': null,
      '--ds-article-tertiary-size': null,
      '--ds-article-tertiary-letter-spacing': null,
      '--ds-article-tertiary-line-height': null,
      '--ds-article-list-weight': null,
      '--ds-article-list-size': null,
      '--ds-article-list-letter-spacing': null,
      '--ds-article-list-line-height': null,
      '--ds-article-list-color': null,
      '--ds-article-list-marker-color': null,
      '--ds-article-blockquote-margin': null,
      '--ds-article-blockquote-padding': null,
      '--ds-article-blockquote-bg': null,
      '--ds-article-blockquote-border-width': null,
      '--ds-article-blockquote-border-color': null,
      '--ds-article-blockquote-radius': null,
      '--ds-article-blockquote-weight': null,
      '--ds-article-blockquote-size': null,
      '--ds-article-blockquote-letter-spacing': null,
      '--ds-article-blockquote-line-height': null,
      '--ds-article-blockquote-color': null,
      '--ds-article-footnote-size': null,
      '--ds-article-footnote-color': null,
      '--ds-article-footnote-link-color': null,
      '--ds-article-footnote-link-decoration': null,
      '--ds-article-footnote-link-offset': null,
      '--ds-article-footnote-link-weight': null,
      '--ds-article-footnote-link-padding': null
    },
    media: {
      '--ds-article-summary-width': null,
      '--ds-article-summary-max-width': null,
      '--ds-article-media-width': null,
      '--ds-article-image-radius': null,
      '--ds-article-image-margin': null,
      '--ds-article-figure-margin': null,
      '--ds-article-caption-size': null,
      '--ds-article-caption-color': null,
      '--ds-article-caption-margin-top': null,
      '--ds-article-caption-weight': null,
      '--ds-article-mermaid-margin': null,
      '--ds-article-mermaid-align': null
    },
    cover: {
      '--ds-article-cover-padding': null,
      '--ds-article-cover-radius': null,
      '--ds-article-cover-bg': null,
      '--ds-article-cover-border-color': null,
      '--ds-article-cover-max-height': null
    },
    social: {
      '--ds-article-social-opacity': null,
      '--ds-article-social-color': null,
      '--ds-article-social-gap': null,
      '--ds-article-social-button-size': null
    },
    code: {
      '--ds-article-code-margin': null,
      '--ds-article-code-padding': null,
      '--ds-article-code-bg': null,
      '--ds-article-code-border-width': null,
      '--ds-article-code-border-color': null,
      '--ds-article-code-radius': null,
      '--ds-article-code-font-family': null,
      '--ds-article-code-font-size': null,
      '--ds-article-code-line-height': null,
      '--ds-article-code-color': null,
      '--ds-article-code-shadow': null,
      '--ds-article-inline-code-font-family': null,
      '--ds-article-inline-code-size': null,
      '--ds-article-inline-code-padding': null,
      '--ds-article-inline-code-radius': null,
      '--ds-article-inline-code-color': null,
      '--ds-article-inline-code-bg': null
    },
    tables: {
      '--ds-article-table-width': null,
      '--ds-article-table-margin': null,
      '--ds-article-table-weight': null,
      '--ds-article-table-font-size': null,
      '--ds-article-table-letter-spacing': null,
      '--ds-article-table-line-height': null,
      '--ds-article-table-bg': null,
      '--ds-article-table-border-width': null,
      '--ds-article-table-border-color': null,
      '--ds-article-table-radius': null,
      '--ds-article-table-cell-padding': null,
      '--ds-article-table-cell-border-width': null,
      '--ds-article-table-text-color': null,
      '--ds-article-table-header-weight': null,
      '--ds-article-table-header-size': null,
      '--ds-article-table-header-transform': null,
      '--ds-article-table-header-letter-spacing': null,
      '--ds-article-table-header-bg': null,
      '--ds-article-table-header-color': null,
      '--ds-article-table-hover-bg': null
    },
    content: {
      '--ds-article-mark-bg': null,
      '--ds-article-link-color': null,
      '--ds-article-link-hover-color': null,
      '--ds-article-definition-margin': null,
      '--ds-article-definition-term-weight': null,
      '--ds-article-definition-term-color': null,
      '--ds-article-definition-term-margin-top': null,
      '--ds-article-definition-indent': null,
      '--ds-article-definition-color': null,
      '--ds-article-definition-margin-bottom': null,
      '--ds-article-details-margin': null,
      '--ds-article-details-padding': null,
      '--ds-article-details-bg': null,
      '--ds-article-details-border-width': null,
      '--ds-article-details-border-color': null,
      '--ds-article-details-radius': null,
      '--ds-article-details-summary-weight': null,
      '--ds-article-details-summary-color': null,
      '--ds-article-details-summary-margin-bottom': null,
      '--ds-article-details-summary-border-width': null,
      '--ds-article-details-summary-padding-bottom': null,
      '--ds-article-kbd-font-family': null,
      '--ds-article-kbd-size': null,
      '--ds-article-kbd-weight': null,
      '--ds-article-kbd-padding': null,
      '--ds-article-kbd-margin': null,
      '--ds-article-kbd-color': null,
      '--ds-article-kbd-bg': null,
      '--ds-article-kbd-border-width': null,
      '--ds-article-kbd-border-color': null,
      '--ds-article-kbd-radius': null,
      '--ds-article-kbd-shadow': null
    }
  },
  // [MARK: Global theme token seed]
  // === THEME TOKENS ===
  // Provides initial design tokens that map to CSS custom properties.
  themeTokens: {
    '--color-bg': null,
    '--color-black': null
  }
};
