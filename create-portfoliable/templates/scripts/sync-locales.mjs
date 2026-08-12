#!/usr/bin/env node
// File: scripts/sync-locales.mjs
// Purpose: Keep case/about markdown locale sections aligned with configured i18n locales.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { readLocaleConfigFromI18nConfig } from './i18n-config-utils.mjs';

// MARK: LOCALE SYNC CATALOGS
// Lists case config fields expected to stay localized across all supported locales.
const CASE_LOCALIZED_FIELDS = [
  'title',
  'shortDesc',
  'readTime',
  'kicker',
  'slugByLocale',
  'thumbSrc',
  'socialImage',
  'summary',
  'audioLabel',
  'audioSrc',
  'summaryProps.text',
  'summaryProps.labelHeader',
  'summaryProps.ariaLabel'
];

const CASE_CONFIG_GROUPS = [
  { title: 'Identity', keys: ['id', 'caseOrder', 'slugByLocale', 'socialImage'] },
  { title: 'Localized Metadata', keys: ['title', 'shortDesc', 'readTime', 'kicker'] },
  { title: 'Thumbnail and Cover', keys: ['thumbSrc', 'thumbCategory', 'thumbBrand', 'thumbModel', 'thumbColor', 'showCover'] },
  { title: 'Summary Experience (config-driven)', keys: ['showSummary', 'summary', 'summaryProps'] },
  { title: 'Reader Experience', keys: ['showReader', 'showToc', 'showNavigator'] },
  { title: 'Audio Experience', keys: ['audioLabel', 'audioSrc', 'showPlayer'] },
  { title: 'Visibility and Protection', keys: ['visibility', 'isProtected', 'isUnlocked'] },
  { title: 'Social', keys: ['social'] },
  { title: 'Actions', keys: ['actions'] },
  { title: 'Custom Buttons', keys: ['customButtons'] }
];

const ABOUT_CONFIG_GROUPS = [
  { title: 'Identity', keys: ['slugByLocale', 'socialImage'] },
  { title: 'Localized Content', keys: ['title', 'subtitle'] },
  { title: 'Visibility', keys: ['visibility'] },
  { title: 'Actions', keys: ['actions'] },
  { title: 'Social', keys: ['social'] },
  { title: 'Custom Buttons', keys: ['customButtons'] }
];

const LABEL_GROUPS = [
  {
    title: 'SEO Meta',
    keys: [
      'meta_home_title',
      'meta_home_description'
    ]
  },
  {
    title: 'Home View',
    keys: [
      'h1_title',
      'footer_text',
      'nav_home',
      'about_title',
      'view_about_aria_label'
    ]
  },
  {
    title: 'Case View and Actions',
    keys: [
      'view_case_aria_label',
      'protected_case',
      'enter_passcode',
      'unlock',
      'case_unlocked',
      'incorrect_passcode'
    ]
  },
  {
    title: 'Player View',
    keys: [
      'player_video_title',
      'player_label_play',
      'player_label_pause',
      'player_label_cc_on',
      'player_label_cc_off',
      'player_label_mute',
      'player_label_unmute',
      'player_label_speed',
    ]
  },
  {
    title: 'Audio Player',
    keys: [
      'player_audio_reader',
      'player_audio_play',
      'player_audio_pause',
      'player_audio_mute',
      'player_audio_unmute',
      'player_audio_speed',
      'player_audio_hide',
      'player_audio_show',
      'player_audio_autoscroll_on',
      'player_audio_autoscroll_off',
      'player_audio_volume',
      'player_audio_volume_level',
      'player_audio_position'
    ]
  },
  {
    title: 'Search and Navigator',
    keys: [
      'btn_return',
      'search_cases_placeholder',
      'search_cases_tooltip_open',
      'search_cases_tooltip_close',
      'search_main_view_title',
      'search_main_view_snippet',
      'search_case_studies_label',
      'case_nav_prev',
      'case_nav_next',
      'case_nav_prev_locked',
      'case_nav_next_locked'
    ]
  },
  {
    title: 'Breadcrumb Menus',
    keys: [
      'breadcrumb_menu_case_header',
      'breadcrumb_menu_video_header',
    ]
  },
  {
    title: 'Accessibility Modal',
    keys: [
      'popup_a11y_title',
      'a11y_cat_typography',
      'a11y_size',
      'a11y_dyslexia',
      'a11y_cat_visuals',
      'a11y_dark',
      'a11y_contrast',
      'a11y_motion',
      'a11y_tab'
    ]
  },
  {
    title: 'Language Modal',
    keys: [
      'popup_lang_title',
      'lang_cat'
    ]
  },
  {
    title: 'Sharing',
    keys: [
      'share_text',
    ]
  },
  {
    title: 'Toast',
    keys: [
      'resume_reading',
      'toast_label_close',
      'toast_label_never_show'
    ]
  },
  {
    title: 'Diagnostics and Errors',
    keys: [
      'mermaid_error'
    ]
  }
];

