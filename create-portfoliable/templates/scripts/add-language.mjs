#!/usr/bin/env node
// File: scripts/add-language.mjs
// Purpose: Add/update a locale in i18n config and propagate localized stubs across labels/about/cases.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import { readLocaleConfigFromI18nConfig, resolveI18nConfigPath } from './i18n-config-utils.mjs';
import { runLocaleSync } from './sync-locales.mjs';

// MARK: CONFIG PATTERNS
const LANGUAGE_CONFIG_REGEX = /export\s+const\s+LANGUAGE_CONFIG\s*=\s*Object\.freeze\(\s*(\{[\s\S]*?\})\s*\);/;
const RTL_LOCALE_CODES_REGEX = /export\s+const\s+RTL_LOCALE_CODES\s*=\s*Object\.freeze\(\s*(\[[\s\S]*?\])\s*\);/;

// MARK: ARGUMENT AND LITERAL PARSING
// Parses object-like CLI literals as JSON first, then falls back to JS object syntax.
function parseConfigLiteral(literalText, fallbackValue = null) {
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

// Parses supported CLI flags for locale code, display name, html lang, and direction.
function parseArgs(argv) {
  const parsed = {
    code: '',
    name: '',
    htmlLang: '',
    direction: ''
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--code') {
      parsed.code = String(argv[i + 1] || '').trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === '--name') {
      parsed.name = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }

    if (token === '--html-lang' || token === '--htmlLang') {
      parsed.htmlLang = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }

    if (token === '--direction') {
      parsed.direction = String(argv[i + 1] || '').trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === '--rtl') {
      parsed.direction = 'rtl';
      continue;
    }

    if (token === '--ltr') {
      parsed.direction = 'ltr';
      continue;
    }
  }

  return parsed;
}

// Derives a default html lang value from a locale code when one is not supplied.
function toDefaultHtmlLang(localeCode) {
  const parts = String(localeCode || '').split('-').filter(Boolean);
  const base = String(parts[0] || '').toLowerCase();
  if (!base) return 'en-US';

  if (parts.length > 1) {
    return `${base}-${parts[1].toUpperCase()}`;
  }

  return `${base}-${base.toUpperCase()}`;
}

// Validates locale code syntax used by i18n config keys.
function validateLocaleCode(localeCode) {
  return /^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(String(localeCode || '').trim());
}

// Validates writing direction values accepted by runtime locale metadata.
function validateDirection(direction) {
  return direction === 'rtl' || direction === 'ltr';
}

// Serializes LANGUAGE_CONFIG back into the expected frozen export format.
function formatLanguageConfigBlock(nextLanguageConfig) {
  return `export const LANGUAGE_CONFIG = Object.freeze(${JSON.stringify(nextLanguageConfig, null, 2)});`;
}

// Serializes RTL locale list into the expected frozen export format.
function formatRtlLocaleCodesBlock(nextRtlLocaleCodes) {
  return `export const RTL_LOCALE_CODES = Object.freeze(${JSON.stringify(nextRtlLocaleCodes, null, 2)});`;
}

