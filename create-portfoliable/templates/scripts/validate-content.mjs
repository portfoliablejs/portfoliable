#!/usr/bin/env node
// File: scripts/validate-content.mjs
// Purpose: Validate template case markdown before dev, build, or preview.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { parseCaseMarkdownWithDiagnostics } from '../src/parser/markdown.js';
import { readLocaleConfigFromI18nConfig, resolveI18nConfigPath } from './i18n-config-utils.mjs';

// MARK: LAYOUT RESOLUTION
// Resolves project paths for template-repo mode and generated-app mode.
function resolveProjectLayout(cwd = process.cwd()) {
  const templateCasesDir = path.join(cwd, 'templates', 'src', 'content', 'cases');
  const hasTemplateCases = fs.existsSync(templateCasesDir) && fs.statSync(templateCasesDir).isDirectory();

  if (hasTemplateCases) {
    return {
      mode: 'template',
      root: cwd,
      casesDir: templateCasesDir
    };
  }

  return {
    mode: 'consumer',
    root: cwd,
    casesDir: path.join(cwd, 'src', 'content', 'cases')
  };
}

// Collect every markdown case file from the cases directory.
function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = [];

  // Recursively walks nested case folders to collect markdown files.
  const walk = (currentDir) => {
    fs.readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
        return;
      }

      if (entry.name.endsWith('.md')) {
        files.push(nextPath);
      }
    });
  };

  walk(dirPath);
  return files;
}

// Reads UTF-8 file content from disk.
function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Converts absolute file path to repository-relative path for diagnostics.
function toRelPath(filePath, rootDir) {
  return path.relative(rootDir, filePath);
}

// Guard against empty or non-string values.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Check localized values that must define both language variants.
function isLocalizedObject(value, localeCodes) {
  if (!value || typeof value !== 'object') return false;
  return localeCodes.every((localeCode) => isNonEmptyString(value[localeCode]));
}

// Accept only URLs or project-local asset paths for link-like fields.
function isValidUrlOrAssetPath(value) {
  if (!isNonEmptyString(value)) return false;
  // Normalizes value before URL/path pattern checks.
  const normalized = value.trim();
  return (
    normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('assets/')
    || normalized.startsWith('./')
    || normalized.startsWith('../')
    || normalized.startsWith('/')
  );
}

// Surface non-fatal content quality warnings for case metadata.
function collectCaseLevelWarnings(caseData, contextLabel, supportedLocales) {
  // Collects warning-level findings that should not fail builds.
  const warnings = [];
  const localeCodes = Array.isArray(caseData?.locales) && caseData.locales.length > 0
    ? caseData.locales
    : supportedLocales;
  // Accepts localized maps only when at least one locale contains non-empty text.
  const hasAnyLocalizedValue = (value) => {
    if (!value || typeof value !== 'object') return false;
    return Object.values(value).some((entry) => isNonEmptyString(entry));
  };

  if (isNonEmptyString(caseData?.repositoryUrl) && !isValidUrlOrAssetPath(caseData.repositoryUrl)) {
    warnings.push(`${contextLabel}: repositoryUrl should be a valid URL or asset-style path.`);
  }

  if (isNonEmptyString(caseData?.liveUrl) && !isValidUrlOrAssetPath(caseData.liveUrl)) {
    warnings.push(`${contextLabel}: liveUrl should be a valid URL or asset-style path.`);
  }

  if (hasAnyLocalizedValue(caseData?.videoSrc) && !isLocalizedObject(caseData.videoSrc, localeCodes)) {
    warnings.push(`${contextLabel}: videoSrc should define localized values for locales: ${localeCodes.join(', ')} when provided.`);
  }

  if (hasAnyLocalizedValue(caseData?.vttSrc) && !isLocalizedObject(caseData.vttSrc, localeCodes)) {
    warnings.push(`${contextLabel}: vttSrc should define localized values for locales: ${localeCodes.join(', ')} when provided.`);
  }

  if (hasAnyLocalizedValue(caseData?.audioSrc) && !isLocalizedObject(caseData.audioSrc, localeCodes)) {
    warnings.push(`${contextLabel}: audioSrc should define localized values for locales: ${localeCodes.join(', ')} when provided.`);
  }

  if (isNonEmptyString(caseData?.id) && !/^[a-z0-9-]+$/.test(caseData.id)) {
    warnings.push(`${contextLabel}: id should use lowercase kebab-case (letters, numbers, hyphens).`);
  }

  if (caseData?.slugByLocale && typeof caseData.slugByLocale === 'object') {
    Object.entries(caseData.slugByLocale).forEach(([localeCode, slugValue]) => {
      if (!isNonEmptyString(slugValue)) return;
      if (!/^[a-z0-9-]+$/.test(slugValue)) {
        warnings.push(`${contextLabel}: slugByLocale.${localeCode} should use lowercase kebab-case (letters, numbers, hyphens).`);
      }
    });
  }

  if (isNonEmptyString(caseData?.caseOrder) && !/^\d+$/.test(String(caseData.caseOrder).trim())) {
    warnings.push(`${contextLabel}: caseOrder should be a positive integer (for example: caseOrder: 10).`);
  }

  return warnings;
}

