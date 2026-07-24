# Portfoliable Content Authoring

This folder is the central place to edit portfolio case stories.

Portfoliable stores template/sample content only.
Your real production content should live in your consumer app (for example, the portfolio repository).

## Where to edit

- Case markdown files live in `src/content/cases/`
- One file per case, for example: `holofante.md`

## Markdown file format

Each case file has 2 parts:

1. Frontmatter (between `---` blocks) for metadata.
2. Body markdown for the story content.

Example:

```md
---
id: my-case
slug: my-case-slug
title.en: My Case
title.pt: Meu Case
shortDesc.en: Small summary in English
shortDesc.pt: Resumo curto em portugues
readTime.en: 3 min
readTime.pt: 3 min
year.en: 2026
year.pt: 2026
thumbSrc.en: assets/thumbs/en/my-case.avif
thumbSrc.pt: assets/thumbs/pt/my-case.avif
---
<!-- lang:en -->
## Problem
Describe the problem.

## Solution
Describe the solution.

<!-- lang:pt -->
## Problema
Descreva o problema.

## Solucao
Descreva a solucao.
```

## How this is used

- Parser: `src/parser/markdown.js`
- Case loader: `src/cases/index.js`
- App rendering: `src/App.js`
- Validator script: `scripts/validate-content.mjs`

If a field is missing in markdown, portfoliable falls back to legacy data in `src/data.js`.

## Validate content

Run this command anytime:

```bash
npm run validate:content
```

Validation also runs automatically before:

- `npm run dev`
- `npm run build`
- `npm run preview`

Validation checks include:

- required fields (`id`, `slug`, and localized text fields)
- duplicate `id` and `slug` across markdown files
- locale pair completeness for optional media fields
- URL/path shape checks for optional link fields