// MARK: LANGUAGE MUTATION WORKFLOW
// Adds or updates one locale entry and then syncs locale-dependent content files.
export async function runAddLanguage(options = {}) {
  const cwd = options.cwd || process.cwd();
  const localeCode = String(options.code || '').trim().toLowerCase();
  const displayName = String(options.name || '').trim();
  const htmlLang = String(options.htmlLang || '').trim() || toDefaultHtmlLang(localeCode);
  const requestedDirection = String(options.direction || '').trim().toLowerCase();
  const direction = requestedDirection || 'ltr';

  if (!validateLocaleCode(localeCode)) {
    throw new Error('Invalid locale code. Use values like "it", "es", or "pt-BR".');
  }

  if (!displayName) {
    throw new Error('Missing language display name. Use --name "Italiano".');
  }

  if (!validateDirection(direction)) {
    throw new Error('Invalid direction. Use --direction ltr or --direction rtl (or --rtl/--ltr).');
  }

  const i18nConfigPath = resolveI18nConfigPath(cwd);
  if (!fs.existsSync(i18nConfigPath)) {
    throw new Error(`Could not find i18n config file at ${i18nConfigPath}`);
  }

  const source = fs.readFileSync(i18nConfigPath, 'utf8');
  const languageConfigMatch = source.match(LANGUAGE_CONFIG_REGEX);
  if (!languageConfigMatch?.[1]) {
    throw new Error(`LANGUAGE_CONFIG block was not found in ${i18nConfigPath}`);
  }

  let languageConfig = {};
  let rtlLocaleCodes = [];
  languageConfig = parseConfigLiteral(languageConfigMatch[1], null);
  if (!languageConfig || typeof languageConfig !== 'object' || Array.isArray(languageConfig)) {
    throw new Error(`LANGUAGE_CONFIG is not valid JSON in ${i18nConfigPath}`);
  }

  const rtlLocaleCodesMatch = source.match(RTL_LOCALE_CODES_REGEX);
  if (rtlLocaleCodesMatch?.[1]) {
    const parsed = parseConfigLiteral(rtlLocaleCodesMatch[1], null);
    if (Array.isArray(parsed)) {
      rtlLocaleCodes = parsed;
    } else {
      throw new Error(`RTL_LOCALE_CODES is not valid JSON in ${i18nConfigPath}`);
    }
  }

  rtlLocaleCodes = rtlLocaleCodes
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);

  const existed = Boolean(languageConfig[localeCode]);
  const currentEntry = existed ? languageConfig[localeCode] : null;
  const currentName = String(currentEntry?.name || '').trim();
  const currentHtmlLang = String(currentEntry?.htmlLang || '').trim();
  const currentlyRtl = rtlLocaleCodes.includes(localeCode);
  const wantsRtl = direction === 'rtl';
  const unchanged = existed && currentName === displayName && currentHtmlLang === htmlLang && currentlyRtl === wantsRtl;

  if (unchanged) {
    const localeConfig = readLocaleConfigFromI18nConfig(i18nConfigPath);
    return {
      existed,
      unchanged: true,
      localeCode,
      displayName,
      htmlLang,
      direction,
      i18nConfigPath,
      localeCodes: localeConfig.supportedLocales,
      syncResult: { updatedFiles: 0, localeCodes: localeConfig.supportedLocales }
    };
  }

  languageConfig[localeCode] = {
    name: displayName,
    htmlLang
  };

  if (wantsRtl) {
    if (!rtlLocaleCodes.includes(localeCode)) {
      rtlLocaleCodes.push(localeCode);
    }
  } else {
    rtlLocaleCodes = rtlLocaleCodes.filter((code) => code !== localeCode);
  }

  rtlLocaleCodes = rtlLocaleCodes
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));

  const nextBlock = formatLanguageConfigBlock(languageConfig);
  let nextSource = source.replace(LANGUAGE_CONFIG_REGEX, nextBlock);
  if (RTL_LOCALE_CODES_REGEX.test(nextSource)) {
    nextSource = nextSource.replace(RTL_LOCALE_CODES_REGEX, formatRtlLocaleCodesBlock(rtlLocaleCodes));
  }

  if (nextSource !== source) {
    fs.writeFileSync(i18nConfigPath, nextSource, 'utf8');
  }

  const syncResult = await runLocaleSync({ cwd });
  const localeConfig = readLocaleConfigFromI18nConfig(i18nConfigPath);

  return {
    existed,
    unchanged: false,
    localeCode,
    displayName,
    htmlLang,
    direction,
    i18nConfigPath,
    localeCodes: localeConfig.supportedLocales,
    syncResult
  };
}

// MARK: SCRIPT ENTRYPOINT
// CLI entrypoint for add-language script usage.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));

  runAddLanguage(args)
    .then((result) => {
      const operation = result.existed ? 'Updated' : 'Added';
      console.log(`[add-language] ${operation} ${result.localeCode} (${result.displayName}) with htmlLang=${result.htmlLang} and direction=${result.direction}.`);
      console.log(`[add-language] Locales: ${result.localeCodes.join(', ')}`);
      console.log(`[add-language] Synced ${result.syncResult.updatedFiles} file(s).`);
    })
    .catch((error) => {
      console.error('[add-language] Failed:', error.message || error);
      process.exit(1);
    });
}
