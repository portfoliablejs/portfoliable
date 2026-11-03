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
const CONTENT_SIGNAL = 'search=yes, ai-train=no';
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

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;');
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
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

function readAboutBodies(filePath, locales) {
  if (!fs.existsSync(filePath)) return {};
  const source = fs.readFileSync(filePath, 'utf8')
    .replace(/<!--\s*about-config[\s\S]*?-->/i, '');
  const bodies = {};
  for (const localeCode of locales) {
    const marker = new RegExp(`<!--\\s*lang:${localeCode}\\s*-->`, 'i');
    const start = source.search(marker);
    if (start < 0) continue;
    const contentStart = start + source.slice(start).match(marker)[0].length;
    const next = source.slice(contentStart).search(/<!--\s*lang:[^>]+-->/i);
    bodies[localeCode] = source.slice(contentStart, next < 0 ? undefined : contentStart + next).trim();
  }
  return bodies;
}

function renderSimpleMarkdown(value) {
  return String(value || '').split(/\n{2,}/).map((paragraph) => {
    const html = escapeHtml(paragraph.trim())
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
      .replace(/\n/g, '<br>');
    return html ? `<p>${html}</p>` : '';
  }).join('');
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

function buildMetadata({
  localeCode,
  title,
  description,
  canonical,
  image,
  favicon,
  type = 'website',
  robots = 'index,follow',
  structuredData = null
}) {
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

  if (structuredData) {
    tags.push(`<script type="application/ld+json">${escapeJson(structuredData)}</script>`);
  }

  return tags.join('\n    ');
}

function renderHtml(template, metadata, body = '') {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link[^>]+rel="(?:icon|shortcut icon|apple-touch-icon)"[^>]*>\s*/gi, '');
  const headTags = renderMetadataTags(metadata);
  const withHead = html.replace('</head>', `    ${headTags}\n  </head>`);
  if (withHead.includes('<div id="app"></div>')) {
    return withHead.replace('<div id="app"></div>', `<div id="app">${body}</div>`);
  }
  return withHead.replace('<body>', `<body>${body}`);
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
  const visibility = config?.visibility || {};
  const isCrawlable = config?.isProtected !== true
    && visibility.web !== false
    && visibility.crawlers !== false;
  return {
    localeCode,
    title,
    description,
    canonical,
    image,
    favicon,
    type,
    robots: isCrawlable ? 'index,follow' : 'noindex,nofollow',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': type === 'profile' ? 'Person' : type === 'article' ? 'Article' : 'WebSite',
      name: title,
      description,
      url: canonical,
      ...(image ? { image } : {}),
      ...(type === 'profile' ? { sameAs: collectHttpUrls(config) } : {})
    }
  };
}

