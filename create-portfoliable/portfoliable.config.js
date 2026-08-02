// File: create-portfoliable/portfoliable.config.js
// Purpose: Define starter runtime configuration values consumed by the app shell.
// Author: Lio Schimanko

// === HOME VIEW CONFIGURATION ===
export default {
  // Configures text and runtime options rendered in the portfolio home view.
  homeView: {
    // Defines localized title strings displayed in the home header area.
    title: {
      en: 'Edit Title at /portfoliable.config.js',
      pt: 'Seu Template de Portfolio'
    },
    // Defines localized footer strings displayed at the bottom of the home view.
    footer: {
      en: 'Edit footer at /portfoliable.config.js',
      pt: 'Rodape template. Substitua pelo seu texto legal.'
    },
    // Sets how many case cards are shown in the initial gallery view.
    itemCount: 6,
    // Chooses the rendering engine mode used by the home view component.
    engine: 'minimal',
    // Controls whether the breadcrumb trail is shown in the UI.
    showBreadcrumb: false,
    // Controls whether language-switch controls are visible to end users.
    showLanguageMenu: true
  },
  // === THEME TOKENS ===
  // Provides initial design tokens that map to CSS custom properties.
  themeTokens: {
    '--color-bg': '#FFFFFF',
    '--color-black': '#000000'
  }
};
