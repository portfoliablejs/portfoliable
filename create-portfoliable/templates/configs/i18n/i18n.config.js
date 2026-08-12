// File: templates/configs/i18n/i18n.config.js
// Purpose: Provide runtime language configuration, translation resolution, and i18n helpers.
// Author: Lio Schimanko

// MARK: IMPORTS
// Loads static translation labels and keyboard shortcut bindings used for runtime labels.
import labelsByLocale from './i18n.labels.js';
import { getShortcutDisplay, shortcutLabelBindings } from '../portfoliable.a11y.config.js';

// MARK: LOCALE SOURCE OF TRUTH
// Add/remove locales here. Keep keys quoted so Node scripts can parse this object reliably.
export const LANGUAGE_CONFIG = Object.freeze({
  "en": {
    "name": "English",
    "htmlLang": "en-US"
  },
  "he": {
    "name": "עברית",
    "htmlLang": "he-IL"
  }
});

export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = Object.freeze(Object.keys(LANGUAGE_CONFIG));

// Canonical list of RTL locale codes for direction detection.
export const RTL_LOCALE_CODES = Object.freeze([
  "arc",
  "az-arab",
  "azb",
  "bal-arab",
  "ckb",
  "dv",
  "fa",
  "ff-adlm",
  "glk",
  "ha-arab",
  "he",
  "khw",
  "ks-arab",
  "ku-arab",
  "lrc",
  "mzn",
  "nqo",
  "pa-arab",
  "pnb",
  "ps",
  "sd",
  "syr",
  "ug",
  "ur",
  "yi"
]);

// MARK: LOCALE NORMALIZATION
// Normalizes arbitrary locale input into a lowercased canonical code.
export function normalizeLocaleCode(value) {
  return String(value || '').trim().toLowerCase();
}

// Resolves a locale to one of SUPPORTED_LOCALES or falls back to DEFAULT_LOCALE.
export function resolveLocaleCode(value, fallback = DEFAULT_LOCALE) {
  const normalized = normalizeLocaleCode(value);
  if (SUPPORTED_LOCALES.includes(normalized)) {
    return normalized;
  }
  return fallback;
}

// Returns true when a locale or its base language code is RTL.
export function isRtlLocaleCode(value) {
  const normalized = normalizeLocaleCode(value);
  if (!normalized) return false;
  if (RTL_LOCALE_CODES.includes(normalized)) return true;
  const baseLocale = normalized.split('-')[0];
  return RTL_LOCALE_CODES.includes(baseLocale);
}

// Resolves text direction for a locale with safe fallback behavior.
export function resolveLocaleDirection(value, fallback = 'ltr') {
  const normalized = normalizeLocaleCode(value);
  if (isRtlLocaleCode(normalized)) {
    return 'rtl';
  }
  if (SUPPORTED_LOCALES.includes(normalized)) {
    return 'ltr';
  }
  return fallback === 'rtl' ? 'rtl' : 'ltr';
}

// MARK: LABEL RESOLUTION
// Returns a human-readable language name from config, Intl, or locale code fallback.
export function getLanguageDisplayName(localeCode) {
  const normalized = resolveLocaleCode(localeCode, DEFAULT_LOCALE);
  const configured = LANGUAGE_CONFIG[normalized]?.name;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim();
  }

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames([normalized], { type: 'language' });
      const resolved = displayNames.of(normalized);
      if (resolved && resolved !== normalized) {
        return resolved;
      }
    }
  } catch {
    // Uses locale code fallback below.
  }

  return normalized;
}

