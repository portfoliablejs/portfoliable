// File: src/parser/markdown.js
// Purpose: Parse Portfoliable case markdown into structured case data.
// Author: Lio Schimanko

import MarkdownIt from 'markdown-it';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItTaskLists from 'markdown-it-task-lists';

// MARK: MARKDOWN RENDERER
// Uses markdown-it + plugins to support broad markdown syntax for case content.
const markdownRenderer = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false
})
  .use(markdownItFootnote)
  .use(markdownItDeflist)
  .use(markdownItTaskLists, {
    enabled: true,
    label: true,
    labelAfter: true
  });

// Keeps legacy paragraph styling hooks while using full markdown rendering.
const paragraphOpenDefault = markdownRenderer.renderer.rules.paragraph_open;
markdownRenderer.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrJoin('class', 'p1');
  if (paragraphOpenDefault) {
    return paragraphOpenDefault(tokens, idx, options, env, self);
  }
  return self.renderToken(tokens, idx, options);
};

// Adds external-link safety attributes expected by the app runtime.
const linkOpenDefault = markdownRenderer.renderer.rules.link_open;
markdownRenderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = String(token.attrGet('href') || '').trim();
  const isExternal = /^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);

  if (isExternal) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  } else {
    token.attrSet('target', '_self');
    token.attrSet('rel', 'noopener');
  }

  if (linkOpenDefault) {
    return linkOpenDefault(tokens, idx, options, env, self);
  }

  return self.renderToken(tokens, idx, options);
};

// Emits Mermaid fences as the Valence custom element instead of a code block.
markdownRenderer.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  if (String(token.info || '').trim().split(/\s+/)[0].toLowerCase() !== 'mermaid') {
    return `<pre><code>${markdownRenderer.utils.escapeHtml(token.content)}</code></pre>\n`;
  }

  return `<mermaid-diagram>${markdownRenderer.utils.escapeHtml(token.content)}</mermaid-diagram>\n`;
};

// MARK: VALIDATION CONTRACTS
// Lists required scalar config fields that every case must define.
const REQUIRED_SCALAR_FIELDS = ['id', 'thumbCategory', 'thumbBrand', 'thumbModel', 'thumbColor'];
// Lists required localized fields that must include values for all active locales.
const REQUIRED_LOCALIZED_FIELDS = ['title', 'shortDesc', 'readTime', 'kicker', 'thumbSrc'];
// Lists optional localized metadata fields supported by the modern case schema.
const OPTIONAL_LOCALIZED_FIELDS = ['summary', 'audioLabel', 'audioSrc', 'vttSrc', 'socialImage', 'slugByLocale'];
// Defines parser fallback locales when callers do not provide locale codes.
const DEFAULT_LOCALE_CODES = [];

// Normalizes locale lists by trimming, lowercasing, deduplicating, and applying fallback values.
function normalizeLocaleCodes(values, fallback = DEFAULT_LOCALE_CODES) {
  const normalizeList = (list) => {
    const output = [];
    const seen = new Set();
    const valuesToNormalize = Array.isArray(list) ? list : [];

    valuesToNormalize.forEach((value) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      output.push(normalized);
    });

    return output;
  };

  const primary = normalizeList(values);
  if (primary.length > 0) {
    return primary;
  }

  return normalizeList(fallback);
}

// Resolves the primary locale from explicit default and available locale candidates.
function resolvePrimaryLocale(localeCodes, defaultLocale = '') {
  const candidates = normalizeLocaleCodes([defaultLocale, ...(Array.isArray(localeCodes) ? localeCodes : [])]);
  return candidates[0] || '';
}

// Converts markdown into HTML for case body rendering using the shared renderer.
function markdownToHtml(markdown) {
  const source = String(markdown || '').trim();
  if (!source) {
    return '';
  }

  return markdownRenderer.render(source);
}

