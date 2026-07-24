# Portfoliable

Portfoliable is a template-first portfolio engine powered by valence web components.

Important boundary:
- This repository ships template/sample content only.
- Real production content should live in your consumer application repository (for example, portfolio).

## Commands

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run validate:content`
- `npm run scaffold:consumer`
- `npm run verify:integration`
- `npm run smoke:homeview`

## Scaffold a consumer data starter

Generate a starter cases file in your current folder:

```bash
npx @portfoliablejs/portfoliable scaffold
```

Or with npm script in this repo:

```bash
npm run scaffold:consumer -- --out ./portfolio/src/portfolio-cases.template.js
```

Use `--force` to overwrite an existing file.

## Content model

Case markdown files in this repo are examples under `src/content/cases/`.

Validation runs before `dev`, `build`, and `preview`.
If validation fails, fix fields in frontmatter or language sections first.

## Integration verification

Run full local integration checks for template plus consumer:

```bash
npm run verify:integration
```

This command validates markdown content, builds portfoliable, then builds the sibling portfolio consumer when available.
Use `--skip-consumer` to check only portfoliable:

```bash
npm run verify:integration -- --skip-consumer
```

## HomeView smoke check

Run a lightweight smoke gate for HomeView and gallery wiring:

```bash
npm run smoke:homeview
```

This command rebuilds portfoliable and verifies:
- `ds-home-view` is present in the main bundle
- template gallery case titles are present
- thumbnail frame fallback asset is generated

## Release readiness

Recommended release checks before tagging:

```bash
npm run validate:content
npm run smoke:homeview
npm run verify:integration
```

For local parity against in-progress valence changes, this repo may point to a local dependency during development.
Before publishing, ensure dependency references match your intended release source.