const GROUPED_LABEL_KEYS = LABEL_GROUPS.flatMap((group) => group.keys);
const LEGACY_LABEL_KEYS = new Set([
  'about_title_fallback',
  'summary_header_default',
  'audio_label_reader',
  'case_nav_prev_case',
  'case_nav_next_case',
  'breadcrumb_menu_case_category',
  'breadcrumb_menu_video_category',
  'nav_about',
  'case_empty_state_explore',
  'player_label_back'
]);

// MARK: FILE AND LAYOUT HELPERS
// Recursively collects markdown files under the target content directory.
function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  const files = [];
  // Walks all nested directories and captures markdown file paths.
  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
        return;
      }
      if (entry.name.toLowerCase().endsWith('.md')) {
        files.push(nextPath);
      }
    });
  };

  walk(dirPath);
  return files;
}

// Resolves template or consumer layout paths used by locale sync operations.
function resolveProjectLayout(cwd = process.cwd()) {
  const templateModeRoot = path.join(cwd, 'templates');
  const hasTemplateI18n = fs.existsSync(path.join(templateModeRoot, 'configs', 'i18n', 'i18n.config.js'));

  if (hasTemplateI18n) {
    return {
      mode: 'template',
      root: cwd,
      i18nConfigPath: path.join(templateModeRoot, 'configs', 'i18n', 'i18n.config.js'),
      labelsPath: path.join(templateModeRoot, 'configs', 'i18n', 'i18n.labels.js'),
      casesDir: path.join(templateModeRoot, 'src', 'content', 'cases'),
      aboutPath: path.join(templateModeRoot, 'src', 'content', 'about', 'ABOUTME.md')
    };
  }

  return {
    mode: 'consumer',
    root: cwd,
    i18nConfigPath: path.join(cwd, 'configs', 'i18n', 'i18n.config.js'),
    labelsPath: path.join(cwd, 'configs', 'i18n', 'i18n.labels.js'),
    casesDir: path.join(cwd, 'src', 'content', 'cases'),
    aboutPath: path.join(cwd, 'src', 'content', 'about', 'ABOUTME.md')
  };
}

// Loads supported locale codes and default locale from i18n config.
function loadSupportedLocales(i18nConfigPath) {
  const localeConfig = readLocaleConfigFromI18nConfig(i18nConfigPath);
  return {
    localeCodes: localeConfig.supportedLocales,
    defaultLocale: localeConfig.defaultLocale
  };
}

// Parses labels file in modern JS-module format with legacy wrapper fallback.
function parseI18nLabelsFile(source) {
  const raw = String(source || '');

  // Preferred format: JavaScript module with `export default { ... }`.
  const moduleMatch = raw.match(/^\s*export\s+default\s+([\s\S]*?)\s*;?\s*$/i);
  if (moduleMatch?.[1]) {
    const expression = String(moduleMatch[1]).trim();
    try {
      const evaluateObject = new Function(`return (${expression});`);
      const parsed = evaluateObject();
      return {
        labelsByLocale: parsed && typeof parsed === 'object' ? parsed : {},
        parseError: null
      };
    } catch (error) {
      return { labelsByLocale: {}, parseError: error };
    }
  }

  // Backward-compatible migration support for legacy markdown wrapper.
  const markdownMatch = raw.match(/<!--\s*i18n-labels\s*([\s\S]*?)-->/i);
  if (markdownMatch?.[1]) {
    const expression = String(markdownMatch[1] || '').trim();
    try {
      const evaluateObject = new Function(`return (${expression});`);
      const parsed = evaluateObject();
      return {
        labelsByLocale: parsed && typeof parsed === 'object' ? parsed : {},
        parseError: null
      };
    } catch (error) {
      return { labelsByLocale: {}, parseError: error };
    }
  }

  return { labelsByLocale: {}, parseError: null };
}

// Normalizes label keys and removes deprecated key aliases.
function normalizeLabelKey(rawKey) {
  const key = String(rawKey || '').trim();
  if (!key) return '';
  if (/^lang_[a-z0-9-]+$/i.test(key) && key !== 'lang_title') return '';
  if (key === 'ph_email_lio') return 'ph_email';
  return key;
}

