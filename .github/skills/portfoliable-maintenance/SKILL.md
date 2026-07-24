---
name: portfoliable-maintenance
description: Maintain and evolve the portfoliable template system with strict separation of template data (portfoliable) and production data (consumer repos like portfolio).
---

# Portfoliable Maintenance Skill

## Scope

Use this skill when working on:
- template/content architecture in portfoliable
- consumer integration with portfolio
- CLI/dev/build/preview flows
- validation and release pipelines

## Hard Rules

1. Keep portfoliable template-only.
2. Never commit personal production case data into portfoliable.
3. Production case data belongs to consumer repos (example: portfolio).
4. Validate markdown content before dev/build/preview.

## Core Commands

- npm run validate:content
- npm run dev
- npm run build
- npm run preview
- npm run scaffold:consumer -- --out ./portfolio-cases.template.js

## Integration Notes

- In local development, consumer repo may use dependency:
  file:../portfoliable
- During template parity work, portfoliable may use local valence source:
  file:../valence
- Before publishing, switch consumer dependency to npm semver package.
- Ensure startup banner prints local and network URLs.

## Content Contract

Case markdown files under src/content/cases must include:
- id
- slug
- title.en / title.pt
- shortDesc.en / shortDesc.pt
- readTime.en / readTime.pt
- year.en / year.pt
- thumbSrc.en / thumbSrc.pt
- language body sections for EN/PT

## Troubleshooting

- If build fails on valence index.css import, run ensure compatibility script.
- If dev command fails from workspace root, run with npm --prefix <repo>.
- If consumer scripts cannot find CLI, verify local package install and bin availability.
- If gallery thumbnails render without bezels in consumer preview, provide explicit thumbDeviceSrc assets in template data until valence catalog resolution is generalized for packaged consumers.
