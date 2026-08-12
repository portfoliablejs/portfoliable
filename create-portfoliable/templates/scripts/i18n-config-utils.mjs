// File: scripts/i18n-config-utils.mjs
// Purpose: Read i18n language config from template/consumer i18n config files in Node scripts.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';

// MARK: CONFIG PATTERNS
const LANGUAGE_CONFIG_REGEX = /export\s+const\s+LANGUAGE_CONFIG\s*=\s*Object\.freeze\(\s*(\{[\s\S]*?\})\s*\);/;
const DEFAULT_LOCALE_REGEX = /export\s+const\s+DEFAULT_LOCALE\s*=\s*['\"]([^'\"]+)['\"]/;
const RTL_LOCALE_CODES_REGEX = /export\s+const\s+RTL_LOCALE_CODES\s*=\s*Object\.freeze\(\s*(\[[\s\S]*?\])\s*\);/;

// MARK: PARSING HELPERS
// Parses exported config literals while supporting JSON and JS object syntax.
function parseConfigLiteral(literalText, fallbackValue) {
  const raw = String(literalText || '').trim();
  if (!raw) return fallbackValue;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      const evaluateLiteral = new Function(`return (${raw});`);
      return evaluateLiteral();
    } catch {
      return fallbackValue;
    }
  }
}

// MARK: PUBLIC API
// Reads locale defaults and language config from the i18n config source file.
export function readLocaleConfigFromI18nConfig(i18nConfigPath) {
  const fallback = {
    defaultLocale: '',
    supportedLocales: [],
    rtlLocaleCodes: [],
    languageConfig: {}
  };

  if (!fs.existsSync(i18nConfigPath)) {
    return fallback;
  }

  const source = fs.readFileSync(i18nConfigPath, 'utf8');
  const defaultLocaleMatch = source.match(DEFAULT_LOCALE_REGEX);
  const defaultLocale = String(defaultLocaleMatch?.[1] || fallback.defaultLocale).trim().toLowerCase();

  let parsedRtlLocaleCodes = [...fallback.rtlLocaleCodes];
  const rtlLocaleCodesMatch = source.match(RTL_LOCALE_CODES_REGEX);
  if (rtlLocaleCodesMatch?.[1]) {
    const parsed = parseConfigLiteral(rtlLocaleCodesMatch[1], null);
    if (Array.isArray(parsed)) {
      parsedRtlLocaleCodes = parsed
        .map((value) => String(value || '').trim().toLowerCase())
        .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
    }
  }

  const languageConfigMatch = source.match(LANGUAGE_CONFIG_REGEX);
  if (!languageConfigMatch?.[1]) {
    return {
      ...fallback,
      defaultLocale,
      rtlLocaleCodes: parsedRtlLocaleCodes
    };
  }

  let parsedLanguageConfig = {};
  parsedLanguageConfig = parseConfigLiteral(languageConfigMatch[1], null);
  if (!parsedLanguageConfig || typeof parsedLanguageConfig !== 'object' || Array.isArray(parsedLanguageConfig)) {
    return {
      ...fallback,
      defaultLocale,
      rtlLocaleCodes: parsedRtlLocaleCodes
    };
  }

  const supportedLocales = Object.keys(parsedLanguageConfig)
    .map((localeCode) => String(localeCode || '').trim().toLowerCase())
    .filter((localeCode, index, list) => localeCode.length > 0 && list.indexOf(localeCode) === index);

  if (supportedLocales.length === 0) {
    return {
      ...fallback,
      defaultLocale,
      rtlLocaleCodes: parsedRtlLocaleCodes
    };
  }

  return {
    defaultLocale: supportedLocales.includes(defaultLocale) ? defaultLocale : supportedLocales[0],
    supportedLocales,
    rtlLocaleCodes: parsedRtlLocaleCodes,
    languageConfig: parsedLanguageConfig
  };
}

// Resolves template, consumer, and legacy i18n config paths in priority order.
export function resolveI18nConfigPath(cwd = process.cwd()) {
  const templatePath = path.join(cwd, 'templates', 'configs', 'i18n', 'i18n.config.js');
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }

  const consumerPath = path.join(cwd, 'configs', 'i18n', 'i18n.config.js');
  if (fs.existsSync(consumerPath)) {
    return consumerPath;
  }

  const legacyTemplatePath = path.join(cwd, 'templates', 'configs', 'i18n.config.js');
  if (fs.existsSync(legacyTemplatePath)) {
    return legacyTemplatePath;
  }

  const legacyConsumerPath = path.join(cwd, 'configs', 'i18n.config.js');
  if (fs.existsSync(legacyConsumerPath)) {
    return legacyConsumerPath;
  }

  return templatePath;
}