// MARK: ACTIVE LOCALE RESOLUTION
// Resolves current locale from path segment, then query param, then default.
function resolveActiveLanguage() {
  const pathSegments = String(window.location.pathname || '')
    .split('/')
    .filter(Boolean)
    .map((segment) => normalizeLocaleCode(segment));
  const pathLocale = pathSegments[0] || '';
  if (SUPPORTED_LOCALES.includes(pathLocale)) {
    return pathLocale;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = normalizeLocaleCode(urlParams.get('lang'));
  if (SUPPORTED_LOCALES.includes(urlLang)) {
    return urlLang;
  }

  return DEFAULT_LOCALE;
}

// MARK: SHORTCUT MARKUP HELPERS
// Appends kbd markup to a base label when a shortcut is available.
function appendShortcutLabel(baseLabel, shortcutValue, kbdClass = '') {
  if (!baseLabel || !shortcutValue) return baseLabel;
  const classMarkup = kbdClass ? ` class="${kbdClass}"` : '';
  return `${baseLabel} <kbd${classMarkup}>${shortcutValue}</kbd>`;
}

// Keys that remain plain text without runtime kbd markup.
const SKIP_SHORTCUT_MARKUP_KEYS = new Set([
  'btn_return',
  'a11y_size',
  'a11y_dark',
  'a11y_contrast',
  'a11y_motion',
  'a11y_tab',
  'a11y_dyslexia'
]);

// MARK: TRANSLATION MAP BOOTSTRAP
// Builds localized runtime labels by merging default-locale labels with per-locale overrides.
function buildRuntimeTranslations() {
  const baseTranslations = labelsByLocale && typeof labelsByLocale === 'object'
    ? labelsByLocale
    : {};
  const runtime = {};

  SUPPORTED_LOCALES.forEach((localeCode) => {
    runtime[localeCode] = {
      ...(baseTranslations[DEFAULT_LOCALE] || {}),
      ...(baseTranslations[localeCode] || {})
    };

    // Always expose explicit localized language labels for contextual menu rendering.
    runtime[localeCode][`lang_${localeCode}`] = getLanguageDisplayName(localeCode);
  });

  Object.entries(shortcutLabelBindings).forEach(([translationKey, binding]) => {
    if (SKIP_SHORTCUT_MARKUP_KEYS.has(translationKey)) return;

    const shortcutValue = getShortcutDisplay(binding.shortcutId);
    if (!shortcutValue) return;

    SUPPORTED_LOCALES.forEach((localeCode) => {
      const baseLabel = runtime[localeCode]?.[translationKey];
      runtime[localeCode][translationKey] = appendShortcutLabel(baseLabel, shortcutValue, binding.kbdClass || '');
    });
  });

  return runtime;
}

// Builds the immutable runtime translation cache once at module load.
const runtimeTranslations = buildRuntimeTranslations();

// MARK: DOCUMENT LANGUAGE BOOTSTRAP
// Initializes the active locale and applies lang/dir metadata to the document element.
window.currentLang = resolveActiveLanguage();
const htmlLangTag = LANGUAGE_CONFIG[window.currentLang]?.htmlLang || window.currentLang;
document.documentElement.lang = htmlLangTag;
document.documentElement.dir = resolveLocaleDirection(window.currentLang, 'ltr');

// MARK: PUBLIC TRANSLATION API
// Exposes runtime translation maps and keys requiring plain text insertion.
export const translations = runtimeTranslations;
const PLAIN_TEXT_I18N_KEYS = new Set(['h1_title']);

// Returns translated value for the active locale with fallback to default locale and key.
export function t(key) {
  const activeLocale = resolveLocaleCode(window.currentLang, DEFAULT_LOCALE);
  return translations[activeLocale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key;
}

// MARK: DOM TRANSLATION APPLIER
// Applies translations to data-i18n nodes.
export function applyTranslations() {
  // Applies runtime labels to any document node annotated with data-i18n.
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;

    const activeLocale = resolveLocaleCode(window.currentLang, DEFAULT_LOCALE);
    if (translations[activeLocale] && translations[activeLocale][key]) {
      const localizedValue = translations[activeLocale][key];
      if (PLAIN_TEXT_I18N_KEYS.has(key)) {
        el.textContent = localizedValue;
      } else {
        el.innerHTML = localizedValue;
      }
    }
  });
}

// Runs one translation pass once the initial document is ready.
document.addEventListener('DOMContentLoaded', applyTranslations);
