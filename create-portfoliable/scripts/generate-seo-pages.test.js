import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSeoPages } from './generate-seo-pages.mjs';

describe('static SEO page generation', () => {
  it('creates localized pages with crawler-readable metadata', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfoliable-seo-'));
    const dist = path.join(root, 'dist');
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(
      path.join(dist, 'index.html'),
      '<!doctype html><html><head><link rel="icon" href="/favicon.png"><title>Portfoliable Starter</title></head><body></body></html>'
    );

    await generateSeoPages({ cwd: root, distDir: dist });

    const home = fs.readFileSync(path.join(dist, 'en', 'index.html'), 'utf8');
    expect(home).toContain('<meta property="og:title" content="Portfoliable"');
    expect(home).toContain('<h1>Portfoliable</h1>');
    expect(home).toContain('application/ld+json');
    expect(home).toContain('<link rel="icon" type="image/png" href="/favicon.png"');
    expect(home).not.toContain('Portfoliable Starter');

    const casePage = fs.readFileSync(
      path.join(dist, 'en', 'case', 'template-case', 'index.html'),
      'utf8'
    );
    expect(casePage).toContain('content="Making Portfoliable"');
    expect(casePage).toContain('property="og:image"');

    const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
    expect(robots).toContain('Content-Signal: search=yes, ai-train=no');
    expect(robots).toContain('Sitemap: /sitemap.xml');

    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>/en</loc>');
    expect(sitemap).toContain('<loc>/en/case/template-case</loc>');

    expect(fs.existsSync(path.join(dist, '404.html'))).toBe(true);
    const llms = fs.readFileSync(path.join(dist, 'llms.txt'), 'utf8');
    expect(llms).toContain('# Portfoliable');
    expect(llms).toContain('- [/en](/en)');
  });

  it('excludes protected and non-crawlable cases from the sitemap', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfoliable-seo-'));
    const dist = path.join(root, 'dist');
    const casesRoot = path.join(root, 'src', 'content', 'cases');
    fs.mkdirSync(path.join(casesRoot, 'private-case'), { recursive: true });
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html><head></head><body></body></html>');
      fs.writeFileSync(path.join(casesRoot, 'private-case', 'case.md'), `<!-- config
{
  "id": "private-case",
  "title": {"en": "Private", "pt": "Privado"},
  "shortDesc": {"en": "Private", "pt": "Privado"},
  "slugByLocale": {"en": "private-case", "pt": "private-case"},
  "isProtected": true
}
-->`);
      fs.mkdirSync(path.join(casesRoot, 'hidden-case'), { recursive: true });
      fs.writeFileSync(path.join(casesRoot, 'hidden-case', 'case.md'), `<!-- config
{
    "id": "hidden-case",
    "title": {"en": "Hidden", "pt": "Oculto"},
    "shortDesc": {"en": "Hidden", "pt": "Oculto"},
    "slugByLocale": {"en": "hidden-case", "pt": "hidden-case"},
    "visibility": {"web": false, "crawlers": true}
}
-->`);

    await generateSeoPages({ cwd: root, distDir: dist });

    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain('private-case');
    expect(sitemap).not.toContain('hidden-case');

    const privatePage = fs.readFileSync(
      path.join(dist, 'en', 'case', 'private-case', 'index.html'),
      'utf8'
    );
    expect(privatePage).toContain('name="robots" content="noindex,nofollow"');

    const hiddenPage = fs.readFileSync(
      path.join(dist, 'en', 'case', 'hidden-case', 'index.html'),
      'utf8'
    );
    expect(hiddenPage).toContain('name="robots" content="noindex,nofollow"');
  });
});
