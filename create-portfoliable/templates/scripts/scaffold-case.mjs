#!/usr/bin/env node

// File: create-portfoliable/templates/scripts/scaffold-case.mjs
// Purpose: Generate starter markdown case files inside template-generated consumer projects.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';

// [EDIT DEFAULTS HERE]
// Centralized defaults used when scaffolding new cases for consumer projects.
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
  thumbColor: 'Black',
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

function readSupportedLocales(cwd = process.cwd()) {
  const templateLocaleFallback = Object.keys(DEFAULT_CASE_TEMPLATE.shortDescByLocale || {})
    .filter((localeCode) => localeCode !== 'default');
  const i18nConfigPath = path.resolve(cwd, 'configs', 'i18n', 'i18n.config.js');
  if (!fs.existsSync(i18nConfigPath)) {
    return templateLocaleFallback;
  }

  const source = fs.readFileSync(i18nConfigPath, 'utf8');
  const match = source.match(/export\s+const\s+LANGUAGE_CONFIG\s*=\s*Object\.freeze\(\s*(\{[\s\S]*?\})\s*\);/);
  if (!match?.[1]) {
    return templateLocaleFallback;
  }

  try {
    const parsed = JSON.parse(match[1]);
    const locales = Object.keys(parsed)
      .map((localeCode) => String(localeCode || '').trim().toLowerCase())
      .filter((localeCode, index, list) => localeCode.length > 0 && list.indexOf(localeCode) === index);
    return locales.length > 0 ? locales : templateLocaleFallback;
  } catch {
    return templateLocaleFallback;
  }
}

// === DEFAULTS ===
// Defines the default output path used when callers do not provide --out.
const DEFAULT_OUTPUT = 'src/content/cases/my-case/case.md';
// Defines fallback title text used when callers do not provide --name.
const DEFAULT_NAME = 'My Case';

// === STRING NORMALIZATION HELPERS ===
// Converts arbitrary text into a markdown-safe slug used for id and localized slug fields.
function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-case';
}

// Converts arbitrary text into a user-friendly title case string.
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

// === CLI ARGUMENT PARSING ===
// Reads CLI flags and produces normalized scaffold options.
function parseArgs(argv) {
  // Slices process arguments to skip node executable and script path.
  const args = argv.slice(2);
  // Initializes parser output with defaults so missing flags still produce valid output.
  const options = {
    outFile: DEFAULT_OUTPUT,
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

// === TEMPLATE CONSTRUCTION ===
// Produces localized starter markdown content for a new case study.
function buildTemplate({ name, slug }) {
  // Derives a normalized visible title from provided input.
  const title = toTitle(name);
  // Derives a safe slug fallback from either explicit slug or case name.
  const cleanSlug = toSlug(slug || name);
  const localeCodes = readSupportedLocales();

  const localizedValue = (defaultsByLocale = {}) => {
    return Object.fromEntries(localeCodes.map((localeCode) => {
      const value = defaultsByLocale[localeCode] ?? defaultsByLocale.default ?? '';
      return [localeCode, value];
    }));
  };

  const caseConfig = {
    id: cleanSlug,
    caseOrder: DEFAULT_CASE_TEMPLATE.caseOrder,
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
      ...DEFAULT_CASE_TEMPLATE.social,
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

function resolveCaseSlugFromOutput(outFile, name) {
  const basename = path.basename(outFile || '');
  if (basename.toLowerCase() === 'case.md') {
    return toSlug(path.basename(path.dirname(outFile || '')) || name);
  }

  return toSlug(path.basename(outFile || '', '.md') || name);
}

// === SCAFFOLD EXECUTION ===
// Creates a new case markdown file, respecting overwrite safety rules.
export function runCaseScaffold(options = {}) {
  // Resolves working directory so script can be invoked from any location.
  const cwd = options.cwd || process.cwd();
  // Reads desired output file path from options or uses default path.
  const outFile = options.outFile || DEFAULT_OUTPUT;
  // Reads desired case display name from options or uses default title.
  const name = options.name || DEFAULT_NAME;
  const caseSlug = resolveCaseSlugFromOutput(outFile, name);
  // Converts force option to explicit boolean for overwrite checks.
  const force = Boolean(options.force);
  // Resolves absolute output path to avoid relative path ambiguity.
  const outputPath = path.resolve(cwd, outFile);

  if (fs.existsSync(outputPath) && !force) {
    console.error(`[scaffold-case] Refusing to overwrite existing file: ${outputPath}`);
    console.error('[scaffold-case] Use --force to overwrite.');
    return 1;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildTemplate({ name, slug: caseSlug }), 'utf8');
  console.log(`[scaffold-case] Created starter case file: ${outputPath}`);
  return 0;
}

// === SCRIPT ENTRYPOINT ===
// Executes argument parsing and scaffold generation when script is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parses CLI options from process arguments.
  const options = parseArgs(process.argv);
  // Executes scaffold flow and captures exit code.
  const exitCode = runCaseScaffold(options);
  process.exit(exitCode);
}