function collectHttpUrls(value) {
  const urls = new Set();
  const visit = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      for (const match of item.match(/https?:\/\/[^\s"'<>]+/g) || []) urls.add(match.replace(/[),.;]+$/, ''));
      return;
    }
    if (Array.isArray(item)) return item.forEach(visit);
    if (typeof item === 'object') Object.values(item).forEach(visit);
  };
  visit(value);
  return [...urls];
}

function collectContactLinks(config) {
  const links = [];
  const visit = (item) => {
    if (typeof item === 'string' && /^(?:https?:|mailto:)/i.test(item.trim())) {
      links.push(item.trim());
    } else if (Array.isArray(item)) {
      item.forEach(visit);
    } else if (item && typeof item === 'object') {
      Object.values(item).forEach(visit);
    }
  };
  visit(config?.actions);
  return [...new Set(links)];
}

function renderStaticBody({ localeCode, title, description, bodyHtml = '', routePath, type, routes = [], links = [] }) {
  const routeLinks = routes
    .filter((route) => route.localeCode === localeCode)
    .map((route) => `<li><a href="${escapeHtml(route.path)}">${escapeHtml(route.title)}</a></li>`)
    .join('');
  return [
    `<main><h1>${escapeHtml(title)}</h1>`,
    description ? `<p>${escapeHtml(description)}</p>` : '',
    `<p><a href="${escapeHtml(routePath)}">${escapeHtml(title)}</a></p>`,
    bodyHtml,
    links.length ? `<nav aria-label="Contact and profiles"><ul>${links.map((link) => `<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul></nav>` : '',
    routeLinks ? `<nav aria-label="Portfolio pages"><ul>${routeLinks}</ul></nav>` : '',
    '</main>'
  ].join('');
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

function isCrawlableCase(caseData) {
  const visibility = caseData?.visibility || {};
  return caseData?.isProtected !== true
    && visibility.web !== false
    && visibility.crawlers !== false;
}

function buildPublicRoutes({ locales, aboutConfig, cases }) {
  const routes = [];
  locales.forEach((localeCode) => {
    routes.push(buildRoute(localeCode, 'home'));
    const aboutSlug = localizedValue(aboutConfig.slugByLocale, localeCode, 'about');
    routes.push(buildRoute(localeCode, 'about', aboutSlug));
    cases.filter(isCrawlableCase).forEach((caseData) => {
      const slug = localizedValue(caseData.slugByLocale, localeCode, caseData.id);
      routes.push(buildRoute(localeCode, 'case', slug));
    });
  });
  return [...new Set(routes)];
}

function writeRobotsFile(distDir, siteUrl) {
  const sitemapUrl = absoluteUrl('/sitemap.xml', siteUrl);
  const robots = [
    'User-agent: *',
    'Allow: /',
    `Content-Signal: ${CONTENT_SIGNAL}`,
    `Sitemap: ${sitemapUrl}`,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf8');
}

function writeSitemapFile(distDir, routes, siteUrl) {
  const urls = routes.map((route) => `  <url><loc>${escapeXml(absoluteUrl(route, siteUrl))}</loc></url>`).join('\n');
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
}

function writeLlmsFile(distDir, routes, siteUrl, labels) {
  const lines = [
    `# ${localizedValue(labels?.[DEFAULT_LOCALE]?.meta_home_title, DEFAULT_LOCALE, 'Portfolio')}`,
    '',
    `> ${localizedValue(labels?.[DEFAULT_LOCALE]?.meta_home_description, DEFAULT_LOCALE, 'Portfolio site')}`,
    '',
    '## Pages',
    ...routes.map((route) => `- [${route.path}](${absoluteUrl(route.path, siteUrl)})`),
    ''
  ];
  fs.writeFileSync(path.join(distDir, 'llms.txt'), lines.join('\n'), 'utf8');
}

function writeNotFoundPage(distDir) {
  const notFound = [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '    <meta name="robots" content="noindex, nofollow">',
    '    <title>Page not found</title>',
    '  </head>',
    '  <body>',
    '    <main><h1>Page not found</h1><p>The requested page does not exist.</p></main>',
    '  </body>',
    '</html>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(distDir, '404.html'), notFound, 'utf8');
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
  const aboutBodies = readAboutBodies(path.join(cwd, 'src/content/about/ABOUTME.md'), locales);
  const contentRoot = fs.existsSync(path.join(cwd, 'src/content/cases'))
    ? path.join(cwd, 'src/content/cases')
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates/src/content/cases');
  const cases = readCaseFiles(contentRoot).map((filePath) => parseCase(filePath, locales));
  const publicRoutes = buildPublicRoutes({ locales, aboutConfig, cases });
  const routeRecords = publicRoutes.map((pathValue) => ({
    path: pathValue,
    localeCode: pathValue.split('/')[1],
    title: pathValue
  }));

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
    }), renderStaticBody({
      localeCode,
      title: localizedValue(labels.meta_home_title, localeCode, 'Portfolio'),
      description: localizedValue(labels.meta_home_description, localeCode, ''),
      bodyHtml: `<p><a href="${escapeHtml(buildRoute(localeCode, 'about', localizedValue(aboutConfig.slugByLocale, localeCode, 'about')))}">About</a></p>`,
      routePath: homePath,
      type: 'website',
      routes: routeRecords
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
    }), renderStaticBody({
      localeCode,
      title: localizedValue(aboutConfig.title, localeCode, 'About'),
      description: localizedValue(aboutConfig.subtitle, localeCode, ''),
      bodyHtml: renderSimpleMarkdown(aboutBodies[localeCode]),
      links: collectContactLinks(aboutConfig).map((url) => ({
        label: /^mailto:/i.test(url) ? 'Email' : url.includes('github.com') ? 'GitHub' : 'LinkedIn',
        url
      })),
      routePath: aboutPath,
      type: 'profile',
      routes: routeRecords
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
      }), renderStaticBody({
        localeCode,
        title: localizedValue(caseData.title, localeCode, caseData.id),
        description: localizedValue(caseData.shortDesc, localeCode, ''),
        bodyHtml: localizedValue(caseData.desc, localeCode, ''),
        routePath: casePath,
        type: 'article',
        routes: routeRecords
      })));
    }
  }

  const rootTitle = localizedValue(activeLabels?.[DEFAULT_LOCALE]?.meta_home_title, DEFAULT_LOCALE, 'Portfoliable') || 'Portfoliable';
  const rootDescription = localizedValue(activeLabels?.[DEFAULT_LOCALE]?.meta_home_description, DEFAULT_LOCALE, 'Your cases, your stories.');
  fs.writeFileSync(templatePath, renderHtml(template, resolvePageMetadata({
    localeCode: DEFAULT_LOCALE,
    labels: activeLabels?.[DEFAULT_LOCALE] || {},
    config: {},
    title: rootTitle,
    description: rootDescription,
    canonical: absoluteUrl(buildRoute(DEFAULT_LOCALE, 'home'), siteUrl),
    siteUrl,
    type: 'website'
  }), renderStaticBody({
    localeCode: DEFAULT_LOCALE,
    title: rootTitle,
    description: rootDescription,
    routePath: buildRoute(DEFAULT_LOCALE, 'home'),
    type: 'website',
    routes: routeRecords
  })), 'utf8');
  writeRobotsFile(distDir, siteUrl);
  writeSitemapFile(distDir, publicRoutes, siteUrl);
  writeLlmsFile(distDir, routeRecords, siteUrl, activeLabels);
  writeNotFoundPage(distDir);
}