// Detect duplicate ids and slugs across all parsed case files.
function collectCrossFileErrors(parsedEntries) {
  // Collects cross-file fatal validation errors.
  const errors = [];
  // Maps case ID values to first defining file.
  const idToFile = new Map();
  const localizedSlugToFile = new Map();

  parsedEntries.forEach(({ filePath, caseData }) => {
    // Reads case id for duplicate-id detection.
    const id = caseData?.id;
    if (isNonEmptyString(id)) {
      if (idToFile.has(id)) {
        errors.push(`${filePath}: duplicate id '${id}'. First defined in ${idToFile.get(id)}.`);
      } else {
        idToFile.set(id, filePath);
      }
    }

    const slugByLocale = caseData?.slugByLocale && typeof caseData.slugByLocale === 'object'
      ? caseData.slugByLocale
      : {};
    Object.entries(slugByLocale).forEach(([localeCode, localizedSlug]) => {
      if (!isNonEmptyString(localizedSlug)) return;
      const collisionKey = `${String(localeCode).trim().toLowerCase()}::${localizedSlug}`;
      if (localizedSlugToFile.has(collisionKey)) {
        errors.push(`${filePath}: duplicate localized slug '${localizedSlug}' for locale '${localeCode}'. First defined in ${localizedSlugToFile.get(collisionKey)}.`);
      } else {
        localizedSlugToFile.set(collisionKey, filePath);
      }
    });
  });

  return errors;
}

// Run the complete content validation pass and report errors or warnings.
export function runValidation(options = {}) {
  const cwd = options.cwd || process.cwd();
  const layout = resolveProjectLayout(cwd);
  const i18nConfigPath = resolveI18nConfigPath(cwd);
  const localeConfig = readLocaleConfigFromI18nConfig(i18nConfigPath);
  const supportedLocales = localeConfig.supportedLocales;
  const defaultLocale = localeConfig.defaultLocale;

  // Loads markdown files to validate.
  const files = listMarkdownFiles(layout.casesDir);

  if (files.length === 0) {
    const emptyPathLabel = layout.mode === 'template'
      ? 'templates/src/content/cases'
      : 'src/content/cases';
    console.warn(`[validate-content] No markdown files found in ${emptyPathLabel}.`);
    return 0;
  }

  // Collects parser/contract errors across all files.
  const allErrors = [];
  // Collects warning-level quality checks across all files.
  const allWarnings = [];
  // Stores successfully parsed case entries for cross-file checks.
  const parsedEntries = [];

  files.forEach((filePath) => {
    // Loads raw markdown file content.
    const rawText = readUtf8(filePath);
    // Computes relative path used in diagnostic output.
    const relPath = toRelPath(filePath, layout.root);
    // Parses case markdown and returns structured errors/case data.
    const { caseData, errors } = parseCaseMarkdownWithDiagnostics(rawText, {
      filePath: relPath,
      locales: supportedLocales,
      defaultLocale: defaultLocale
    });
    allErrors.push(...errors);

    if (caseData) {
      parsedEntries.push({ filePath: relPath, caseData });
      allWarnings.push(...collectCaseLevelWarnings(caseData, relPath, supportedLocales));
    }
  });

  allErrors.push(...collectCrossFileErrors(parsedEntries));

  if (allErrors.length === 0) {
    if (allWarnings.length > 0) {
      console.warn('[validate-content] WARN: content checks passed with warnings:');
      allWarnings.forEach((message) => {
        console.warn(`- ${message}`);
      });
    }
    console.log('[validate-content] OK: all case markdown files are valid.');
    return 0;
  }

  console.error('[validate-content] ERROR: found content validation issues:');
  allErrors.forEach((message) => {
    console.error(`- ${message}`);
  });

  return 1;
}

// Runs validation when script is invoked directly from command line.
if (import.meta.url === `file://${process.argv[1]}`) {
  // Captures exit code from validation run.
  const exitCode = runValidation();
  process.exit(exitCode);
}
