// File: create-portfoliable/templates/src/cases/index.js
// Purpose: Load and normalize markdown cases for generated consumer apps.
// Author: Lio Schimanko

// MARK: IMPORTS
import { parseCaseMarkdownWithDiagnostics } from '../parser/markdown.js';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../../configs/i18n/i18n.config.js';

// MARK: LOCALIZATION NORMALIZATION
// Converts a value into canonical localized shape with optional fallback object.
function toLocalized(value, fallback, localeCodes = SUPPORTED_LOCALES) {
  const locales = Array.isArray(localeCodes) && localeCodes.length > 0
    ? localeCodes
    : SUPPORTED_LOCALES;

  const fallbackValueByLocale = (localeCode) => {
    if (fallback && typeof fallback === 'object' && typeof fallback[localeCode] === 'string') {
      return fallback[localeCode];
    }
    if (fallback && typeof fallback === 'object' && typeof fallback[DEFAULT_LOCALE] === 'string') {
      return fallback[DEFAULT_LOCALE];
    }
    if (typeof fallback === 'string') {
      return fallback;
    }
    return '';
  };

  if (typeof value === 'string') {
    return Object.fromEntries(locales.map((localeCode) => [localeCode, value]));
  }

  if (value && typeof value === 'object') {
    const localized = Object.fromEntries(locales.map((localeCode) => {
      const raw = value[localeCode];
      if (typeof raw === 'string') {
        return [localeCode, raw];
      }

      const defaultRaw = value[DEFAULT_LOCALE];
      if (typeof defaultRaw === 'string') {
        return [localeCode, defaultRaw];
      }

      return [localeCode, fallbackValueByLocale(localeCode)];
    }));

    Object.keys(value).forEach((key) => {
      if (locales.includes(key)) return;
      localized[key] = value[key];
    });

    return localized;
  }

  return Object.fromEntries(locales.map((localeCode) => [localeCode, fallbackValueByLocale(localeCode)]));
}

// Parses manual gallery order from markdown metadata.
function parseCaseOrder(value) {
  if (value === null || value === undefined || value === '') return Number.POSITIVE_INFINITY;

  const parsed = Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

function normalizeSummaryProps(value, localeCodes = SUPPORTED_LOCALES) {
  const summaryProps = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};

  return {
    ...summaryProps,
    text: toLocalized(summaryProps.text, '', localeCodes),
    labelHeader: toLocalized(summaryProps.labelHeader, '', localeCodes),
    ariaLabel: toLocalized(summaryProps.ariaLabel, '', localeCodes),
    active: typeof summaryProps.active === 'boolean' ? summaryProps.active : false,
    showMetrics: typeof summaryProps.showMetrics === 'boolean' ? summaryProps.showMetrics : false
  };
}

// Normalizes one parsed markdown case into the starter app runtime contract.
function normalizeMarkdownCase(markdownCase) {
  const localeCodes = Array.isArray(markdownCase?.locales) && markdownCase.locales.length > 0
    ? markdownCase.locales
    : SUPPORTED_LOCALES;

  return {
    ...markdownCase,
    id: markdownCase.id,
    caseOrder: parseCaseOrder(markdownCase.caseOrder),
    title: toLocalized(markdownCase.title, '', localeCodes),
    shortDesc: toLocalized(markdownCase.shortDesc, '', localeCodes),
    readTime: toLocalized(markdownCase.readTime, '', localeCodes),
    kicker: toLocalized(markdownCase.kicker ?? markdownCase.year, '', localeCodes),
    thumbSrc: toLocalized(markdownCase.thumbSrc, '', localeCodes),
    desc: toLocalized(markdownCase.desc, '', localeCodes),
    summary: toLocalized(markdownCase.summary, '', localeCodes),
    summaryProps: normalizeSummaryProps(markdownCase.summaryProps, localeCodes),
    descRecruiter: toLocalized(markdownCase.descRecruiter, markdownCase.desc, localeCodes),
    locales: localeCodes,
    display: {
      showSummary: Boolean(markdownCase?.display?.showSummary),
      showReader: markdownCase?.display?.showReader !== false,
      showCover: markdownCase?.display?.showCover !== false,
      showPlayer: markdownCase?.display?.showPlayer !== false,
      showToc: Boolean(markdownCase?.display?.showToc),
      showNavigator: markdownCase?.display?.showNavigator !== false
    }
  };
}

// MARK: MARKDOWN CONTENT LOADING
// Loads markdown modules, parses cases, and aggregates diagnostics for console output.
function loadMarkdownCases() {
  // Eagerly imports raw case markdown for startup-time parsing and validation.
  const modules = import.meta.glob('../content/cases/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
  });

  const nestedModules = import.meta.glob('../content/cases/**/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
  });

  const allModules = {
    ...nestedModules,
    ...modules
  };

  // Collects parser diagnostics encountered across all markdown files.
  const diagnostics = [];

  // Parses all imported markdown files and returns valid caseData entries.
  const parsedCases = Object.entries(allModules)
    .map(([filePath, rawText]) => {
      // Parses one markdown module and returns case payload plus diagnostics.
      const result = parseCaseMarkdownWithDiagnostics(rawText, {
        filePath,
        locales: SUPPORTED_LOCALES,
        defaultLocale: DEFAULT_LOCALE
      });
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

// MARK: PUBLIC API
// Returns normalized portfolio case records for template-generated app runtime.
export function getPortfolioCases() {
  // Loads all parsed markdown case entries.
  const markdownCases = loadMarkdownCases();

  if (markdownCases.length === 0) {
    console.warn('[portfoliable] No markdown cases were loaded from src/content/cases.');
  }

  // Normalizes and sorts cases by optional manual order before runtime render.
  return markdownCases
    .map((markdownCase, sourceIndex) => ({
      sourceIndex,
      caseData: normalizeMarkdownCase(markdownCase)
    }))
    .sort((a, b) => {
      const orderDelta = a.caseData.caseOrder - b.caseData.caseOrder;
      if (Number.isFinite(orderDelta) && orderDelta !== 0) return orderDelta;
      return a.sourceIndex - b.sourceIndex;
    })
    .map((entry) => entry.caseData);
}

// Exports eagerly loaded case list used by template bootstrap.
export const portfolioCases = getPortfolioCases();