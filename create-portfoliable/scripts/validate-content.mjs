#!/usr/bin/env node
// File: scripts/validate-content.mjs
// Purpose: Validate template case markdown before dev, build, or preview.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCaseMarkdownWithDiagnostics } from '../src/parser/markdown.js';

// === PATH CONSTANTS ===
// Resolves this script directory for project-relative path operations.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolves canonical markdown cases directory validated by this script.
const casesDir = path.resolve(__dirname, '../src/content/cases');

// Collect every markdown case file from the cases directory.
function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(dirPath, name));
}

// Reads UTF-8 file content from disk.
function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Converts absolute file path to repository-relative path for diagnostics.
function toRelPath(filePath) {
  return path.relative(path.resolve(__dirname, '..'), filePath);
}

// Guard against empty or non-string values.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Check localized values that must define both language variants.
function isLocalizedObject(value) {
  return Boolean(value) && typeof value === 'object' && isNonEmptyString(value.en) && isNonEmptyString(value.pt);
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
function collectCaseLevelWarnings(caseData, contextLabel) {
  // Collects warning-level findings that should not fail builds.
  const warnings = [];

  if (isNonEmptyString(caseData?.repositoryUrl) && !isValidUrlOrAssetPath(caseData.repositoryUrl)) {
    warnings.push(`${contextLabel}: repositoryUrl should be a valid URL or asset-style path.`);
  }

  if (isNonEmptyString(caseData?.liveUrl) && !isValidUrlOrAssetPath(caseData.liveUrl)) {
    warnings.push(`${contextLabel}: liveUrl should be a valid URL or asset-style path.`);
  }

  if (caseData?.videoSrc && !isLocalizedObject(caseData.videoSrc)) {
    warnings.push(`${contextLabel}: videoSrc must define both videoSrc.en and videoSrc.pt when provided.`);
  }

  if (caseData?.vttSrc && !isLocalizedObject(caseData.vttSrc)) {
    warnings.push(`${contextLabel}: vttSrc must define both vttSrc.en and vttSrc.pt when provided.`);
  }

  if (caseData?.audioSrc && !isLocalizedObject(caseData.audioSrc)) {
    warnings.push(`${contextLabel}: audioSrc must define both audioSrc.en and audioSrc.pt when provided.`);
  }

  if (caseData?.audioSrcRecruiter && !isLocalizedObject(caseData.audioSrcRecruiter)) {
    warnings.push(`${contextLabel}: audioSrcRecruiter must define both audioSrcRecruiter.en and audioSrcRecruiter.pt when provided.`);
  }

  if (isNonEmptyString(caseData?.id) && !/^[a-z0-9-]+$/.test(caseData.id)) {
    warnings.push(`${contextLabel}: id should use lowercase kebab-case (letters, numbers, hyphens).`);
  }

  if (isNonEmptyString(caseData?.slug) && !/^[a-z0-9-]+$/.test(caseData.slug)) {
    warnings.push(`${contextLabel}: slug should use lowercase kebab-case (letters, numbers, hyphens).`);
  }

  return warnings;
}

// Detect duplicate ids and slugs across all parsed case files.
function collectCrossFileErrors(parsedEntries) {
  // Collects cross-file fatal validation errors.
  const errors = [];
  // Maps case ID values to first defining file.
  const idToFile = new Map();
  // Maps case slug values to first defining file.
  const slugToFile = new Map();

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

    // Reads case slug for duplicate-slug detection.
    const slug = caseData?.slug;
    if (isNonEmptyString(slug)) {
      if (slugToFile.has(slug)) {
        errors.push(`${filePath}: duplicate slug '${slug}'. First defined in ${slugToFile.get(slug)}.`);
      } else {
        slugToFile.set(slug, filePath);
      }
    }
  });

  return errors;
}

// Run the complete content validation pass and report errors or warnings.
export function runValidation() {
  // Loads markdown files to validate.
  const files = listMarkdownFiles(casesDir);

  if (files.length === 0) {
    console.warn('[validate-content] No markdown files found in src/content/cases.');
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
    const relPath = toRelPath(filePath);
    // Parses case markdown and returns structured errors/case data.
    const { caseData, errors } = parseCaseMarkdownWithDiagnostics(rawText, { filePath: relPath });
    allErrors.push(...errors);

    if (caseData) {
      parsedEntries.push({ filePath: relPath, caseData });
      allWarnings.push(...collectCaseLevelWarnings(caseData, relPath));
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
