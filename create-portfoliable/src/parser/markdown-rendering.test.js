import { describe, expect, it } from 'vitest';

import { renderLocalizedMarkdownHtml } from './markdown.js';

describe('case markdown rendering', () => {
  it('preserves authored HTML image sizing attributes', () => {
    const html = renderLocalizedMarkdownHtml(
      '<img src="src/content/cases/example/image.avif" alt="Example" width="300">',
      ['en']
    ).htmlByLocale.en;

    expect(html).toContain('<img src="src/content/cases/example/image.avif" alt="Example" width="300">');
  });

  it('marks markdown images as non-draggable', () => {
    const html = renderLocalizedMarkdownHtml(
      '![Example](src/content/cases/example/image.avif)',
      ['en']
    ).htmlByLocale.en;

    expect(html).toContain('class="media-paragraph p1"');
    expect(html).toContain('draggable="false"');
  });

  it('renders Mermaid fences as diagram elements', () => {
    const html = renderLocalizedMarkdownHtml('```mermaid\ngraph TD\n  A --> B\n```', ['en'])
      .htmlByLocale.en;

    expect(html).toContain('<mermaid-diagram>');
    expect(html).toContain('graph TD');
    expect(html).not.toContain('<pre><code>');
  });

  it('keeps ordinary fenced code blocks as code', () => {
    const html = renderLocalizedMarkdownHtml('```javascript\nconst answer = 42;\n```', ['en'])
      .htmlByLocale.en;

    expect(html).toContain('<pre><code>');
    expect(html).toContain('const answer = 42;');
  });

  it.each(['md', 'markdown'])('marks %s fences as Markdown code', (language) => {
    const html = renderLocalizedMarkdownHtml(`\`\`\`${language}\n## Embedded Markdown\n\`\`\``, ['en'])
      .htmlByLocale.en;

    expect(html).toContain('<pre><code class="language-markdown">');
    expect(html).toContain('## Embedded Markdown');
  });

  it('wraps markdown tables in an accessible horizontal scroll region', () => {
    const html = renderLocalizedMarkdownHtml(
      '| Layer | Why it matters |\n| --- | --- |\n| Sub-atoms | A deliberately long explanation that should remain readable |',
      ['en']
    ).htmlByLocale.en;

    expect(html).toContain('<div class="article-table-scroll" tabindex="0" role="region" aria-label="Scrollable table">');
    expect(html).toContain('<table');
    expect(html).toContain('</div>');
  });
});