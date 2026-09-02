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
});