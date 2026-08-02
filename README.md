# Portfoliable

Portfoliable is a template-first portfolio engine powered by valence web components.

Important boundary:
- Root-level npm commands in this folder are compatibility wrappers that forward to create-portfoliable.
- This repository ships template/sample content only.
- Real production content should live in your consumer application repository (for example, portfolio).

## Commands

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run thumbnail:options`
- `npm run validate:content`
- `npm run create:case`
- `npm run scaffold:case`
- `npm run verify:integration`
- `npm run smoke:homeview`
- `npm run smoke:packed`

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
- The generated app installs `create-portfoliable` from npm.
- If npm returns `404 Not Found` for `create-portfoliable` (or `@portfoliablejs/valence`), publish those runtime packages first. The initializer itself is published, but consumer installs require the runtime packages to be publicly available too.

The generated app includes:
- `npm run portfoliable`
- `npm run portfoliable-build`
- `npm run portfoliable-preview`
- `npm run portfoliable-create-case`
- `npm run portfoliable-scaffold-case`

The generated scripts call the Portfoliable CLI directly, so you can also run:

```bash
npx create-portfoliable dev
npx create-portfoliable build
npx create-portfoliable preview
npx create-portfoliable create-case --name "My New Case"
```

Optional flags:

```bash
npm create portfoliable@latest my-portfolio -- --no-install
npm create portfoliable@latest my-portfolio -- --force
```

## Create starter content

Generate a starter cases file in your current folder:

```bash
npx create-portfoliable create-case --name "My New Case"
```

Use `--force` to overwrite an existing file.

Legacy aliases remain available:

```bash
npx create-portfoliable scaffold-case --name "My New Case"
npm run scaffold:case -- --name "My New Case"
```

## Content model

Case markdown files in this repo are examples under `create-portfoliable/src/content/cases/` and are the runtime content source used by the centralized package.

### Thumbnail device fields in markdown

You can control the device frame directly from case frontmatter:

- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`

Example:

```md
thumbCategory: desktop
thumbBrand: apple
thumbModel: Apple Macbook Pro 13
thumbColor: Space Grey
```

These four fields are mandatory in case frontmatter.

### Available device types, brands, models, and colors

Use the CLI to print the full catalog from your installed Valence version:

```bash
npm run thumbnail:options
npm run thumbnail:options -- --full
npm run thumbnail:options -- --json
```

Quick list from the current catalog:

- Categories: `mobile`, `tablet`, `desktop`, `wearable`, `television`
- Category/brand pairs:
	- `mobile`: `apple`, `google`, `htcone`, `huawei`, `microsoft`, `motorola`, `samsung`, `xiaomi`
	- `tablet`: `apple`, `dell`, `google`, `microsoft`
	- `desktop`: `apple`, `dell`
	- `wearable`: `apple`, `motorola`, `sony`
	- `television`: `samsung`, `sony`

Color options depend on the selected model. Run `thumbnail:options` to get the exact color names available for each model.

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
npm run smoke:packed
npm run verify:integration
```

For local parity against in-progress valence changes, this repo may point to a local dependency during development.
Before publishing, ensure dependency references match your intended release source.
