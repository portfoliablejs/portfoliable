# Portfoliable web docs

This folder contains the public documentation and marketing site for Portfoliable. It is designed for actual end users who are creating and maintaining a portfoliable project from a generated app.

## What this site is for

The web docs help people:

- create a portfolio project with `npm create @portfoliable`
- run the generated app with `npm run portfoliable`
- edit content and case metadata
- customize branding, language, and visibility
- validate the site before shipping

## Local development commands

```bash
npm run dev
npm run live
npm run build
npm run preview
npm run smoke
```

### Command meanings

- `npm run dev`: local VitePress dev server with live reload
- `npm run live`: live-reload instance intended for quick documentation work
- `npm run build`: creates the production static site
- `npm run preview`: serves the built output locally
- `npm run smoke`: checks common site behaviors after changes

From the repository root, you can also use the root-level web wrappers.

## Recommended local workflow

When editing docs, use the live preview flow for fast iteration:

```bash
npm run live
```

Use `npm run preview` only after a production build has been created and you want to inspect the output artifact.

## Documentation structure

The docs are organized around a real user journey:

- install and create
- quickstart and first run
- configuration and branding
- content authoring and case creation
- languages and localization
- sharing, visibility, and SEO concerns
- accessibility and thumbnail behavior
- deployment and release notes

## Important product conventions

### Dynamic social controls

Portfoliable supports dynamic social keys from content config. This means the app is not limited to a fixed set of social buttons.

### Locale direction

Portfoliable derives `lang` and `dir` behavior from the configured locale list. Add RTL languages through the locale CLI flow rather than hand-editing everything.

### Content-first workflow

The most important work in a Portfoliable project happens in the generated content and metadata, not in a custom CSS layer.

## Validation before shipping

Use these checks before publishing a docs update or a product change:

```bash
npm run build
npm run preview
```

The static build output is created in:

```text
.vitepress/dist
```

## The companion product docs

The main user manual is in the docs tree and is intentionally written for end users, not internal maintainers. Start with the homepage and work through onboarding, configuration, and content authoring.
