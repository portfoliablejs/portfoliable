---
id: template-reader-only
slug: template-reader-only
title.en: Template Reader Only
title.pt: Template Apenas Leitor
shortDesc.en: Reader-only folder example with TOC and navigator enabled by default.
shortDesc.pt: Exemplo de pasta apenas leitor com TOC e navegador ativados por padrao.
readTime.en: 9 min
readTime.pt: 9 min
year.en: 2026 - Reader Mode
year.pt: 2026 - Modo Leitor
thumbSrc.en: https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=1200&auto=format&fit=crop
thumbSrc.pt: https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=1200&auto=format&fit=crop
thumbCategory: mobile
thumbBrand: google
thumbModel: Google Pixel 4 XL Just Black
thumbColor: Default
showSummary: false
showReader: true
showToc: true
showNavigator: true
---
<!-- lang:en -->
<!-- summary:start -->
## Hidden Summary
This summary block exists but reader-only placement keeps summary hidden.
<!-- summary:end -->

## Context
Reader-only cases prioritize long-form walkthrough sections.

## Architecture
- Parser placement in content/cases/reader enables showReader.
- TOC is enabled when headings exist in reader body.
- Navigator is enabled by default in reader mode.

## Implementation
1. Write heading-based sections.
2. Keep evidence and decisions in paragraphs and lists.
3. Use overrides only when needed.

## Outcome
Reader-first experiences remain focused while preserving consistent metadata.

<!-- lang:pt -->
<!-- summary:start -->
## Resumo Oculto
Este bloco de resumo existe, mas o modo reader-only mantem o resumo oculto.
<!-- summary:end -->

## Contexto
Cases apenas leitor priorizam secoes de walkthrough em formato longo.

## Arquitetura
- A localizacao content/cases/reader habilita showReader.
- TOC e ativado quando existem titulos no corpo leitor.
- Navegador e ativado por padrao no modo leitor.

## Implementacao
1. Escreva secoes baseadas em titulos.
2. Mantenha evidencias e decisoes em paragrafos e listas.
3. Use overrides apenas quando necessario.

## Resultado
Experiencias focadas em leitura permanecem objetivas mantendo metadados consistentes.
