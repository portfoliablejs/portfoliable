#!/usr/bin/env node
// File: scripts/scaffold-case.mjs
// Purpose: Generate a starter markdown case for a Portfoliable consumer app.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { readLocaleConfigFromI18nConfig, resolveI18nConfigPath } from '../templates/scripts/i18n-config-utils.mjs';

// MARK: DEFAULTS
// Defines default output path used when no known case root can be resolved.
const DEFAULT_OUTPUT = 'src/content/cases/my-case/my-case.md';
// Defines default case name used when no name is provided.
const DEFAULT_NAME = 'My Case';
// Defines candidate case roots in priority order for local repo and consumer apps.
const DEFAULT_CASES_ROOTS = ['templates/src/content/cases', 'src/content/cases'];
// Defines order increment applied when choosing the next generated case order value.
const CASE_ORDER_STEP = 10;

// MARK: DEFAULT CASE TEMPLATE
// Centralized defaults used when scaffolding new cases.
const DEFAULT_CASE_TEMPLATE = {
  caseOrder: 100,
  socialImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&h=675&auto=format&fit=contain&bg=111111',
  titleShow: true,
  shortDescShow: true,
  shortDescByLocale: {
    en: 'Write a short summary for this case.',
    pt: 'Escreva um resumo curto para este case.',
    default: 'Write a short summary for this case.'
  },
  readTimeByLocale: {
    default: '3 min'
  },
  kickerByLocale: {
    en: '2026 - Starter Project',
    pt: '2026 - Projeto Iniciador',
    default: '2026 - Starter Project'
  },
  thumbSrc: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
  thumbCategory: 'mobile',
  thumbBrand: 'apple',
  thumbModel: 'Apple iPhone 17',
  thumbColor: 'iPhone 17 - Black - Portrait',
  showCover: true,
  showSummary: true,
  showReader: true,
  showToc: true,
  showNavigator: true,
  showPlayer: true,
  summaryByLocale: {
    en: 'Add an executive summary for this case.',
    pt: 'Adicione um resumo executivo para este case.',
    default: 'Add an executive summary for this case.'
  },
  summaryPropsTextByLocale: {
    en: 'Add concise impact details, launch scope, and operational confidence outcomes.',
    pt: 'Adicione detalhes de impacto, escopo de lancamento e resultados de confianca operacional.',
    default: 'Add concise impact details, launch scope, and operational confidence outcomes.'
  },
  summaryPropsLabelHeaderByLocale: {
    en: 'Case Snapshot',
    pt: 'Snapshot do Case',
    default: 'Case Snapshot'
  },
  summaryPropsAriaLabelByLocale: {
    en: 'Case summary with key metrics',
    pt: 'Resumo do case com metricas-chave',
    default: 'Case summary with key metrics'
  },
  audioLabelByLocale: {
    en: 'Case Audio Summary',
    pt: 'Resumo em Audio do Case',
    default: 'Case Audio Summary'
  },
  customButtonPrimaryLabelByLocale: {
    en: 'GitHub',
    pt: 'GitHub',
    default: 'GitHub'
  },
  customButtonPrimaryTooltipByLocale: {
    en: 'Open GitHub profile',
    pt: 'Abrir perfil do GitHub',
    default: 'Open GitHub profile'
  },
  customButtonPrimaryUrl: 'https://github.com/your-handle',
  customButtonPrimaryVariant: 'primary',
  customButtonPrimaryIcon: 'github',
  customButtonPrimaryIconVariant: 'outline',
  customButtonPrimaryEnabled: true,
  visibility: {
    web: true,
    crawlers: true,
    ai: true,
    locales: {}
  },
  isProtected: false,
  isUnlocked: false,
  social: {
    share: { enabled: true, icon: 'share', 'icon-variant': 'outline' },
    linkedin: { enabled: true, icon: 'linkedin', 'icon-variant': 'outline' },
    x: { enabled: true, icon: 'x', 'icon-variant': 'outline' },
    facebook: { enabled: true, icon: 'facebook', 'icon-variant': 'outline' }
  },
  actions: {
    primary: { enabled: false, variant: 'primary', icon: 'play', 'icon-variant': 'fill' },
    secondary: { enabled: false, variant: 'secondary', icon: 'link', 'icon-variant': 'outline' },
    tertiary: { enabled: false, variant: 'tertiary' }
  },
  customButtons: []
};