// Renders localized markdown sections into HTML using the shared markdown-it pipeline.
export function renderLocalizedMarkdownHtml(bodyText, localeCodes = DEFAULT_LOCALE_CODES) {
  const normalizedBodyText = String(bodyText || '').replace(/<!--\s*config\s*[\s\S]*?-->/gi, '').trim();
  const targetLocales = normalizeLocaleCodes(localeCodes);
  const sections = Object.fromEntries(targetLocales.map((localeCode) => [localeCode, '']));
  const markerLocales = new Set();
  const langRegex = /<!--\s*lang:([a-z0-9-]+)\s*-->/gi;
  let activeLang = null;
  let lastIndex = 0;
  let match;

  while ((match = langRegex.exec(normalizedBodyText)) !== null) {
    const markerLocale = String(match[1] || '').trim().toLowerCase();
    if (!markerLocale) continue;
    markerLocales.add(markerLocale);
    if (!(markerLocale in sections)) {
      sections[markerLocale] = '';
    }

    if (activeLang) {
      sections[activeLang] += normalizedBodyText.slice(lastIndex, match.index);
    }
    activeLang = markerLocale;
    lastIndex = langRegex.lastIndex;
  }

  if (activeLang) {
    sections[activeLang] += normalizedBodyText.slice(lastIndex);
  } else {
    Object.keys(sections).forEach((localeCode) => {
      sections[localeCode] = normalizedBodyText;
    });
  }

  const resolvedLocales = normalizeLocaleCodes([...targetLocales, ...Object.keys(sections)]);
  const htmlByLocale = Object.fromEntries(resolvedLocales.map((localeCode) => {
    const sectionRaw = String(sections[localeCode] || '').trim();
    return [localeCode, markdownToHtml(sectionRaw)];
  }));

  return {
    htmlByLocale,
    meta: {
      localeCodes: resolvedLocales,
      hasAnyLangMarker: markerLocales.size > 0,
      hasLangMarkerByLocale: Object.fromEntries(resolvedLocales.map((localeCode) => [localeCode, markerLocales.has(localeCode)]))
    }
  };
}

// MARK: CONFIG BLOCK PARSING
// Parses a top-level config JSON comment block and returns metadata + remaining body text.
function parseConfigMetadata(rawText, contextLabel) {
  const configRegex = /<!--\s*config\s*([\s\S]*?)-->/i;
  const match = String(rawText || '').match(configRegex);
  if (!match) {
    return {
      metadata: null,
      bodyText: String(rawText || '').trim(),
      errors: []
    };
  }

  const objectSegment = String(match[1] || '').trim();
  let parsedConfig = null;

  try {
    const evaluateObject = new Function(`return (${objectSegment});`);
    parsedConfig = evaluateObject();
  } catch {
    return {
      metadata: null,
      bodyText: String(rawText || '').replace(configRegex, '').trim(),
      errors: [`${contextLabel}: invalid config object in config block.`]
    };
  }

  const withoutConfig = String(rawText || '').replace(configRegex, '').trim();
  return {
    metadata: parsedConfig && typeof parsedConfig === 'object' ? parsedConfig : {},
    bodyText: withoutConfig,
    errors: []
  };
}

// MARK: LOCALE METADATA HELPERS
// Converts a suffix such as "en" or "pt-br" into a readable locale name.
function resolveLocaleDisplayName(localeCode) {
  const normalized = String(localeCode || '').trim().toLowerCase();
  if (!normalized) return '';

  const nativeNames = {
    en: 'English',
    pt: 'Português'
  };

  if (nativeNames[normalized]) {
    return nativeNames[normalized];
  }

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames([normalized], { type: 'language' });
      const resolved = displayNames.of(normalized);
      if (resolved && resolved !== normalized) {
        return resolved;
      }
    }
  } catch {
    // Falls through to a capitalization-based fallback.
  }

  return normalized
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