// Sanitizes locale label maps to canonical key/value string pairs.
function sanitizeLocaleLabels(input) {
  const normalized = {};
  Object.entries(input || {}).forEach(([rawKey, rawValue]) => {
    const key = normalizeLabelKey(rawKey);
    if (!key) return;
    if (LEGACY_LABEL_KEYS.has(key)) return;
    if (typeof rawValue === 'string') {
      normalized[key] = rawValue;
      return;
    }
    normalized[key] = String(rawValue ?? '');
  });
  return normalized;
}

// Escapes label values for stable JavaScript serialization.
function escapeLabelValue(value) {
  return JSON.stringify(String(value ?? ''));
}

// Builds deterministic key order by grouped labels then discovered extras.
function buildCanonicalLabelKeys(defaultLabels) {
  const ordered = [];
  const seen = new Set();

  GROUPED_LABEL_KEYS.forEach((key) => {
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
  });

  Object.keys(defaultLabels || {}).forEach((key) => {
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
  });

  return ordered;
}

// Serializes one locale labels object grouped by semantic sections.
function serializeLocaleObjectWithGroups(localeLabels, canonicalKeys) {
  const groupedOutput = [];
  const covered = new Set();

  LABEL_GROUPS.forEach((group) => {
    const keysInGroup = group.keys.filter((key) => canonicalKeys.includes(key));
    if (keysInGroup.length === 0) return;

    groupedOutput.push(`    // ${group.title}`);
    keysInGroup.forEach((key) => {
      covered.add(key);
      const value = key in localeLabels ? localeLabels[key] : '';
      groupedOutput.push(`    ${JSON.stringify(key)}: ${escapeLabelValue(value)},`);
    });
    groupedOutput.push('');
  });

  const otherKeys = canonicalKeys.filter((key) => !covered.has(key));
  if (otherKeys.length > 0) {
    groupedOutput.push('    // Other');
    otherKeys.forEach((key) => {
      const value = key in localeLabels ? localeLabels[key] : '';
      groupedOutput.push(`    ${JSON.stringify(key)}: ${escapeLabelValue(value)},`);
    });
    groupedOutput.push('');
  }

  while (groupedOutput[groupedOutput.length - 1] === '') {
    groupedOutput.pop();
  }

  return groupedOutput.join('\n');
}

// Serializes all locales into export default labels module format.
function serializeI18nLabelsJs(labelsByLocale, canonicalKeys, localeOrder) {
  const lines = ['{'];

  localeOrder.forEach((localeCode, index) => {
    lines.push(`  ${JSON.stringify(localeCode)}: {`);
    lines.push(serializeLocaleObjectWithGroups(labelsByLocale[localeCode] || {}, canonicalKeys));
    lines.push(index === localeOrder.length - 1 ? '  }' : '  },');
  });

  lines.push('}');

  return `export default ${lines.join('\n')};\n`;
}

// Synchronizes labels file locale keys and values with current locale configuration.
function syncI18nLabelsFile(labelsPath, localeCodes, defaultLocale, options = {}) {
  if (!fs.existsSync(labelsPath)) {
    return false;
  }

  const pruneLocales = options.pruneLocales === true;

  const source = fs.readFileSync(labelsPath, 'utf8');
  const parsed = parseI18nLabelsFile(source);
  if (parsed.parseError) {
    console.warn(`[sync-locales] Skipping labels sync due to invalid labels object at ${labelsPath}. Fix syntax and save again.`);
    return false;
  }
  const existingLabels = parsed.labelsByLocale && typeof parsed.labelsByLocale === 'object'
    ? parsed.labelsByLocale
    : {};

  const normalizedLocaleMap = {};
  Object.entries(existingLabels).forEach(([rawLocaleCode, localeLabels]) => {
    const localeCode = String(rawLocaleCode || '').trim().toLowerCase();
    if (!localeCode) return;
    normalizedLocaleMap[localeCode] = sanitizeLocaleLabels(localeLabels);
  });

  const fallbackDefaultLocale = localeCodes[0] || Object.keys(normalizedLocaleMap)[0] || '';
  const resolvedDefaultLocale = defaultLocale || fallbackDefaultLocale;
  const defaultLabels = normalizedLocaleMap[resolvedDefaultLocale] && typeof normalizedLocaleMap[resolvedDefaultLocale] === 'object'
    ? normalizedLocaleMap[resolvedDefaultLocale]
    : {};

  const canonicalKeys = buildCanonicalLabelKeys(defaultLabels);
  const localeOrder = [...localeCodes];
  if (!pruneLocales) {
    Object.keys(normalizedLocaleMap).forEach((localeCode) => {
      if (!localeOrder.includes(localeCode)) {
        localeOrder.push(localeCode);
      }
    });
  }

  const nextLabelsByLocale = {};

  localeOrder.forEach((localeCode) => {
    const existingLocaleLabels = normalizedLocaleMap[localeCode] || {};
    const nextLocaleLabels = {};

    canonicalKeys.forEach((labelKey) => {
      if (typeof existingLocaleLabels[labelKey] === 'string') {
        nextLocaleLabels[labelKey] = existingLocaleLabels[labelKey];
        return;
      }

      if (localeCode === resolvedDefaultLocale && typeof defaultLabels[labelKey] === 'string') {
        nextLocaleLabels[labelKey] = defaultLabels[labelKey];
        return;
      }

      nextLocaleLabels[labelKey] = '';
    });

    nextLabelsByLocale[localeCode] = nextLocaleLabels;
  });

  const nextContent = serializeI18nLabelsJs(nextLabelsByLocale, canonicalKeys, localeOrder);
  if (nextContent === source) return false;
  fs.writeFileSync(labelsPath, nextContent, 'utf8');
  return true;
}

