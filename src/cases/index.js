import { portfolioCases as legacyPortfolioCases } from '../data.js';
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

function normalizeMarkdownCase(markdownCase, legacyCase) {
  const normalized = { ...legacyCase, ...markdownCase };

  normalized.id = markdownCase.id || legacyCase.id;
  normalized.slug = markdownCase.slug || legacyCase.slug;
  normalized.title = toLocalized(markdownCase.title, legacyCase.title);
  normalized.shortDesc = toLocalized(markdownCase.shortDesc, legacyCase.shortDesc);
  normalized.readTime = toLocalized(markdownCase.readTime, legacyCase.readTime);
  normalized.year = toLocalized(markdownCase.year, legacyCase.year);
  normalized.thumbSrc = toLocalized(markdownCase.thumbSrc, legacyCase.thumbSrc);
  normalized.desc = toLocalized(markdownCase.desc, legacyCase.desc);
  normalized.descRecruiter = toLocalized(markdownCase.descRecruiter, legacyCase.descRecruiter || legacyCase.desc);

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
  const mergedCases = [...legacyPortfolioCases];

  markdownCases.forEach((markdownCase) => {
    const legacyIndex = mergedCases.findIndex((item) => item.id === markdownCase.id);

    if (legacyIndex >= 0) {
      mergedCases[legacyIndex] = normalizeMarkdownCase(markdownCase, mergedCases[legacyIndex]);
      return;
    }

    mergedCases.push(normalizeMarkdownCase(markdownCase, {}));
  });

  return mergedCases;
}
