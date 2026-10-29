// File: create-portfoliable/scripts/generate-seo-pages.mjs
// Purpose: Generate crawler-readable metadata pages for localized portfolio routes.
// Author: Lio Schimanko

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import labelsByLocale from '../templates/configs/i18n/i18n.labels.js';
import { parseCaseMarkdownWithDiagnostics } from '../templates/src/parser/markdown.js';

const DEFAULT_LOCALE = 'en';
const SEO_OWNER_ATTRIBUTE = 'data-portfoliable-seo';
const DEFAULT_SITE_URL = '';
const LANGUAGE_CONFIG = Object.fromEntries(
  Object.keys(labelsByLocale || {}).map((localeCode) => [localeCode, { htmlLang: localeCode }])
);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function normalizeText(value, fallback = '') {
  return String(value ?? '').trim() || fallback;
}

function localizedValue(value, localeCode, fallback = '') {
  if (typeof value === 'string') return normalizeText(value, fallback);
  if (!value || typeof value !== 'object') return fallback;
  return normalizeText(value[localeCode], normalizeText(value[DEFAULT_LOCALE], fallback));
}

function absoluteUrl(value, siteUrl = DEFAULT_SITE_URL) {
  const raw = normalizeText(value);
  if (!raw) return '';
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;

  const origin = normalizeText(siteUrl).replace(/\/+$/, '');
  if (!origin) return raw.startsWith('/') ? raw : `/${raw}`;
  return `${origin}/${raw.replace(/^\/+/, '')}`;
}

function readAboutConfig(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/<!--\s*about-config\s*([\s\S]*?)-->/i);
  if (!match?.[1]) return {};

  try {
    const evaluateObject = new Function(`return (${match[1].trim()});`);
    const parsed = evaluateObject();
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    throw new Error(`[portfoliable] Could not parse About SEO configuration: ${error.message}`);
  }
}

function readCaseFiles(contentRoot) {
  if (!fs.existsSync(contentRoot)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath);
    }
  };
  visit(contentRoot);
  return files;
}

function parseCase(filePath, locales) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const result = parseCaseMarkdownWithDiagnostics(raw, {
    filePath,
    locales,
    defaultLocale: DEFAULT_LOCALE
  });
  if (!result.caseData) {
    throw new Error(`[portfoliable] Could not generate SEO metadata for ${filePath}: ${result.errors.join(' ')}`);
  }
  return result.caseData;
}