// Ensures an object field is represented as locale->value map with fallbacks.
function ensureLocalizedObject(target, key, localeCodes, defaultValue = '', options = {}) {
  const current = target[key];
  const result = {};
  const preserveKeys = Array.isArray(options.preserveKeys) ? options.preserveKeys : [];
  const fallbackLocale = String(options.fallbackLocale || localeCodes[0] || '').trim().toLowerCase();

  preserveKeys.forEach((preserveKey) => {
    if (current && typeof current === 'object' && !Array.isArray(current) && preserveKey in current) {
      result[preserveKey] = current[preserveKey];
    }
  });

  if (typeof current === 'string') {
    localeCodes.forEach((localeCode) => {
      result[localeCode] = current;
    });
  } else if (current && typeof current === 'object') {
    const fallbackLocalizedValue =
      (fallbackLocale && typeof current[fallbackLocale] === 'string' ? current[fallbackLocale] : '')
      || Object.values(current).find((value) => typeof value === 'string')
      || defaultValue;

    localeCodes.forEach((localeCode) => {
      const localizedValue = current[localeCode];
      if (typeof localizedValue === 'string') {
        result[localeCode] = localizedValue;
      } else {
        result[localeCode] = fallbackLocalizedValue;
      }
    });
  } else {
    localeCodes.forEach((localeCode) => {
      result[localeCode] = defaultValue;
    });
  }

  target[key] = result;
}

// Parses booleans from mixed string/boolean values with configurable fallback.
function parseBooleanLike(value, fallbackValue = true) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallbackValue;
}

// Normalizes any value into kebab-case slug text.
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

// Normalizes visibility flags and locale visibility map shape.
function ensureVisibilityConfig(target) {
  const visibility = target.visibility && typeof target.visibility === 'object' && !Array.isArray(target.visibility)
    ? { ...target.visibility }
    : {};

  visibility.web = parseBooleanLike(visibility.web, true);
  visibility.crawlers = parseBooleanLike(visibility.crawlers, true);
  visibility.ai = parseBooleanLike(visibility.ai, true);

  if (!visibility.locales || typeof visibility.locales !== 'object' || Array.isArray(visibility.locales)) {
    visibility.locales = {};
  }

  target.visibility = visibility;
}

// Parses named HTML comment config blocks and returns config + stripped body.
function parseCommentConfigBlock(source, blockName) {
  const regex = new RegExp(`<!--\\s*${blockName}\\s*([\\s\\S]*?)-->`, 'i');
  const match = String(source || '').match(regex);
  if (!match) {
    return null;
  }

  try {
    const expression = String(match[1] || '').trim();
    const evaluateObject = new Function(`return (${expression});`);
    const parsed = evaluateObject();
    return {
      regex,
      config: parsed && typeof parsed === 'object' ? parsed : {},
      body: String(source || '').replace(regex, '').trim()
    };
  } catch {
    return null;
  }
}

// Serializes arbitrary values into readable multiline JSON blocks.
function serializeConfigValue(value) {
  return JSON.stringify(value, null, 2);
}

