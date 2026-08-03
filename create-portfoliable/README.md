# @portfoliable/create User Manual

This guide is the end-user instruction manual for projects created with:

```bash
npm create @portfoliable
```

Use this document after scaffolding to run, customize, validate, and ship your portfolio application.

## 1. What This Tool Creates

The initializer generates a Vite-based portfolio app with:

- app shell and UI wiring
- case markdown loading and parsing pipeline
- content validation commands
- build and preview scripts
- case scaffolding utilities

## 2. Prerequisites

Before creating a project:

1. install Node.js 18 or newer
2. verify npm is available
3. use a writable local directory
4. ensure internet access for package download

Check your environment:

```bash
node -v
npm -v
```

## 3. Create a New Portfolio Project

Scaffold a new app:

```bash
npm create @portfoliable my-portfolio
```

Move into the project:

```bash
cd my-portfolio
```

Start development mode:

```bash
npm run portfoliable
```

## 4. Initializer Flags

Pass flags after `--`:

```bash
npm create @portfoliable my-portfolio -- --no-install
npm create @portfoliable my-portfolio -- --force
```

Flag reference:

- `--no-install`: scaffold files without installing dependencies
- `--force`: allow overwrite when target exists

## 5. Generated Commands

Your generated project includes these scripts:

- `npm run portfoliable` - run local development server
- `npm run portfoliable-build` - create production build
- `npm run portfoliable-preview` - preview production output
- `npm run portfoliable-thumbnail-options` - inspect available thumbnail device options
- `npm run portfoliable-create-case` - create new starter case file
- `npm run portfoliable-scaffold-case` - legacy alias for case creation

## 6. Daily Development Workflow

Recommended sequence:

1. run dev server
2. edit case markdown content and assets
3. validate content contract
4. build and preview before publishing

Typical command flow:

```bash
npm run portfoliable
npm run portfoliable-build
npm run portfoliable-preview
```

## 6.1 View Transitions (Home to Case)

Generated apps use a single-page flow:

- Home route renders `ds-home-view` with gallery thumbnails.
- Clicking a thumbnail transitions in-place to `ds-case-view`.
- Case route keeps breadcrumb navigation (`Back`, `Home`, active case title) and uses `ds-article` for long-form content.

Transition behavior:

- default motion is subtle slide + fade + scale for an Apple-like minimal feel
- `Reduce Motion` accessibility mode disables transition motion automatically
- browser `prefers-reduced-motion` is also respected

This means users never leave the app shell while navigating between overview and case detail views.

## 7. Content Structure and Contract

Case files are stored as markdown under the generated content directory.

Each case requires frontmatter with localized fields:

- `id`
- `slug`
- `title.en` and `title.pt`
- `shortDesc.en` and `shortDesc.pt`
- `readTime.en` and `readTime.pt`
- `year.en` and `year.pt`
- `thumbSrc.en` and `thumbSrc.pt`

Optional but commonly used fields include:

- `desc.en` and `desc.pt`
- `descRecruiter`
- `repositoryUrl`
- `liveUrl`
- `videoSrc`
- `vttSrc`
- `audioSrc`
- `audioSrcRecruiter`

For framed thumbnails, configure:

- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`

Body content must include language sections expected by the parser.

### 7.1 Summary and Reader Rules (Auto Toggle)

The parser now derives UI toggles for:

- summary panel (`showSummary`)
- reader body (`showReader`)
- table of contents (`showToc`)
- case controller/navigator (`showNavigator`)

Use these rules.

1. Language blocks are still required:

```md
<!-- lang:en -->
...english content...

<!-- lang:pt -->
...portuguese content...
```

2. Optional summary block markers (inside each language section):

```md
<!-- summary:start -->
## Executive Summary
- Keep bullets, headings, and paragraphs here.
- Nested markdown children are preserved.
<!-- summary:end -->
```

Everything inside summary markers is rendered to the summary slot.
Everything outside summary markers is rendered to the reader body.

3. Folder placement controls defaults:

- `src/content/cases/*.md`: mixed mode (auto-detect summary + reader)
- `src/content/cases/summary/*.md`: summary-only default (`showReader=false`)
- `src/content/cases/reader/*.md`: reader-only default (`showSummary=false`)

4. Optional frontmatter overrides (highest priority):

- `showSummary: true|false`
- `showReader: true|false`
- `showPlayer: true|false`
- `showToc: true|false`
- `showNavigator: true|false`

Accepted aliases (same behavior):

- `summary`, `show-summary`
- `reader`, `show-reader`
- `player`, `show-player`
- `toc`, `show-toc`
- `navigator`, `show-navigator`

5. TOC and controller behavior:

- TOC defaults to on when reader content contains headings (`##` or `###`)
- Navigator/controller defaults to on when reader is enabled
- If `showReader=false`, TOC and navigator are forced off
- TOC active state (open menu item + closed minimap line) follows case-reader container scroll
- TOC and navigator/controller remain fixed while the reader content scrolls
- TOC and navigator/controller are non-scrollable control surfaces (page scroll is not captured inside them)

6. Marker validity:

- Always pair both summary markers in each localized section
- Unbalanced markers are treated as content validation warnings

## 8. Create a New Case

Generate a starter case:

```bash
npm run portfoliable-create-case -- --name "Checkout Revamp"
```

Legacy alias:

```bash
npm run portfoliable-scaffold-case -- --name "Checkout Revamp"
```

## 9. Thumbnail Device Options

Inspect supported values:

```bash
npm run portfoliable-thumbnail-options
npm run portfoliable-thumbnail-options -- --full
npm run portfoliable-thumbnail-options -- --json
```

Use exact category/brand/model/color values from command output to avoid mismatches.

## 10. Validation and Build Gates

Run before commit or deployment:

```bash
npm run validate:content
npm run portfoliable-build
npm run portfoliable-preview
```

If validation fails, correct frontmatter keys and language sections first.

## 11. Troubleshooting

### `npm create` cannot fetch package

- verify npm registry connectivity
- retry after checking package availability

### Content validation errors

- add missing required frontmatter keys
- ensure both language sections are present and correctly marked

### Thumbnail not rendering as expected

- rerun thumbnail options command
- verify values are exact matches from catalog output

### Build succeeds but preview is incorrect

Reset local dependencies and rebuild:

```bash
rm -rf node_modules package-lock.json
npm install
npm run portfoliable-build
npm run portfoliable-preview
```

## 12. Upgrade Guidance for Existing Projects

When updating dependencies in an existing generated project:

1. update package versions
2. run validation
3. build and preview
4. verify parser output and media rendering behavior

## 13. Minimal Quick Start

```bash
npm create @portfoliable my-portfolio
cd my-portfolio
npm run portfoliable
```

After that, edit your case markdown files and keep validation/build checks in your routine.