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
- `npm run scaffold:case`
- `npm run verify:integration`
- `npm run smoke:homeview`

## Create a new portfolio app

Use the initializer package to scaffold a consumer app in an empty folder:

Important:
- Run `npm create portfoliable@latest ...`, not `npm run create portfoliable@latest ...`.

```bash
npm create portfoliable@latest my-portfolio
cd my-portfolio
npm run portfoliable
```

Version note:
- `create-portfoliable@0.1.0` is deprecated. Use latest (`>=0.1.1`).

Runtime prerequisite:
- The generated app installs `@portfoliablejs/portfoliable` from npm.
- If npm returns `404 Not Found` for `@portfoliablejs/portfoliable` (or `@portfoliablejs/valence`), publish those runtime packages first. The initializer itself is published, but consumer installs require the runtime packages to be publicly available too.

The generated app includes:
- `npm run portfoliable`
- `npm run portfoliable-build`
- `npm run build-portfoliable`
- `npm run portfoliable-preview`
- `npm run preview-portfoliable`
- `npm run portfoliable-scaffold-data`
- `npm run scaffold-data-portfoliable`
- `npm run portfoliable-scaffold-case`
- `npm run scaffold-case-portfoliable`

The generated scripts call the Portfoliable CLI directly, so you can also run:

```bash
npx @portfoliablejs/portfoliable dev
npx @portfoliablejs/portfoliable build
npx @portfoliablejs/portfoliable preview
npx @portfoliablejs/portfoliable scaffold-case --name "My New Case"
```

Optional flags:

```bash
npm create portfoliable@latest my-portfolio -- --no-install
npm create portfoliable@latest my-portfolio -- --force
```

## Scaffold a consumer data starter

Generate a starter cases file in your current folder:

```bash
npx @portfoliablejs/portfoliable scaffold
npx @portfoliablejs/portfoliable scaffold-case --name "My New Case"
```

Or with npm script in this repo:

```bash
npm run scaffold:consumer -- --out ./portfolio/src/portfolio-cases.template.js
```

Use `--force` to overwrite an existing file.

## Content model

Case markdown files in this repo are examples under `src/content/cases/` and are the only runtime content source.

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