// Serializes config objects with grouped section comments and deterministic key order.
function serializeGroupedConfigObject(config, groups) {
  const emitted = new Set();
  const lines = ['{'];

  groups.forEach((group) => {
    const entries = group.keys.filter((key) => Object.prototype.hasOwnProperty.call(config, key));
    if (entries.length === 0) return;

    lines.push(`  // ${group.title}`);
    entries.forEach((key) => {
      emitted.add(key);
      const serializedValue = serializeConfigValue(config[key]).split('\n');
      if (serializedValue.length === 1) {
        lines.push(`  ${JSON.stringify(key)}: ${serializedValue[0]},`);
        return;
      }

      lines.push(`  ${JSON.stringify(key)}: ${serializedValue[0]}`);
      serializedValue.slice(1, -1).forEach((line) => {
        lines.push(`  ${line}`);
      });
      lines.push(`  ${serializedValue[serializedValue.length - 1]},`);
    });
    lines.push('');
  });

  const remainingKeys = Object.keys(config).filter((key) => !emitted.has(key));
  if (remainingKeys.length > 0) {
    lines.push('  // Other');
    remainingKeys.forEach((key) => {
      const serializedValue = serializeConfigValue(config[key]).split('\n');
      if (serializedValue.length === 1) {
        lines.push(`  ${JSON.stringify(key)}: ${serializedValue[0]},`);
        return;
      }

      lines.push(`  ${JSON.stringify(key)}: ${serializedValue[0]}`);
      serializedValue.slice(1, -1).forEach((line) => {
        lines.push(`  ${line}`);
      });
      lines.push(`  ${serializedValue[serializedValue.length - 1]},`);
    });
    lines.push('');
  }

  while (lines[lines.length - 1] === '') {
    lines.pop();
  }

  lines.push('}');
  return lines.join('\n');
}

// Rebuilds a named comment config block and appends normalized markdown body.
function serializeCommentConfigBlock(blockName, config, body, groups = []) {
  const configText = serializeGroupedConfigObject(config, groups);
  return `<!-- ${blockName}\n${configText}\n-->\n\n${String(body || '').trim()}\n`;
}

// Splits markdown body into locale-marked sections while preserving shared content fallback.
function splitLocalizedBody(bodyText) {
  const sections = {};
  const regex = /<!--\s*lang:([a-z0-9-]+)\s*-->/gi;
  const source = String(bodyText || '').trim();
  let activeLocale = null;
  let lastIndex = 0;
  let hasMarkers = false;
  let match;

  while ((match = regex.exec(source)) !== null) {
    const localeCode = String(match[1] || '').trim().toLowerCase();
    if (!localeCode) continue;
    hasMarkers = true;

    if (activeLocale) {
      sections[activeLocale] = `${sections[activeLocale] || ''}${source.slice(lastIndex, match.index)}`.trim();
    }

    activeLocale = localeCode;
    lastIndex = regex.lastIndex;
  }

  if (activeLocale) {
    sections[activeLocale] = `${sections[activeLocale] || ''}${source.slice(lastIndex)}`.trim();
  }

  return {
    hasMarkers,
    sections,
    shared: hasMarkers ? '' : source
  };
}

// Reconstructs locale sections and fills missing content with placeholders.
function buildLocalizedBody(localeCodes, parsedBody, placeholderBuilder, options = {}) {
  const pruneLocales = options.pruneLocales === true;
  const existingLocales = Object.keys(parsedBody.sections || {});
  const outputLocales = pruneLocales
    ? [...localeCodes]
    : [...localeCodes, ...existingLocales.filter((localeCode) => !localeCodes.includes(localeCode))];

  if (!parsedBody.hasMarkers) {
    const defaultLocale = outputLocales[0] || '';
    if (defaultLocale) {
      parsedBody.sections[defaultLocale] = parsedBody.shared;
    }
  }

  return outputLocales
    .map((localeCode) => {
      const currentSection = String(parsedBody.sections[localeCode] || '').trim();
      const content = currentSection || placeholderBuilder(localeCode);
      return `<!-- lang:${localeCode} -->\n${content}`;
    })
    .join('\n\n')
    .trim();
}

  // Normalizes case config schema, booleans, localized fields, and action payloads.
