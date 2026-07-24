#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCaseMarkdownWithDiagnostics } from '../src/parser/markdown.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.resolve(__dirname, '../src/content/cases');

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(dirPath, name));
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function toRelPath(filePath) {
  return path.relative(path.resolve(__dirname, '..'), filePath);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isLocalizedObject(value) {
  return Boolean(value) && typeof value === 'object' && isNonEmptyString(value.en) && isNonEmptyString(value.pt);
}

function isValidUrlOrAssetPath(value) {
  if (!isNonEmptyString(value)) return false;
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

function collectCaseLevelWarnings(caseData, contextLabel) {
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

function collectCrossFileErrors(parsedEntries) {
  const errors = [];
  const idToFile = new Map();
  const slugToFile = new Map();

  parsedEntries.forEach(({ filePath, caseData }) => {
    const id = caseData?.id;
    if (isNonEmptyString(id)) {
      if (idToFile.has(id)) {
        errors.push(`${filePath}: duplicate id '${id}'. First defined in ${idToFile.get(id)}.`);
      } else {
        idToFile.set(id, filePath);
      }
    }

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

export function runValidation() {
  const files = listMarkdownFiles(casesDir);

  if (files.length === 0) {
    console.warn('[validate-content] No markdown files found in src/content/cases.');
    return 0;
  }

  const allErrors = [];
  const allWarnings = [];
  const parsedEntries = [];

  files.forEach((filePath) => {
    const rawText = readUtf8(filePath);
    const relPath = toRelPath(filePath);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = runValidation();
  process.exit(exitCode);
}
