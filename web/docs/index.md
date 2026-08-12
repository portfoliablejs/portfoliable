# Portfoliable user manual

Welcome to Portfoliable. This guide is written for people who created a portfolio project with `npm create portfoliable` and are now working in their generated app with `npm run portfoliable`.

This manual is intentionally product-first: it focuses on what you need to do in your own project, not on maintainer workflows or package release internals.

<div class="button-row">
  <a href="./getting-started/install"><ds-button variant="primary">Install and create</ds-button></a>
  <a href="./getting-started/quickstart"><ds-button variant="secondary">Quickstart</ds-button></a>
</div>

## What Portfoliable does

Portfoliable is a portfolio app generator and runtime for case-study portfolios. It helps you:

- scaffold a portfolio app quickly from the terminal
- edit case studies as markdown with structured metadata
- customize the homepage, language behavior, and brand styling
- add locales and localized metadata without hand-editing everything
- validate content before building and publishing
- ship a static portfolio that works well for web, crawlers, and social previews

## The recommended learning path

If you are new to Portfoliable, follow this order:

1. Install Node and create your portfolio project
2. Run the app locally
3. Understand the generated structure and default case data
4. Edit your own case content and metadata
5. Customize design tokens and homepage behavior
6. Add languages and localized URLs
7. Generate or tune thumbnails
8. Validate and build for production

## Core concepts

### The generated project

Your generated project contains:

- the app shell and runtime UI
- case markdown files under a content folder
- home and about content
- localization files and labels
- build, preview, validation, and case management scripts

### The case-first workflow

Portfoliable is designed around case studies. Each case is a markdown file with frontmatter-based metadata. The app reads that metadata and renders it in the homepage, case reader, and social/share flows.

### The config-first customization model

Most branding and app behavior are controlled by config files rather than scattered CSS edits. That keeps the app easier to maintain while still allowing strong visual customization.

## Common tasks covered in this guide

- installing prerequisites and creating a project
- starting local development
- creating and editing cases
- adding languages and syncing metadata
- controlling visibility, prefixes, and social metadata
- customizing the home view and theme tokens
- generating thumbnail options for device mockups
- protecting cases behind unlock flows
- validating and shipping a production build

## Start here

- [Install and create a project](./getting-started/install)
- [Quickstart](./getting-started/quickstart)
- [Configuration](./guides/configuration)
- [Content authoring](./guides/content)
- [Languages and localization](./guides/setting-languages)
- [Localized sharing and visibility](./sharing-visibility/localized-sharing-and-visibility)

## Good default workflow

Most users do this on a normal project cycle:

```bash
npm create portfoliable my-portfolio
cd my-portfolio
npm install
npm run portfoliable
```

Then:

```bash
npm run portfoliable-create-case -- --name "My New Case"
npm run validate:content
npm run build
npm run preview
```

That is the baseline flow for a clean, working portfolio project.
