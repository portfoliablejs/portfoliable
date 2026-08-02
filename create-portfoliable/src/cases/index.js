// File: src/cases/index.js
// Purpose: Load markdown case data for the runtime package.
// Author: Lio Schimanko

// === IMPORTS ===
import { parseCaseMarkdownWithDiagnostics } from '../parser/markdown.js';

// === LOCALIZATION NORMALIZATION ===
// Converts a value into the canonical { en, pt } shape with optional localized fallback.
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

// Normalizes one parsed markdown case into the runtime case contract.
function normalizeMarkdownCase(markdownCase) {
  // Clones case object so normalization does not mutate parser output references.
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

// === MARKDOWN CONTENT LOADING ===
// Loads markdown case modules, parses them, and collects non-fatal diagnostics.
function loadMarkdownCases() {
  // Eagerly imports raw markdown files so validation occurs during build/dev startup.
  const modules = import.meta.glob('../content/cases/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
  });

  // Collects parser warnings/errors for consolidated logging.
  const diagnostics = [];

  // Parses each markdown file and retains valid case outputs.
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

  // Emits parser diagnostics without failing runtime load, mirroring current behavior.
  if (diagnostics.length > 0) {
    console.warn('[portfoliable] Content validation warnings:');
    diagnostics.forEach((message) => console.warn(`- ${message}`));
  }

  return parsedCases;
}

// === PUBLIC API ===
// Returns normalized portfolio case records for runtime consumption.
export function getPortfolioCases() {
  // Loads all markdown cases from content directory.
  const markdownCases = loadMarkdownCases();

  if (markdownCases.length === 0) {
    console.warn('[portfoliable] No markdown cases were loaded from src/content/cases.');
  }

  // Normalizes each parsed case into expected localized runtime format.
  return markdownCases.map((markdownCase) => normalizeMarkdownCase(markdownCase));
}