function syncCaseConfig(caseConfig, localeCodes) {
  delete caseConfig.audioSrcRecruiter;

  caseConfig.showSummary = parseBooleanLike(caseConfig.showSummary, false);
  caseConfig.showReader = parseBooleanLike(caseConfig.showReader, true);
  caseConfig.showPlayer = parseBooleanLike(caseConfig.showPlayer, true);
  caseConfig.showToc = parseBooleanLike(caseConfig.showToc, false);
  caseConfig.showNavigator = parseBooleanLike(caseConfig.showNavigator, true);
  caseConfig.showCover = parseBooleanLike(caseConfig.showCover, true);

  caseConfig.kicker = caseConfig.kicker ?? caseConfig.year ?? {};

  ensureLocalizedObject(caseConfig, 'title', localeCodes, '', { preserveKeys: ['show'] });
  if (typeof caseConfig.title.show !== 'boolean') {
    caseConfig.title.show = parseBooleanLike(caseConfig.showH1, true);
  }

  ensureLocalizedObject(caseConfig, 'shortDesc', localeCodes, '', { preserveKeys: ['show'] });
  if (typeof caseConfig.shortDesc.show !== 'boolean') {
    caseConfig.shortDesc.show = parseBooleanLike(caseConfig.showH2, true);
  }

  ['readTime', 'kicker', 'thumbSrc', 'summary', 'audioLabel', 'audioSrc'].forEach((fieldName) => {
    ensureLocalizedObject(caseConfig, fieldName, localeCodes, '');
  });

  ensureLocalizedObject(caseConfig, 'socialImage', localeCodes, '');
  ensureLocalizedObject(caseConfig, 'slugByLocale', localeCodes, '');
  localeCodes.forEach((localeCode) => {
    const localizedTitle = String(caseConfig.title?.[localeCode] || '').trim();
    const localizedSlug = String(caseConfig.slugByLocale?.[localeCode] || '').trim();
    if (localizedSlug) {
      caseConfig.slugByLocale[localeCode] = toSlug(localizedSlug, caseConfig.id || 'case');
      return;
    }

    caseConfig.slugByLocale[localeCode] = toSlug(localizedTitle, caseConfig.id || 'case');
  });

  ensureVisibilityConfig(caseConfig);
  caseConfig.isProtected = parseBooleanLike(caseConfig.isProtected, false);
  caseConfig.isUnlocked = parseBooleanLike(caseConfig.isUnlocked, false);

  if (!caseConfig.summaryProps || typeof caseConfig.summaryProps !== 'object' || Array.isArray(caseConfig.summaryProps)) {
    caseConfig.summaryProps = {};
  }

  if (typeof caseConfig.summaryProps.labelHeader === 'undefined' && typeof caseConfig.summaryProps['label-header'] !== 'undefined') {
    caseConfig.summaryProps.labelHeader = caseConfig.summaryProps['label-header'];
  }

  if (typeof caseConfig.summaryProps.ariaLabel === 'undefined' && typeof caseConfig.summaryProps['aria-label'] !== 'undefined') {
    caseConfig.summaryProps.ariaLabel = caseConfig.summaryProps['aria-label'];
  }

  if (typeof caseConfig.summaryProps.showMetrics === 'undefined' && typeof caseConfig.summaryProps['show-metrics'] !== 'undefined') {
    caseConfig.summaryProps.showMetrics = caseConfig.summaryProps['show-metrics'];
  }

  delete caseConfig.summaryProps['label-header'];
  delete caseConfig.summaryProps['aria-label'];
  delete caseConfig.summaryProps['show-metrics'];

  ensureLocalizedObject(caseConfig.summaryProps, 'text', localeCodes, '');
  ensureLocalizedObject(caseConfig.summaryProps, 'labelHeader', localeCodes, '');
  ensureLocalizedObject(caseConfig.summaryProps, 'ariaLabel', localeCodes, '');
  caseConfig.summaryProps.active = parseBooleanLike(caseConfig.summaryProps.active, false);
  caseConfig.summaryProps.showMetrics = parseBooleanLike(caseConfig.summaryProps.showMetrics, false);

  delete caseConfig.year;
  delete caseConfig.slug;
  delete caseConfig.showH1;
  delete caseConfig.showH2;

  if (!caseConfig.actions || typeof caseConfig.actions !== 'object') {
    caseConfig.actions = {};
  }

  const primaryAction = caseConfig.actions.primary && typeof caseConfig.actions.primary === 'object'
    ? caseConfig.actions.primary
    : (caseConfig.actions.primary = {});
  const secondaryAction = caseConfig.actions.secondary && typeof caseConfig.actions.secondary === 'object'
    ? caseConfig.actions.secondary
    : (caseConfig.actions.secondary1 && typeof caseConfig.actions.secondary1 === 'object'
      ? caseConfig.actions.secondary1
      : (caseConfig.actions.secondary = {}));
  const tertiaryAction = caseConfig.actions.tertiary && typeof caseConfig.actions.tertiary === 'object'
    ? caseConfig.actions.tertiary
    : (caseConfig.actions.secondary2 && typeof caseConfig.actions.secondary2 === 'object'
      ? caseConfig.actions.secondary2
      : (caseConfig.actions.tertiary = {}));

  if (!primaryAction.videoSrc && caseConfig.videoSrc) {
    primaryAction.videoSrc = caseConfig.videoSrc;
  }
  if (!primaryAction.vttSrc && caseConfig.vttSrc) {
    primaryAction.vttSrc = caseConfig.vttSrc;
  }
  if (!secondaryAction.url && caseConfig.repoSrc) {
    secondaryAction.url = caseConfig.repoSrc;
  }
  if (!tertiaryAction.url && caseConfig.demoSrc) {
    tertiaryAction.url = caseConfig.demoSrc;
  }

  ensureLocalizedObject(primaryAction, 'videoSrc', localeCodes, '');
  ensureLocalizedObject(primaryAction, 'vttSrc', localeCodes, '');
  ensureLocalizedObject(primaryAction, 'url', localeCodes, '');
  ensureLocalizedObject(secondaryAction, 'url', localeCodes, '');
  ensureLocalizedObject(tertiaryAction, 'url', localeCodes, '');

  delete caseConfig.videoSrc;
  delete caseConfig.vttSrc;
  delete caseConfig.repoSrc;
  delete caseConfig.demoSrc;

  if (caseConfig.actions && typeof caseConfig.actions === 'object') {
    ['primary', 'secondary', 'tertiary', 'secondary1', 'secondary2'].forEach((actionKey) => {
      const action = caseConfig.actions[actionKey];
      if (!action || typeof action !== 'object') return;
      ensureLocalizedObject(action, 'label', localeCodes, '');
      ensureLocalizedObject(action, 'tooltip', localeCodes, '');
      ensureLocalizedObject(action, 'imageAlt', localeCodes, '');
      ensureLocalizedObject(action, 'ariaLabel', localeCodes, '');
    });
  }

  if (Array.isArray(caseConfig.customButtons)) {
    caseConfig.customButtons.forEach((button) => {
      if (!button || typeof button !== 'object') return;
      ensureLocalizedObject(button, 'label', localeCodes, '');
      ensureLocalizedObject(button, 'tooltip', localeCodes, '');
      ensureLocalizedObject(button, 'imageAlt', localeCodes, '');
      ensureLocalizedObject(button, 'ariaLabel', localeCodes, '');
    });
  }

  const caseSocial = caseConfig.social && typeof caseConfig.social === 'object' ? caseConfig.social : null;
  if (caseSocial) {
    Object.entries(caseSocial).forEach(([platformKey, platformConfig]) => {
      if (platformKey === 'links') return;
      if (!platformConfig || typeof platformConfig !== 'object') return;
      ensureLocalizedObject(platformConfig, 'tooltip', localeCodes, '');
    });
  }
}