// Collects locale codes present in localized config objects.
function collectLocalizedLocales(metadata, fallbackLocales = DEFAULT_LOCALE_CODES) {
  const locales = new Set();

  [...REQUIRED_LOCALIZED_FIELDS, ...OPTIONAL_LOCALIZED_FIELDS].forEach((field) => {
    const localized = metadata?.[field];
    if (!localized || typeof localized !== 'object') return;

    Object.keys(localized).forEach((key) => {
      if (key === 'show') return;
      if (isNonEmptyString(localized[key])) {
        locales.add(key.toLowerCase());
      }
    });
  });

  const actions = metadata?.actions && typeof metadata.actions === 'object' ? metadata.actions : {};
  ['primary', 'secondary', 'tertiary'].forEach((actionKey) => {
    const action = actions?.[actionKey];
    if (!action || typeof action !== 'object') return;

    ['label', 'tooltip', 'imageAlt', 'ariaLabel', 'url', 'videoSrc', 'vttSrc'].forEach((fieldKey) => {
      const localized = action?.[fieldKey];
      if (!localized || typeof localized !== 'object' || Array.isArray(localized)) return;

      Object.keys(localized).forEach((localeCode) => {
        const normalizedLocale = String(localeCode || '').trim().toLowerCase();
        if (!normalizedLocale || normalizedLocale === 'show') return;
        if (isNonEmptyString(localized[localeCode])) {
          locales.add(normalizedLocale);
        }
      });
    });
  });

  if (Array.isArray(metadata?.customButtons)) {
    metadata.customButtons.forEach((button) => {
      if (!button || typeof button !== 'object') return;
      ['label', 'tooltip', 'imageAlt', 'ariaLabel', 'url', 'imageSrc'].forEach((fieldKey) => {
        const localized = button?.[fieldKey] ?? button?.[fieldKey.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)];
        if (!localized || typeof localized !== 'object' || Array.isArray(localized)) return;

        Object.keys(localized).forEach((localeCode) => {
          const normalizedLocale = String(localeCode || '').trim().toLowerCase();
          if (!normalizedLocale || normalizedLocale === 'show') return;
          if (isNonEmptyString(localized[localeCode])) {
            locales.add(normalizedLocale);
          }
        });
      });
    });
  }

  const fallback = normalizeLocaleCodes(fallbackLocales);
  fallback.forEach((localeCode) => locales.add(localeCode));

  return [...locales].sort((a, b) => a.localeCompare(b));
}

// MARK: LOCALIZED BODY PARSING
// Splits article body into localized language sections and renders each to HTML.
function parseLocalizedBody(bodyText, localeCodes = DEFAULT_LOCALE_CODES) {
  // Removes optional case config block comments from rendered body content.
  const normalizedBodyText = String(bodyText || '').replace(/<!--\s*config\s*[\s\S]*?-->/gi, '').trim();
  const targetLocales = normalizeLocaleCodes(localeCodes);

  // Stores raw localized markdown blocks before HTML conversion.
  const sections = Object.fromEntries(targetLocales.map((localeCode) => [localeCode, '']));
  const markerLocales = new Set();

  // Matches language markers used in case markdown files.
  const langRegex = /<!--\s*lang:([a-z0-9-]+)\s*-->/gi;
  // Tracks active language section while iterating markers.
  let activeLang = null;
  // Tracks previous marker boundary index.
  let lastIndex = 0;
  // Holds current regex match object during loop.
  let match;

  while ((match = langRegex.exec(normalizedBodyText)) !== null) {
    const markerLocale = String(match[1] || '').trim().toLowerCase();
    if (!markerLocale) continue;
    markerLocales.add(markerLocale);
    if (!(markerLocale in sections)) {
      sections[markerLocale] = '';
    }

    if (activeLang) {
      sections[activeLang] += normalizedBodyText.slice(lastIndex, match.index);
    }
    activeLang = markerLocale;
    lastIndex = langRegex.lastIndex;
  }

  // Falls back to mirrored content across configured locales when no explicit markers exist.
  if (activeLang) {
    sections[activeLang] += normalizedBodyText.slice(lastIndex);
  } else {
    Object.keys(sections).forEach((localeCode) => {
      sections[localeCode] = normalizedBodyText;
    });
  }

  const resolvedLocales = normalizeLocaleCodes([...targetLocales, ...Object.keys(sections)]);

  const hasHeadings = (markdown) => /(^|\n)#{2,3}\s+\S+/m.test(markdown || '');

  const descByLocale = {};
  const summaryByLocale = {};
  const readerRawByLocale = {};
  const hasReaderHeadingsByLocale = {};
  const hasLangMarkerByLocale = {};

  resolvedLocales.forEach((localeCode) => {
    const sectionRaw = String(sections[localeCode] || '').trim();
    descByLocale[localeCode] = markdownToHtml(sectionRaw);
    summaryByLocale[localeCode] = '';
    readerRawByLocale[localeCode] = sectionRaw;
    hasReaderHeadingsByLocale[localeCode] = hasHeadings(sectionRaw);
    hasLangMarkerByLocale[localeCode] = markerLocales.has(localeCode);
  });

  return {
    html: {
      desc: descByLocale,
      summary: summaryByLocale
    },
    meta: {
      localeCodes: resolvedLocales,
      hasAnyLangMarker: markerLocales.size > 0,
      hasLangMarkerByLocale,
      readerRawByLocale,
      hasReaderHeadingsByLocale
    }
  };
}