function buildMetadata({ localeCode, title, description, canonical, image, favicon, type = 'website', robots = 'index,follow' }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta property="og:locale" content="${escapeHtml(LANGUAGE_CONFIG[localeCode]?.htmlLang || localeCode)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta name="twitter:card" content="summary_large_image" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" ${SEO_OWNER_ATTRIBUTE}="true" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" ${SEO_OWNER_ATTRIBUTE}="true" />`
  ];

  if (image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(image)}" ${SEO_OWNER_ATTRIBUTE}="true" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}" ${SEO_OWNER_ATTRIBUTE}="true" />`);
  }

  if (favicon) {
    tags.push(`<link rel="icon" type="image/png" href="${escapeHtml(favicon)}" ${SEO_OWNER_ATTRIBUTE}="true" />`);
    tags.push(`<link rel="shortcut icon" href="${escapeHtml(favicon)}" ${SEO_OWNER_ATTRIBUTE}="true" />`);
    tags.push(`<link rel="apple-touch-icon" href="${escapeHtml(favicon)}" ${SEO_OWNER_ATTRIBUTE}="true" />`);
  }

  return tags.join('\n    ');
}

function renderHtml(template, metadata) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link[^>]+rel="(?:icon|shortcut icon|apple-touch-icon)"[^>]*>\s*/gi, '');
  const headTags = renderMetadataTags(metadata);
  return html.replace('</head>', `    ${headTags}\n  </head>`);
}

function renderMetadataTags(metadata) {
  return buildMetadata(metadata);
}

function resolvePageMetadata({ localeCode, labels, config, title, description, canonical, siteUrl, type }) {
  const image = absoluteUrl(localizedValue(config?.socialImage, localeCode, labels?.meta_home_image), siteUrl);
  const favicon = absoluteUrl(
    localizedValue(config?.favicon, localeCode, labels?.meta_home_favicon),
    siteUrl
  );
  return {
    localeCode,
    title,
    description,
    canonical,
    image,
    favicon,
    type
  };
}

function writeRoutePage(distRoot, routePath, html) {
  const normalizedRoute = routePath.replace(/^\/+|\/+$/g, '');
  const targetDirectory = normalizedRoute ? path.join(distRoot, normalizedRoute) : distRoot;
  fs.mkdirSync(targetDirectory, { recursive: true });
  fs.writeFileSync(path.join(targetDirectory, 'index.html'), html, 'utf8');
}

function buildRoute(localeCode, view, slug = '') {
  if (view === 'home') return `/${localeCode}`;
  if (view === 'about') return `/${localeCode}/about`;
  return `/${localeCode}/case/${slug}`;
}

function resolveSiteUrl(labels) {
  return normalizeText(
    process.env.PORTFOLIABLE_SITE_URL
      || process.env.SITE_URL
      || process.env.VITE_SITE_URL
      || labels?.[DEFAULT_LOCALE]?.meta_site_url
      || ''
  );
}

export async function generateSeoPages({ cwd = process.cwd(), distDir = path.resolve(cwd, 'dist') } = {}) {
  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`[portfoliable] Cannot generate SEO pages: missing ${templatePath}`);
  }

  const labelsPath = path.resolve(cwd, 'configs/i18n/i18n.labels.js');
  const activeLabels = fs.existsSync(labelsPath)
    ? (await import(`${pathToFileURL(labelsPath).href}?seo=${Date.now()}`)).default
    : labelsByLocale;
  const locales = Object.keys(activeLabels || {});
  const siteUrl = resolveSiteUrl(activeLabels);
  const template = fs.readFileSync(templatePath, 'utf8');
  const aboutConfig = readAboutConfig(path.join(cwd, 'src/content/about/ABOUTME.md'));
  const contentRoot = fs.existsSync(path.join(cwd, 'src/content/cases'))
    ? path.join(cwd, 'src/content/cases')
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates/src/content/cases');
  const cases = readCaseFiles(contentRoot).map((filePath) => parseCase(filePath, locales));

  for (const localeCode of locales) {
    const labels = activeLabels?.[localeCode] || activeLabels?.[DEFAULT_LOCALE] || {};
    const homePath = buildRoute(localeCode, 'home');
    writeRoutePage(distDir, homePath, renderHtml(template, resolvePageMetadata({
      localeCode,
      labels,
      config: {},
      title: localizedValue(labels.meta_home_title, localeCode, 'Portfoliable') || 'Portfoliable',
      description: localizedValue(labels.meta_home_description, localeCode, 'Your cases, your stories.'),
      canonical: absoluteUrl(homePath, siteUrl),
      siteUrl,
      type: 'website'
    })));

    const aboutSlug = localizedValue(aboutConfig.slugByLocale, localeCode, 'about');
    const aboutPath = buildRoute(localeCode, 'about', aboutSlug);
    writeRoutePage(distDir, aboutPath, renderHtml(template, resolvePageMetadata({
      localeCode,
      labels,
      config: aboutConfig,
      title: localizedValue(aboutConfig.title, localeCode, localizedValue(labels.meta_home_title, localeCode, 'Portfoliable')) || 'Portfoliable',
      description: localizedValue(aboutConfig.subtitle, localeCode, localizedValue(labels.meta_home_description, localeCode, 'Your cases, your stories.')),
      canonical: absoluteUrl(aboutPath, siteUrl),
      siteUrl,
      type: 'profile'
    })));

    for (const caseData of cases) {
      const slug = localizedValue(caseData.slugByLocale, localeCode, caseData.id);
      const casePath = buildRoute(localeCode, 'case', slug);
      writeRoutePage(distDir, casePath, renderHtml(template, resolvePageMetadata({
        localeCode,
        labels,
        config: caseData,
        title: localizedValue(caseData.title, localeCode, localizedValue(labels.meta_home_title, localeCode, 'Portfoliable')) || 'Portfoliable',
        description: localizedValue(caseData.shortDesc, localeCode, localizedValue(labels.meta_home_description, localeCode, 'Your cases, your stories.')),
        canonical: absoluteUrl(casePath, siteUrl),
        siteUrl,
        type: 'article'
      })));
    }
  }

  fs.writeFileSync(templatePath, renderHtml(template, resolvePageMetadata({
    localeCode: DEFAULT_LOCALE,
    labels: activeLabels?.[DEFAULT_LOCALE] || {},
    config: {},
    title: localizedValue(activeLabels?.[DEFAULT_LOCALE]?.meta_home_title, DEFAULT_LOCALE, 'Portfoliable') || 'Portfoliable',
    description: localizedValue(activeLabels?.[DEFAULT_LOCALE]?.meta_home_description, DEFAULT_LOCALE, 'Your cases, your stories.'),
    canonical: absoluteUrl(buildRoute(DEFAULT_LOCALE, 'home'), siteUrl),
    siteUrl,
    type: 'website'
  })), 'utf8');
}
