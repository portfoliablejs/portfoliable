#!/usr/bin/env node
// File: scripts/delete-language.mjs
// Purpose: Remove a locale from i18n config and prune locale entries from labels/about/cases.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import { resolveI18nConfigPath } from './i18n-config-utils.mjs';
import { runLocaleSync } from './sync-locales.mjs';

// MARK: CONFIG PATTERNS
const LANGUAGE_CONFIG_REGEX = /export\s+const\s+LANGUAGE_CONFIG\s*=\s*Object\.freeze\(\s*(\{[\s\S]*?\})\s*\);/;
const DEFAULT_LOCALE_REGEX = /export\s+const\s+DEFAULT_LOCALE\s*=\s*['\"]([^'\"]+)['\"]/;
const RTL_LOCALE_CODES_REGEX = /export\s+const\s+RTL_LOCALE_CODES\s*=\s*Object\.freeze\(\s*(\[[\s\S]*?\])\s*\);/;

// MARK: ARGUMENT AND LITERAL PARSING
// Parses object-like config literals using JSON first with JS-literal fallback.
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

// Parses delete-language CLI arguments and optional force mode.
function parseArgs(argv) {
  const parsed = {
    code: '',
    force: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--code') {
      parsed.code = String(argv[i + 1] || '').trim().toLowerCase();
      i += 1;
      continue;
    }

    if (token === '--force') {
      parsed.force = true;
      continue;
    }
  }

  return parsed;
}

// Validates locale identifier format before deleting entries.
function validateLocaleCode(localeCode) {
  return /^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(String(localeCode || '').trim());
}

// Rewrites DEFAULT_LOCALE export when deleting the active default locale.
function replaceDefaultLocale(source, nextDefaultLocale) {
  if (!DEFAULT_LOCALE_REGEX.test(source)) {
    return source;
  }

  return source.replace(DEFAULT_LOCALE_REGEX, `export const DEFAULT_LOCALE = '${nextDefaultLocale}'`);
}

// MARK: LANGUAGE REMOVAL WORKFLOW
// Removes one locale from i18n config and syncs locale-bound content maps.
export async function runDeleteLanguage(options = {}) {
  const cwd = options.cwd || process.cwd();
  const localeCode = String(options.code || '').trim().toLowerCase();

  if (!validateLocaleCode(localeCode)) {
    throw new Error('Invalid locale code. Use values like "it", "es", or "pt-BR".');
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

  const defaultLocaleMatch = source.match(DEFAULT_LOCALE_REGEX);
  const currentDefaultLocale = String(defaultLocaleMatch?.[1] || 'en').trim().toLowerCase();

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

  if (!languageConfig[localeCode]) {
    return {
      removedLocale: localeCode,
      defaultLocaleBefore: currentDefaultLocale,
      defaultLocaleAfter: currentDefaultLocale,
      i18nConfigPath,
      localeCodes: Object.keys(languageConfig),
      syncResult: { updatedFiles: 0, localeCodes: Object.keys(languageConfig) },
      alreadyMissing: true
    };
  }

  if (localeCode === currentDefaultLocale && options.force !== true) {
    throw new Error(`Locale ${localeCode} is the DEFAULT_LOCALE. Use --force to remove it and reassign default locale.`);
  }

  const nextLanguageConfig = { ...languageConfig };
  delete nextLanguageConfig[localeCode];

  const remainingLocales = Object.keys(nextLanguageConfig);
  if (remainingLocales.length === 0) {
    throw new Error('Cannot remove the last remaining locale.');
  }

  const nextDefaultLocale = localeCode === currentDefaultLocale
    ? remainingLocales[0]
    : currentDefaultLocale;

  const nextLanguageConfigBlock = `export const LANGUAGE_CONFIG = Object.freeze(${JSON.stringify(nextLanguageConfig, null, 2)});`;
  let nextSource = source.replace(LANGUAGE_CONFIG_REGEX, nextLanguageConfigBlock);
  const nextRtlLocaleCodes = rtlLocaleCodes
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index)
    .filter((value) => value !== localeCode)
    .sort((a, b) => a.localeCompare(b));
  if (RTL_LOCALE_CODES_REGEX.test(nextSource)) {
    const rtlBlock = `export const RTL_LOCALE_CODES = Object.freeze(${JSON.stringify(nextRtlLocaleCodes, null, 2)});`;
    nextSource = nextSource.replace(RTL_LOCALE_CODES_REGEX, rtlBlock);
  }
  nextSource = replaceDefaultLocale(nextSource, nextDefaultLocale);

  if (nextSource !== source) {
    fs.writeFileSync(i18nConfigPath, nextSource, 'utf8');
  }

  const syncResult = await runLocaleSync({
    cwd,
    pruneLocales: true
  });

  return {
    removedLocale: localeCode,
    defaultLocaleBefore: currentDefaultLocale,
    defaultLocaleAfter: nextDefaultLocale,
    i18nConfigPath,
    localeCodes: remainingLocales,
    syncResult,
    alreadyMissing: false
  };
}

// MARK: SCRIPT ENTRYPOINT
// CLI entrypoint for delete-language script usage.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));

  runDeleteLanguage(args)
    .then((result) => {
      if (result.alreadyMissing) {
        console.log(`[delete-language] Nothing to delete. Locale ${result.removedLocale} is already missing.`);
        return;
      }
      console.log(`[delete-language] Removed ${result.removedLocale}.`);
      console.log(`[delete-language] Default locale: ${result.defaultLocaleBefore} -> ${result.defaultLocaleAfter}`);
      console.log(`[delete-language] Locales: ${result.localeCodes.join(', ')}`);
      console.log(`[delete-language] Synced ${result.syncResult.updatedFiles} file(s).`);
    })
    .catch((error) => {
      console.error('[delete-language] Failed:', error.message || error);
      process.exit(1);
    });
}
