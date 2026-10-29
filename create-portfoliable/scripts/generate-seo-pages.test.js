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
    expect(home).toContain('<link rel="icon" type="image/png" href="/favicon.png"');
    expect(home).not.toContain('Portfoliable Starter');

    const casePage = fs.readFileSync(
      path.join(dist, 'en', 'case', 'template-case', 'index.html'),
      'utf8'
    );
    expect(casePage).toContain('content="Making Portfoliable"');
    expect(casePage).toContain('property="og:image"');
  });
});