// Normalizes about config schema, localized fields, and social/action tooltip localization.
function syncAboutConfig(aboutConfig, localeCodes) {
  ensureLocalizedObject(aboutConfig, 'title', localeCodes, 'About Me', { preserveKeys: ['show'] });
  ensureLocalizedObject(aboutConfig, 'subtitle', localeCodes, '', { preserveKeys: ['show'] });
  ensureLocalizedObject(aboutConfig, 'slugByLocale', localeCodes, '');

  if (typeof aboutConfig.title.show !== 'boolean') {
    aboutConfig.title.show = parseBooleanLike(aboutConfig.showH1, true);
  }

  if (typeof aboutConfig.subtitle.show !== 'boolean') {
    aboutConfig.subtitle.show = parseBooleanLike(aboutConfig.showH2, true);
  }

  delete aboutConfig.showH1;
  delete aboutConfig.showH2;

  localeCodes.forEach((localeCode) => {
    const localizedTitle = String(aboutConfig.title?.[localeCode] || '').trim();
    const localizedSlug = String(aboutConfig.slugByLocale?.[localeCode] || '').trim();
    if (localizedSlug) {
      aboutConfig.slugByLocale[localeCode] = toSlug(localizedSlug, 'about');
      return;
    }

    aboutConfig.slugByLocale[localeCode] = toSlug(localizedTitle, 'about');
  });

  ensureVisibilityConfig(aboutConfig);

  if (aboutConfig.actions && typeof aboutConfig.actions === 'object') {
    ['primary', 'secondary', 'tertiary', 'secondary1', 'secondary2'].forEach((actionKey) => {
      const action = aboutConfig.actions[actionKey];
      if (!action || typeof action !== 'object') return;
      ensureLocalizedObject(action, 'label', localeCodes, '');
      ensureLocalizedObject(action, 'tooltip', localeCodes, '');
      ensureLocalizedObject(action, 'imageAlt', localeCodes, '');
      ensureLocalizedObject(action, 'ariaLabel', localeCodes, '');
    });
  }

  if (Array.isArray(aboutConfig.customButtons)) {
    aboutConfig.customButtons.forEach((button) => {
      if (!button || typeof button !== 'object') return;
      ensureLocalizedObject(button, 'label', localeCodes, '');
      ensureLocalizedObject(button, 'tooltip', localeCodes, '');
      ensureLocalizedObject(button, 'imageAlt', localeCodes, '');
      ensureLocalizedObject(button, 'ariaLabel', localeCodes, '');
    });
  }

  const aboutSocial = aboutConfig.social && typeof aboutConfig.social === 'object' ? aboutConfig.social : null;
  if (aboutSocial) {
    Object.entries(aboutSocial).forEach(([platformKey, platformConfig]) => {
      if (platformKey === 'links') return;
      if (!platformConfig || typeof platformConfig !== 'object') return;
      ensureLocalizedObject(platformConfig, 'tooltip', localeCodes, '');
    });
  }
}