// Returns true only for non-empty trimmed strings.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// MARK: METADATA NORMALIZATION
// Parses a boolean-ish scalar to true/false when possible.
function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

// Normalizes top-level visibility flags and ensures a stable locales map shape.
function normalizeVisibilityConfig(value) {
  const visibility = value && typeof value === 'object' && !Array.isArray(value)
    ? { ...value }
    : {};

  const parseOrDefault = (candidate, fallbackValue) => {
    const parsed = parseBooleanFlag(candidate);
    return parsed === null ? fallbackValue : parsed;
  };

  visibility.web = parseOrDefault(visibility.web, true);
  visibility.crawlers = parseOrDefault(visibility.crawlers, true);
  visibility.ai = parseOrDefault(visibility.ai, true);

  if (!visibility.locales || typeof visibility.locales !== 'object' || Array.isArray(visibility.locales)) {
    visibility.locales = {};
  }

  return visibility;
}

// Builds URL-friendly slugs with accent stripping and fallback handling.
function toSlug(value, fallbackValue = 'item') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (normalized.length > 0) {
    return normalized;
  }

  return String(fallbackValue || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'item';
}

// Detects password-like keys recursively so markdown configs cannot embed secrets.
function objectHasPasswordLikeKeys(value, visited = new Set()) {
  if (!value || typeof value !== 'object') return false;
  if (visited.has(value)) return false;
  visited.add(value);

  return Object.entries(value).some(([key, entryValue]) => {
    if (/(password|passcode|secret|token)/i.test(String(key || ''))) {
      return true;
    }

    return objectHasPasswordLikeKeys(entryValue, visited);
  });
}