// Convert user input into a URL-safe slug.
function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-case';
}

// Normalize a freeform case name into title case.
function toTitle(value) {
  // Cleans separators and duplicate whitespace in user-provided title text.
  const cleaned = String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!cleaned) return DEFAULT_NAME;

  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// MARK: ARGUMENT PARSING
// Read CLI flags from the current process argv.
function parseArgs(argv) {
  // Extracts script args excluding node executable and script path.
  const args = argv.slice(2);
  // Initializes parser output with defaults.
  const options = {
    outFile: '',
    name: DEFAULT_NAME,
    force: false
  };

  for (let i = 0; i < args.length; i += 1) {
    // Reads current argument token under evaluation.
    const arg = args[i];

    if (arg === '--out' && args[i + 1]) {
      options.outFile = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

// Resolves available case roots for template and consumer layouts.
function resolveCasesRoots(cwd) {
  return DEFAULT_CASES_ROOTS
    .map((relativeRoot) => path.resolve(cwd, relativeRoot))
    .filter((absoluteRoot) => fs.existsSync(absoluteRoot) && fs.statSync(absoluteRoot).isDirectory());
}

  // Computes default output markdown path from first discovered cases root.
function resolvePrimaryCasesRoot(cwd) {
  const roots = resolveCasesRoots(cwd);
  if (roots.length > 0) {
    return roots[0];
  }

  return path.resolve(cwd, DEFAULT_CASES_ROOTS[0]);
}

function walkMarkdownFiles(rootDir, files = []) {
  if (!fs.existsSync(rootDir)) {
    return files;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  entries.forEach((entry) => {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(entryPath, files);
      return;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(entryPath);
    }
  });

  return files;
}

function collectExistingCaseMetadata(caseRoot) {
  const usedSlugs = new Set();
  const caseOrders = [];
  const markdownFiles = walkMarkdownFiles(caseRoot, []);

  markdownFiles.forEach((filePath) => {
    const relativePath = path.relative(caseRoot, filePath);
    const pathSegments = relativePath.split(path.sep).filter(Boolean);
    const folderSlug = pathSegments.length > 1 ? pathSegments[0] : '';
    if (folderSlug) {
      usedSlugs.add(toSlug(folderSlug));
    }

    const fileSlug = toSlug(path.basename(filePath, '.md'));
    if (fileSlug) {
      usedSlugs.add(fileSlug);
    }

    let source = '';
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch {
      return;
    }

    const idMatch = source.match(/"id"\s*:\s*"([^"]+)"/);
    if (idMatch?.[1]) {
      usedSlugs.add(toSlug(idMatch[1]));
    }

    const slugBlockMatch = source.match(/"slugByLocale"\s*:\s*\{([\s\S]*?)\}/);
    if (slugBlockMatch?.[1]) {
      const slugValues = slugBlockMatch[1].matchAll(/:\s*"([^"]+)"/g);
      for (const slugMatch of slugValues) {
        if (slugMatch?.[1]) {
          usedSlugs.add(toSlug(slugMatch[1]));
        }
      }
    }

    const orderMatch = source.match(/"caseOrder"\s*:\s*(\d+)/);
    if (orderMatch?.[1]) {
      const parsedOrder = Number.parseInt(orderMatch[1], 10);
      if (Number.isFinite(parsedOrder)) {
        caseOrders.push(parsedOrder);
      }
    }
  });

  return { usedSlugs, caseOrders };
}

function resolveUniqueSlug(baseSlug, usedSlugs) {
  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  while (usedSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
}

function resolveDefaultScaffoldValues(cwd, name) {
  const caseRoot = resolvePrimaryCasesRoot(cwd);
  const { usedSlugs, caseOrders } = collectExistingCaseMetadata(caseRoot);
  const baseSlug = toSlug(name);
  const slug = resolveUniqueSlug(baseSlug, usedSlugs);
  const maxOrder = caseOrders.length > 0 ? Math.max(...caseOrders) : DEFAULT_CASE_TEMPLATE.caseOrder - CASE_ORDER_STEP;
  const caseOrder = maxOrder + CASE_ORDER_STEP;
  const outFile = path.relative(cwd, path.join(caseRoot, slug, `${slug}.md`));
  return { outFile, slug, caseOrder };
}

// Derives case slug from output path patterns or fallback case name.
function resolveCaseSlugFromOutput(outFile, name) {
  const basename = path.basename(outFile || '');
  if (basename.toLowerCase() === 'case.md') {
    return toSlug(path.basename(path.dirname(outFile || '')) || name);
  }

  return toSlug(path.basename(outFile || '', '.md') || name);
}

// Serializes one config field while preserving indentation for multiline values.
function formatConfigField(key, value, indent = '  ') {
  const serialized = JSON.stringify(value, null, 2);
  if (!serialized.includes('\n')) {
    return `${indent}"${key}": ${serialized},`;
  }

  const lines = serialized.split('\n');
  const output = [`${indent}"${key}": ${lines[0]}`];
  lines.slice(1).forEach((line) => {
    output.push(`${indent}${line}`);
  });
  output[output.length - 1] = `${output[output.length - 1]},`;
  return output.join('\n');
}

// Builds grouped config comment block injected at the top of scaffolded case markdown.
function formatCaseConfigBlock(caseConfig) {
  const lines = [
    '<!-- config',
    '{',
    '  // Identity',
    formatConfigField('id', caseConfig.id),
    formatConfigField('caseOrder', caseConfig.caseOrder),
    formatConfigField('slugByLocale', caseConfig.slugByLocale),
    formatConfigField('socialImage', caseConfig.socialImage),
    '',
    '  // Localized Metadata',
    formatConfigField('title', caseConfig.title),
    formatConfigField('shortDesc', caseConfig.shortDesc),
    formatConfigField('readTime', caseConfig.readTime),
    formatConfigField('kicker', caseConfig.kicker),
    '',
    '  // Thumbnail and Cover',
    '  // Available thumbCategory values: desktop, mobile, tablet, wearable',
    formatConfigField('thumbSrc', caseConfig.thumbSrc),
    formatConfigField('thumbCategory', caseConfig.thumbCategory),
    formatConfigField('thumbBrand', caseConfig.thumbBrand),
    formatConfigField('thumbModel', caseConfig.thumbModel),
    formatConfigField('thumbColor', caseConfig.thumbColor),
    formatConfigField('showCover', caseConfig.showCover),
    '',
    '  // Summary Experience (edit here or in summary:start blocks below)',
    formatConfigField('showSummary', caseConfig.showSummary),
    formatConfigField('summary', caseConfig.summary),
    formatConfigField('summaryProps', caseConfig.summaryProps),
    '',
    '  // Reader Experience',
    formatConfigField('showReader', caseConfig.showReader),
    formatConfigField('showToc', caseConfig.showToc),
    formatConfigField('showNavigator', caseConfig.showNavigator),
    '',
    '  // Audio Experience',
    formatConfigField('audioLabel', caseConfig.audioLabel),
    formatConfigField('audioSrc', caseConfig.audioSrc),
    formatConfigField('showPlayer', caseConfig.showPlayer),
    '',
    '  // Visibility and Protection',
    formatConfigField('visibility', caseConfig.visibility),
    formatConfigField('isProtected', caseConfig.isProtected),
    formatConfigField('isUnlocked', caseConfig.isUnlocked),
    '',
    '  // Social',
    formatConfigField('social', caseConfig.social),
    '',
    '  // Actions',
    formatConfigField('actions', caseConfig.actions),
    '',
    '  // Custom Buttons',
    formatConfigField('customButtons', caseConfig.customButtons),
    '}',
    '-->'
  ];

  return lines.join('\n');
}

// Build the markdown scaffold body used for new cases.
function buildTemplate({ name, slug, caseOrder, localeCodes }) {
  // Derives normalized title for localized title fields.
  const title = toTitle(name);
  // Derives normalized slug for id and localized route slug fields.
  const cleanSlug = toSlug(slug || name);
  // Builds localized maps with locale-specific values and default fallback support.
  const localizedValue = (defaultsByLocale = {}) => {
    return Object.fromEntries(localeCodes.map((localeCode) => {
      const value = defaultsByLocale[localeCode] ?? defaultsByLocale.default ?? '';
      return [localeCode, value];
    }));
  };

  const caseConfig = {
    id: cleanSlug,
    caseOrder,
    slugByLocale: localizedValue({ default: cleanSlug }),
    socialImage: localizedValue({ default: DEFAULT_CASE_TEMPLATE.socialImage }),
    title: {
      show: DEFAULT_CASE_TEMPLATE.titleShow,
      ...localizedValue({ default: title })
    },
    shortDesc: {
      show: DEFAULT_CASE_TEMPLATE.shortDescShow,
      ...localizedValue(DEFAULT_CASE_TEMPLATE.shortDescByLocale)
    },
    readTime: localizedValue(DEFAULT_CASE_TEMPLATE.readTimeByLocale),
    kicker: localizedValue(DEFAULT_CASE_TEMPLATE.kickerByLocale),
    thumbSrc: localizedValue({ default: DEFAULT_CASE_TEMPLATE.thumbSrc }),
    thumbCategory: DEFAULT_CASE_TEMPLATE.thumbCategory,
    thumbBrand: DEFAULT_CASE_TEMPLATE.thumbBrand,
    thumbModel: DEFAULT_CASE_TEMPLATE.thumbModel,
    thumbColor: DEFAULT_CASE_TEMPLATE.thumbColor,
    showCover: DEFAULT_CASE_TEMPLATE.showCover,
    showSummary: DEFAULT_CASE_TEMPLATE.showSummary,
    summary: localizedValue(DEFAULT_CASE_TEMPLATE.summaryByLocale),
    summaryProps: {
      text: localizedValue(DEFAULT_CASE_TEMPLATE.summaryPropsTextByLocale),
      active: true,
      labelHeader: localizedValue(DEFAULT_CASE_TEMPLATE.summaryPropsLabelHeaderByLocale),
      showMetrics: true,
      ariaLabel: localizedValue(DEFAULT_CASE_TEMPLATE.summaryPropsAriaLabelByLocale),
      metrics: [
        {
          value: '',
          label: localizedValue({ default: '' }),
          variant: 'default',
          ariaLabel: localizedValue({ default: '' })
        }
      ]
    },
    showReader: DEFAULT_CASE_TEMPLATE.showReader,
    showToc: DEFAULT_CASE_TEMPLATE.showToc,
    showNavigator: DEFAULT_CASE_TEMPLATE.showNavigator,
    audioLabel: localizedValue(DEFAULT_CASE_TEMPLATE.audioLabelByLocale),
    audioSrc: localizedValue({ default: '' }),
    showPlayer: DEFAULT_CASE_TEMPLATE.showPlayer,
    visibility: { ...DEFAULT_CASE_TEMPLATE.visibility },
    isProtected: DEFAULT_CASE_TEMPLATE.isProtected,
    isUnlocked: DEFAULT_CASE_TEMPLATE.isUnlocked,
    social: {
      share: {
        ...DEFAULT_CASE_TEMPLATE.social.share,
        tooltip: localizedValue({ default: '' })
      },
      linkedin: {
        ...DEFAULT_CASE_TEMPLATE.social.linkedin,
        tooltip: localizedValue({ default: '' })
      },
      x: {
        ...DEFAULT_CASE_TEMPLATE.social.x,
        tooltip: localizedValue({ default: '' })
      },
      facebook: {
        ...DEFAULT_CASE_TEMPLATE.social.facebook,
        tooltip: localizedValue({ default: '' })
      },
      links: {
        linkedin: '',
        x: '',
        facebook: ''
      }
    },
    actions: {
      primary: {
        ...DEFAULT_CASE_TEMPLATE.actions.primary,
        label: localizedValue({ en: 'Watch Launch Video', pt: 'Assistir Video do Lancamento', default: 'Watch Launch Video' }),
        tooltip: localizedValue({ en: 'Open launch walkthrough video', pt: 'Abrir video de apresentacao do lancamento', default: 'Open launch walkthrough video' }),
        url: localizedValue({ default: '' }),
        videoSrc: localizedValue({ default: '' }),
        vttSrc: localizedValue({ default: '' }),
        imageAlt: localizedValue({ default: '' }),
        ariaLabel: localizedValue({ default: '' })
      },
      secondary: {
        ...DEFAULT_CASE_TEMPLATE.actions.secondary,
        label: localizedValue({ en: 'Repository', pt: 'Repositorio', default: 'Repository' }),
        tooltip: localizedValue({ en: 'Open implementation repository', pt: 'Abrir repositorio de implementacao', default: 'Open implementation repository' }),
        url: localizedValue({ default: '' }),
        imageAlt: localizedValue({ default: '' }),
        ariaLabel: localizedValue({ default: '' })
      },
      tertiary: {
        ...DEFAULT_CASE_TEMPLATE.actions.tertiary,
        label: localizedValue({ en: 'Live Demo', pt: 'Demo Ao Vivo', default: 'Live Demo' }),
        tooltip: localizedValue({ en: 'Open interactive demo', pt: 'Abrir demo interativa', default: 'Open interactive demo' }),
        url: localizedValue({ default: '' }),
        'has-image': false,
        'image-src': '',
        'image-alt': '',
        imageAlt: localizedValue({ default: '' }),
        ariaLabel: localizedValue({ default: '' })
      }
    },
    customButtons: [
      {
        label: localizedValue(DEFAULT_CASE_TEMPLATE.customButtonPrimaryLabelByLocale),
        tooltip: localizedValue(DEFAULT_CASE_TEMPLATE.customButtonPrimaryTooltipByLocale),
        url: DEFAULT_CASE_TEMPLATE.customButtonPrimaryUrl,
        variant: DEFAULT_CASE_TEMPLATE.customButtonPrimaryVariant,
        icon: DEFAULT_CASE_TEMPLATE.customButtonPrimaryIcon,
        'icon-variant': DEFAULT_CASE_TEMPLATE.customButtonPrimaryIconVariant,
        enabled: DEFAULT_CASE_TEMPLATE.customButtonPrimaryEnabled,
        imageAlt: localizedValue({ default: '' }),
        ariaLabel: localizedValue({ default: '' })
      }
    ]
  };

  const sectionBlock = localeCodes.map((localeCode) => {
    if (localeCode === 'pt') {
      return `<!-- lang:${localeCode} -->\n## Problema\nDescreva o problema em portugues.\n\n## Solucao\nDescreva a solucao em portugues.`;
    }

    return `<!-- lang:${localeCode} -->\n## Problem\nDescribe the problem in ${localeCode}.\n\n## Solution\nDescribe the solution in ${localeCode}.`;
  }).join('\n\n');

  return `${formatCaseConfigBlock(caseConfig)}\n\n${sectionBlock}\n`;
}

// Create the scaffold case file unless the destination already exists.
export function runCaseScaffold(options = {}) {
  // Resolves working directory used for output file path calculation.
  const cwd = options.cwd || process.cwd();
  // Resolves case display name using option or default fallback.
  const name = options.name || DEFAULT_NAME;
  const hasExplicitOutFile = typeof options.outFile === 'string' && options.outFile.trim().length > 0;

  const defaultScaffold = hasExplicitOutFile
    ? null
    : resolveDefaultScaffoldValues(cwd, name);

  // Resolves output filename using option or context-aware default fallback.
  const outFile = hasExplicitOutFile
    ? options.outFile
    : (defaultScaffold?.outFile || DEFAULT_OUTPUT);

  const caseSlug = hasExplicitOutFile
    ? resolveCaseSlugFromOutput(outFile, name)
    : defaultScaffold.slug;

  const caseOrder = defaultScaffold?.caseOrder ?? DEFAULT_CASE_TEMPLATE.caseOrder;
  // Coerces force flag to explicit boolean.
  const force = Boolean(options.force);
  // Resolves absolute output path for scaffold file.
  const outputPath = path.resolve(cwd, outFile);
  const i18nConfigPath = resolveI18nConfigPath(cwd);
  const localeConfig = readLocaleConfigFromI18nConfig(i18nConfigPath);
  const templateLocaleFallback = Object.keys(DEFAULT_CASE_TEMPLATE.shortDescByLocale || {})
    .filter((localeCode) => localeCode !== 'default');
  const localeCodes = Array.isArray(localeConfig.supportedLocales) && localeConfig.supportedLocales.length > 0
    ? localeConfig.supportedLocales
    : templateLocaleFallback;

  if (fs.existsSync(outputPath) && !force) {
    console.log(`[scaffold-case] Nothing to create. Case already exists: ${outputPath}`);
    return 0;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildTemplate({ name, slug: caseSlug, caseOrder, localeCodes }), 'utf8');
  console.log(`[scaffold-case] Created starter case file: ${outputPath}`);
  return 0;
}

// MARK: SCRIPT ENTRYPOINT
// Executes argument parsing and scaffold run when script is invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parses CLI options from current process arguments.
  const options = parseArgs(process.argv);
  // Runs scaffolder and captures process exit code.
  const exitCode = runCaseScaffold(options);
  process.exit(exitCode);
}