// Synchronizes one case markdown file config block and localized body sections.
function syncCaseFile(filePath, localeCodes, options = {}) {
  const source = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCommentConfigBlock(source, 'config');
  if (!parsed) return false;

  syncCaseConfig(parsed.config, localeCodes);

  const localizedBody = buildLocalizedBody(
    localeCodes,
    splitLocalizedBody(parsed.body),
    (localeCode) => `## Context\nAdd localized context in ${localeCode}.\n\n## Outcome\nAdd localized outcome in ${localeCode}.`,
    options
  );

  const nextContent = serializeCommentConfigBlock('config', parsed.config, localizedBody, CASE_CONFIG_GROUPS);
  if (nextContent === source) return false;

  fs.writeFileSync(filePath, nextContent, 'utf8');
  return true;
}

// Synchronizes about markdown config block and localized body sections.
function syncAboutFile(filePath, localeCodes, options = {}) {
  if (!fs.existsSync(filePath)) return false;

  const source = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCommentConfigBlock(source, 'about-config');
  if (!parsed) return false;

  syncAboutConfig(parsed.config, localeCodes);

  const localizedBody = buildLocalizedBody(
    localeCodes,
    splitLocalizedBody(parsed.body),
    (localeCode) => `# About Me\n\nAdd localized About content in ${localeCode}.`,
    options
  );

  const nextContent = serializeCommentConfigBlock('about-config', parsed.config, localizedBody, ABOUT_CONFIG_GROUPS);
  if (nextContent === source) return false;

  fs.writeFileSync(filePath, nextContent, 'utf8');
  return true;
}

// MARK: PUBLIC SYNC API
// Runs one locale sync pass across labels, all case files, and about content.
export async function runLocaleSync(options = {}) {
  const layout = resolveProjectLayout(options.cwd || process.cwd());
  const localeConfig = loadSupportedLocales(layout.i18nConfigPath);
  const localeCodes = localeConfig.localeCodes;
  const cases = listMarkdownFiles(layout.casesDir);
  const syncOptions = {
    pruneLocales: options.pruneLocales === true
  };

  let updatedCount = 0;

  if (syncI18nLabelsFile(layout.labelsPath, localeCodes, localeConfig.defaultLocale, syncOptions)) {
    updatedCount += 1;
  }

  cases.forEach((filePath) => {
    if (syncCaseFile(filePath, localeCodes, syncOptions)) {
      updatedCount += 1;
    }
  });

  if (syncAboutFile(layout.aboutPath, localeCodes, syncOptions)) {
    updatedCount += 1;
  }

  return {
    mode: layout.mode,
    localeCodes,
    scannedCases: cases.length,
    updatedFiles: updatedCount,
    i18nConfigPath: layout.i18nConfigPath,
    labelsPath: layout.labelsPath
  };
}

// Watches locale config changes and re-runs locale sync with debounce.
export function watchLocaleSync(options = {}) {
  const layout = resolveProjectLayout(options.cwd || process.cwd());
  const logger = options.logger || console;
  let disposed = false;
  let timer = null;

  // Executes immediate sync and logs status updates through provided logger.
  const runNow = async () => {
    try {
      const result = await runLocaleSync({ cwd: layout.root });
      logger.log(`[sync-locales] Synced ${result.updatedFiles} file(s) for locales: ${result.localeCodes.join(', ')}`);
    } catch (error) {
      logger.error('[sync-locales] Failed to sync locales:', error);
    }
  };

  runNow();

  // Watch only locale configuration in dev mode to avoid rewriting labels on each manual labels edit.
  const watchTargets = [layout.i18nConfigPath].filter((filePath) => fs.existsSync(filePath));
  const watchers = watchTargets.map((filePath) => fs.watch(filePath, () => {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      runNow();
    }, 180);
  }));

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    watchers.forEach((watcher) => watcher.close());
  };
}

// MARK: SCRIPT ENTRYPOINT
// CLI entrypoint for one-shot sync and watch mode.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Set(process.argv.slice(2));
  const watchMode = args.has('--watch');

  if (watchMode) {
    const dispose = watchLocaleSync();
    process.on('SIGINT', () => {
      dispose();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      dispose();
      process.exit(0);
    });
  } else {
    runLocaleSync()
      .then((result) => {
        console.log(`[sync-locales] Synced ${result.updatedFiles} file(s) for locales: ${result.localeCodes.join(', ')}`);
      })
      .catch((error) => {
        console.error('[sync-locales] Failed:', error);
        process.exit(1);
      });
  }
}