// MARK: DISPLAY DERIVATION
// Resolves the first valid boolean flag from a list of metadata keys.
function resolveBooleanFlag(metadata, keys) {
  for (const key of keys) {
    const parsed = parseBooleanFlag(metadata?.[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

// Normalizes modern case metadata shape and upgrades legacy-compatible fields.
function normalizeCaseMetadataSchema(metadata, defaultLocale = '') {
  const normalized = metadata && typeof metadata === 'object' ? { ...metadata } : {};
  const normalizedTitle = normalized.title && typeof normalized.title === 'object' ? { ...normalized.title } : normalized.title;
  const normalizedShortDesc = normalized.shortDesc && typeof normalized.shortDesc === 'object' ? { ...normalized.shortDesc } : normalized.shortDesc;
  const normalizedSummaryProps = normalized.summaryProps && typeof normalized.summaryProps === 'object'
    ? { ...normalized.summaryProps }
    : {};
  const actions = normalized.actions && typeof normalized.actions === 'object' ? { ...normalized.actions } : {};
  const primaryAction = actions.primary && typeof actions.primary === 'object' ? { ...actions.primary } : {};
  const secondaryAction = actions.secondary && typeof actions.secondary === 'object'
    ? { ...actions.secondary }
    : {};
  const tertiaryAction = actions.tertiary && typeof actions.tertiary === 'object'
    ? { ...actions.tertiary }
    : {};

  const isProtected = parseBooleanFlag(normalized?.isProtected);
  const isUnlocked = parseBooleanFlag(normalized?.isUnlocked);

  if (!primaryAction.vttSrc && normalized.vttSrc) {
    primaryAction.vttSrc = normalized.vttSrc;
  }

  if (Object.keys(primaryAction).length > 0) {
    actions.primary = primaryAction;
  }
  if (Object.keys(secondaryAction).length > 0) {
    actions.secondary = secondaryAction;
  }
  if (Object.keys(tertiaryAction).length > 0) {
    actions.tertiary = tertiaryAction;
  }

  normalized.actions = actions;
  normalized.title = normalizedTitle;
  normalized.shortDesc = normalizedShortDesc;
  normalized.summaryProps = normalizedSummaryProps;
  normalized.visibility = normalizeVisibilityConfig(normalized.visibility);
  normalized.isProtected = isProtected ?? false;
  normalized.isUnlocked = isUnlocked ?? false;

  const localizedTitle = normalized.title && typeof normalized.title === 'object' ? normalized.title : {};
  const existingSlugByLocale = normalized.slugByLocale && typeof normalized.slugByLocale === 'object' && !Array.isArray(normalized.slugByLocale)
    ? normalized.slugByLocale
    : {};
  const primaryLocale = resolvePrimaryLocale(
    [...Object.keys(localizedTitle), ...Object.keys(existingSlugByLocale)],
    defaultLocale
  );

  if (typeof normalized.slugByLocale === 'string') {
    normalized.slugByLocale = primaryLocale
      ? { [primaryLocale]: toSlug(normalized.slugByLocale, normalized.slug || normalized.id || 'case') }
      : {};
  }

  if (!normalized.slugByLocale || typeof normalized.slugByLocale !== 'object' || Array.isArray(normalized.slugByLocale)) {
    normalized.slugByLocale = {};
  }

  const fallbackSlug = normalized.slug || normalized.id || 'case';
  const resolvedDefaultLocale = resolvePrimaryLocale(
    [...Object.keys(localizedTitle), ...Object.keys(normalized.slugByLocale)],
    defaultLocale
  );
  const fallbackTitle =
    (resolvedDefaultLocale && typeof localizedTitle[resolvedDefaultLocale] === 'string' ? localizedTitle[resolvedDefaultLocale] : '')
    || Object.values(localizedTitle).find((value) => typeof value === 'string')
    || '';
  const localeSource = new Set([...Object.keys(localizedTitle), ...Object.keys(normalized.slugByLocale)]);
  if (resolvedDefaultLocale) {
    localeSource.add(resolvedDefaultLocale);
  }
  localeSource.forEach((localeCodeRaw) => {
    const localeCode = String(localeCodeRaw || '').trim().toLowerCase();
    if (!localeCode) return;

    const candidate = normalized.slugByLocale?.[localeCode];
    const candidateTitle = typeof localizedTitle[localeCode] === 'string' ? localizedTitle[localeCode] : fallbackTitle;
    normalized.slugByLocale[localeCode] = toSlug(candidate || candidateTitle, fallbackSlug);
  });

  return normalized;
}

// Resolves case placement mode from markdown file path.
function resolveCasePlacement(filePath) {
  const normalizedPath = String(filePath || '').replace(/\\/g, '/');
  if (normalizedPath.includes('/content/cases/summary/')) return 'summary-only';
  if (normalizedPath.includes('/content/cases/reader/')) return 'reader-only';
  return 'mixed';
}

// MARK: LOCALIZED CONTENT RESOLUTION
// Renders localized markdown maps into HTML payloads used by runtime article components.
function resolveLocalizedMarkdownHtml(value, localeCodes, defaultLocale = '') {
  const locales = normalizeLocaleCodes(localeCodes);
  const resolved = {};
  const primaryLocale = resolvePrimaryLocale(locales, defaultLocale);
  const fallbackLocalizedValue = value && typeof value === 'object'
    ? (
      (primaryLocale && typeof value[primaryLocale] === 'string' ? value[primaryLocale] : '')
      || Object.values(value).find((entry) => typeof entry === 'string')
      || ''
    )
    : '';

  locales.forEach((localeCode) => {
    let raw = '';
    if (typeof value === 'string') {
      raw = value;
    } else if (value && typeof value === 'object') {
      if (typeof value[localeCode] === 'string') {
        raw = value[localeCode];
      } else {
        raw = fallbackLocalizedValue;
      }
    }

    resolved[localeCode] = markdownToHtml(String(raw || '').trim());
  });

  return resolved;
}

// MARK: PARSED CASE DISPLAY SETTINGS
// Resolves the owning case folder path for a markdown file.
function resolveCaseFolder(filePath) {
  const normalizedPath = String(filePath || '').replace(/\\/g, '/');
  const folderIndex = normalizedPath.lastIndexOf('/case.md');
  if (folderIndex >= 0) {
    return normalizedPath.slice(0, folderIndex);
  }

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex) : normalizedPath;
}

// Derives runtime visibility toggles for summary, reader, TOC, and navigator.
function deriveDisplayToggles(metadata, bodyMeta, contextLabel) {
  const placement = resolveCasePlacement(contextLabel);
  const localeCodes = Array.isArray(bodyMeta?.localeCodes) && bodyMeta.localeCodes.length > 0
    ? bodyMeta.localeCodes
    : DEFAULT_LOCALE_CODES;

  const hasSummaryContent = localeCodes.some((localeCode) => {
    const configuredSummary = metadata?.summary?.[localeCode];
    return isNonEmptyString(configuredSummary);
  });
  const hasReaderContent = localeCodes.some((localeCode) => isNonEmptyString(bodyMeta?.readerRawByLocale?.[localeCode]));
  const hasReaderHeadings = localeCodes.some((localeCode) => Boolean(bodyMeta?.hasReaderHeadingsByLocale?.[localeCode]));

  const explicitShowSummary = resolveBooleanFlag(metadata, ['showSummary', 'show-summary', 'summary']);
  const explicitShowReader = resolveBooleanFlag(metadata, ['showReader', 'show-reader', 'reader']);
  const explicitShowToc = resolveBooleanFlag(metadata, ['showToc', 'show-toc', 'toc']);
  const explicitShowNavigator = resolveBooleanFlag(metadata, ['showNavigator', 'show-navigator', 'navigator']);
  const explicitShowPlayer = resolveBooleanFlag(metadata, ['showPlayer', 'show-player', 'player']);
  const explicitShowCover = resolveBooleanFlag(metadata, ['showCover', 'show-cover', 'cover']);

  let showSummary = hasSummaryContent;
  let showReader = hasReaderContent;

  if (placement === 'summary-only') {
    showSummary = hasSummaryContent;
    showReader = false;
  }

  if (placement === 'reader-only') {
    showSummary = false;
    showReader = hasReaderContent;
  }

  if (explicitShowSummary !== null) showSummary = explicitShowSummary;
  if (explicitShowReader !== null) showReader = explicitShowReader;

  let showCover = true;
  if (explicitShowCover !== null) showCover = explicitShowCover;

  let showPlayer = true;
  let showToc = hasReaderHeadings;
  let showNavigator = true;

  if (explicitShowPlayer !== null) showPlayer = explicitShowPlayer;
  if (explicitShowToc !== null) showToc = explicitShowToc;
  if (explicitShowNavigator !== null) showNavigator = explicitShowNavigator;

  return {
    showSummary,
    showReader,
    showCover,
    showPlayer,
    showToc,
    showNavigator
  };
}

// MARK: CASE CONTRACT VALIDATION
// Validates parsed case data and returns a list of user-facing error messages.
function validateCaseObject(caseData, bodyMeta, contextLabel) {
  // Collects validation errors produced by contract checks.
  const errors = [];
  const localeCodes = normalizeLocaleCodes(caseData?.locales || bodyMeta?.localeCodes || DEFAULT_LOCALE_CODES);

  // Validates required scalar metadata fields.
  REQUIRED_SCALAR_FIELDS.forEach((field) => {
    if (!isNonEmptyString(caseData?.[field])) {
      errors.push(`${contextLabel}: missing required field '${field}'.`);
    }
  });

  // Validates required localized metadata fields.
  REQUIRED_LOCALIZED_FIELDS.forEach((field) => {
    // Resolves localized object for current field.
    const localized = caseData?.[field];
    const missingLocales = localeCodes.filter((localeCode) => !isNonEmptyString(localized?.[localeCode]));

    if (missingLocales.length > 0) {
      errors.push(`${contextLabel}: field '${field}' must define localized values for: ${missingLocales.join(', ')}.`);
    }
  });

  OPTIONAL_LOCALIZED_FIELDS.forEach((field) => {
    const localized = caseData?.[field];
    if (!localized) return;

    if (typeof localized === 'string') return;

    const localeKeys = Object.keys(localized || {});
    const hasAtLeastOneValue = localeKeys.some((key) => isNonEmptyString(localized?.[key]));
    if (!hasAtLeastOneValue) return;
  });

  // Enforces non-empty localized reader/summary content contract.
  const missingBodyLocales = localeCodes.filter((localeCode) => {
    const hasDesc = isNonEmptyString(caseData?.desc?.[localeCode]);
    const hasSummary = isNonEmptyString(caseData?.summary?.[localeCode]);
    return !hasDesc && !hasSummary;
  });
  if (missingBodyLocales.length > 0) {
    errors.push(`${contextLabel}: body content must produce non-empty reader or summary sections for: ${missingBodyLocales.join(', ')}.`);
  }

  // Enforces language marker balance when explicit markers are used.
  if (bodyMeta.hasAnyLangMarker) {
    const missingMarkers = localeCodes.filter((localeCode) => !bodyMeta?.hasLangMarkerByLocale?.[localeCode]);
    if (missingMarkers.length > 0) {
      errors.push(`${contextLabel}: language markers are unbalanced. Missing markers for locales: ${missingMarkers.join(', ')}.`);
    }
  }

  // Rejects deprecated device source field in favor of catalog metadata fields.
  if (isNonEmptyString(caseData?.thumbDeviceSrc)) {
    errors.push(`${contextLabel}: field 'thumbDeviceSrc' is not supported. Use thumbCategory + thumbBrand + thumbModel + thumbColor.`);
  }

  if (objectHasPasswordLikeKeys(caseData)) {
    errors.push(`${contextLabel}: password-like config keys are not allowed in case markdown. Store per-case secrets in a server-only password config.`);
  }

  if (typeof caseData?.tooltip !== 'undefined') {
    errors.push(`${contextLabel}: top-level 'tooltip' is not supported. Use actions.primary/secondary/tertiary.tooltip.`);
  }

  ['showH1', 'showH2', 'year', 'videoSrc', 'repoSrc', 'demoSrc', 'readerLabel'].forEach((legacyKey) => {
    if (typeof caseData?.[legacyKey] !== 'undefined') {
      errors.push(`${contextLabel}: legacy field '${legacyKey}' is not supported. Use the modern config schema fields instead.`);
    }
  });

  if (caseData?.summaryProps && typeof caseData.summaryProps === 'object') {
    ['label-header', 'show-metrics', 'aria-label'].forEach((legacySummaryKey) => {
      if (typeof caseData.summaryProps?.[legacySummaryKey] !== 'undefined') {
        errors.push(`${contextLabel}: summaryProps.${legacySummaryKey} is not supported. Use camelCase keys in summaryProps.`);
      }
    });
  }

  if (caseData?.actions && typeof caseData.actions === 'object') {
    ['secondary1', 'secondary2'].forEach((legacyActionKey) => {
      if (typeof caseData.actions?.[legacyActionKey] !== 'undefined') {
        errors.push(`${contextLabel}: actions.${legacyActionKey} is not supported. Use actions.secondary and actions.tertiary.`);
      }
    });
  }

  const hasLocalizedContent = (value) => {
    if (isNonEmptyString(value)) return true;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return localeCodes.some((localeCode) => isNonEmptyString(value?.[localeCode]));
  };

  const actions = caseData?.actions && typeof caseData.actions === 'object' ? caseData.actions : {};
  ['primary', 'secondary', 'tertiary'].forEach((actionKey) => {
    const action = actions?.[actionKey];
    if (!action || typeof action !== 'object') return;

    const enabledFlag = parseBooleanFlag(action?.enabled);
    const isActionEnabled = enabledFlag === null ? true : enabledFlag;

    if (typeof action?.['video-src'] !== 'undefined') {
      errors.push(`${contextLabel}: actions.${actionKey}.video-src is not supported. Use actions.${actionKey}.videoSrc.`);
    }

    if (typeof action?.['vtt-src'] !== 'undefined') {
      errors.push(`${contextLabel}: actions.${actionKey}.vtt-src is not supported. Use actions.${actionKey}.vttSrc.`);
    }

    const hasActionTarget = hasLocalizedContent(action?.url)
      || hasLocalizedContent(action?.videoSrc)
      || hasLocalizedContent(action?.vttSrc);

    if (!isActionEnabled || !hasActionTarget) return;

    if (!hasLocalizedContent(action?.label)) {
      errors.push(`${contextLabel}: actions.${actionKey}.label must define localized text when the action has url/media target.`);
    }

    if (!hasLocalizedContent(action?.tooltip)) {
      errors.push(`${contextLabel}: actions.${actionKey}.tooltip must define localized text when the action is enabled and has url/media target.`);
    }
  });

  return errors;
}

// MARK: DIAGNOSTIC PARSING ENTRYPOINT
// Parses one markdown case and returns structured data plus validation diagnostics.
export function parseCaseMarkdownWithDiagnostics(rawText, options = {}) {
  // Resolves context label used in diagnostic message prefixes.
  const contextLabel = options.filePath || 'markdown-case';
  const requestedLocales = normalizeLocaleCodes(options.locales || DEFAULT_LOCALE_CODES);
  const preferredDefaultLocale = resolvePrimaryLocale(requestedLocales, options.defaultLocale || '');
  let metadata = null;
  let bodyText = String(rawText || '').trim();
  const errors = [];

  // Preferred format: one top-level config block with JSON payload.
  const configPayload = parseConfigMetadata(rawText, contextLabel);
  errors.push(...configPayload.errors);

  if (!configPayload.metadata) {
    return {
      caseData: null,
      errors: [...errors, `${contextLabel}: missing required config block. Cases must start with '<!-- config ... -->'.`]
    };
  }

  metadata = normalizeCaseMetadataSchema(configPayload.metadata, preferredDefaultLocale);
  bodyText = configPayload.bodyText;

  // Derives locale candidates from caller input and metadata before body parsing.
  const metadataLocales = collectLocalizedLocales(metadata, requestedLocales);
  const preferredLocales = normalizeLocaleCodes([...requestedLocales, ...metadataLocales]);
  const resolvedDefaultLocale = resolvePrimaryLocale(preferredLocales, preferredDefaultLocale);
  metadata = normalizeCaseMetadataSchema(configPayload.metadata, resolvedDefaultLocale);

  // Parses and renders localized body content.
  const body = parseLocalizedBody(bodyText, preferredLocales);
  const localeCodes = normalizeLocaleCodes([...preferredLocales, ...(body.meta?.localeCodes || [])]);
  const finalDefaultLocale = resolvePrimaryLocale(localeCodes, resolvedDefaultLocale);

  if (localeCodes.length === 0) {
    errors.push(`${contextLabel}: unable to resolve locales. Provide 'options.locales' or localized metadata/body markers.`);
  }

  // Builds runtime case payload with parser-provided body fields.
  const caseData = {
    ...metadata,
    desc: body.html.desc,
    summary: (() => {
      const configuredSummary = resolveLocalizedMarkdownHtml(metadata?.summary, localeCodes, finalDefaultLocale);
      return Object.fromEntries(localeCodes.map((localeCode) => {
        const configured = configuredSummary[localeCode];
        const parsed = body.html.summary?.[localeCode] || '';
        return [localeCode, configured && configured.trim().length > 0 ? configured : parsed];
      }));
    })(),
    descRecruiter: metadata.descRecruiter || body.html.desc,
    display: deriveDisplayToggles(metadata, body.meta, contextLabel),
    locales: localeCodes,
    localeNames: Object.fromEntries(
      localeCodes.map((localeCode) => [localeCode, resolveLocaleDisplayName(localeCode)])
    ),
    caseFolder: resolveCaseFolder(contextLabel)
  };

  // Runs contract validation against parsed payload.
  errors.push(...validateCaseObject(caseData, body.meta, contextLabel));

  return {
    caseData,
    errors
  };
}

// MARK: STRICT PARSE EXPORT
// Parses a markdown case and returns null when diagnostics contain errors.
export function parseCaseMarkdown(rawText) {
  // Reuses diagnostic parser to avoid duplicate parsing logic.
  const { caseData, errors } = parseCaseMarkdownWithDiagnostics(rawText);
  if (errors.length > 0) {
    return null;
  }

  return caseData;
}
