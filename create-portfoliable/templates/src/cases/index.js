// File: create-portfoliable/templates/src/cases/index.js
// Purpose: Load and normalize markdown cases for generated consumer apps.
// Author: Lio Schimanko

// === IMPORTS ===
import { parseCaseMarkdownWithDiagnostics } from '../parser/markdown.js';

// === LOCALIZATION NORMALIZATION ===
// Converts a value into canonical localized shape with optional fallback object.
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

// Normalizes one parsed markdown case into the starter app runtime contract.
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

// === MARKDOWN CONTENT LOADING ===
// Loads markdown modules, parses cases, and aggregates diagnostics for console output.
function loadMarkdownCases() {
  // Eagerly imports raw case markdown for startup-time parsing and validation.
  const modules = import.meta.glob('../content/cases/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
  });

  // Collects parser diagnostics encountered across all markdown files.
  const diagnostics = [];

  // Parses all imported markdown files and returns valid caseData entries.
  const parsedCases = Object.entries(modules)
    .map(([filePath, rawText]) => {
      // Parses one markdown module and returns case payload plus diagnostics.
      const result = parseCaseMarkdownWithDiagnostics(rawText, { filePath });
      if (result.errors.length > 0) {
        diagnostics.push(...result.errors);
      }
      return result.caseData;
    })
    .filter(Boolean);

  // Prints parser diagnostics as warnings without aborting app bootstrap.
  if (diagnostics.length > 0) {
    console.warn('[portfoliable] Content validation warnings:');
    diagnostics.forEach((message) => console.warn(`- ${message}`));
  }

  return parsedCases;
}

// === PUBLIC API ===
// Returns normalized portfolio case records for template-generated app runtime.
export function getPortfolioCases() {
  // Loads all parsed markdown case entries.
  const markdownCases = loadMarkdownCases();

  if (markdownCases.length === 0) {
    console.warn('[portfoliable] No markdown cases were loaded from src/content/cases.');
  }

  // Normalizes each case into expected localized structure.
  return markdownCases.map((markdownCase) => normalizeMarkdownCase(markdownCase));
}

// Exports eagerly loaded case list used by template bootstrap.
export const portfolioCases = getPortfolioCases();