// File: create-portfoliable/templates/src/cases/index.js
// Purpose: Load and normalize markdown cases for generated consumer apps.
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
  return {
    ...markdownCase,
    id: markdownCase.id,
    slug: markdownCase.slug,
    title: toLocalized(markdownCase.title),
    shortDesc: toLocalized(markdownCase.shortDesc),
    readTime: toLocalized(markdownCase.readTime),
    year: toLocalized(markdownCase.year),
    thumbSrc: toLocalized(markdownCase.thumbSrc),
    desc: toLocalized(markdownCase.desc),
    descRecruiter: toLocalized(markdownCase.descRecruiter, markdownCase.desc)
  };
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

export const portfolioCases = getPortfolioCases();