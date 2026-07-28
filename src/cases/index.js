// File: src/cases/index.js
// Purpose: Load markdown case data for the runtime package.
// Author: Lio Schimanko

import { parseCaseMarkdownWithDiagnostics } from '../parser/markdown.js';

function toLocalized(value, fallback) {
  if (value && typeof value === 'object' && value.en !== undefined && value.pt !== undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return { en: value, pt: value };
  }

  if (fallback && typeof fallback === 'object' && fallback.en !== undefined && fallback.pt !== undefined) {
    return fallback;
  }

  return { en: '', pt: '' };
}

function normalizeMarkdownCase(markdownCase) {
  const normalized = { ...markdownCase };

  normalized.title = toLocalized(markdownCase.title);
  normalized.shortDesc = toLocalized(markdownCase.shortDesc);
  normalized.readTime = toLocalized(markdownCase.readTime);
  normalized.year = toLocalized(markdownCase.year);
  normalized.thumbSrc = toLocalized(markdownCase.thumbSrc);
  normalized.desc = toLocalized(markdownCase.desc);
  normalized.descRecruiter = toLocalized(markdownCase.descRecruiter, markdownCase.desc);

  return normalized;
}

function loadMarkdownCases() {
  const modules = import.meta.glob('../content/cases/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
  });

  const diagnostics = [];

  const parsedCases = Object.entries(modules)
    .map(([filePath, rawText]) => {
      const result = parseCaseMarkdownWithDiagnostics(rawText, { filePath });
      if (result.errors.length > 0) {
        diagnostics.push(...result.errors);
      }
      return result.caseData;
    })
    .filter(Boolean);

  if (diagnostics.length > 0) {
    console.warn('[portfoliable] Content validation warnings:');
    diagnostics.forEach((message) => console.warn(`- ${message}`));
  }

  return parsedCases;
}

export function getPortfolioCases() {
  const markdownCases = loadMarkdownCases();

  if (markdownCases.length === 0) {
    console.warn('[portfoliable] No markdown cases were loaded from src/content/cases.');
  }

  return markdownCases.map((markdownCase) => normalizeMarkdownCase(markdownCase));
}
