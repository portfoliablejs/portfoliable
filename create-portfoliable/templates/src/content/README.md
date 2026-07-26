# Case markdown starter

Add or update portfolio case stories here.

- One markdown file becomes one gallery item
- Files live in `src/content/cases/`
- Preview/build reloads automatically when these files change
- Device frame fallbacks live in `src/data.js` and use valence asset imports

Each file uses frontmatter plus localized markdown sections. Example:

```md
---
id: my-case
slug: my-case
title.en: My Case
title.pt: Meu Case
shortDesc.en: Short summary in English
shortDesc.pt: Resumo curto em portugues
readTime.en: 3 min
readTime.pt: 3 min
year.en: 2026
year.pt: 2026
thumbSrc.en: https://example.com/screen.png
thumbSrc.pt: https://example.com/screen.png
thumbCategory: mobile
thumbBrand: apple
thumbModel: Apple iPhone 12
thumbColor: Black
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