# Quickstart

This path gets you from zero to a first publishable build.

## 1. Scaffold a case

```bash
npm run scaffold:case -- --slug my-first-case
```

## 2. Fill markdown content

Edit the generated markdown file under src/content/cases and complete frontmatter plus English/Portuguese sections.

## 3. Validate content contracts

```bash
npm run validate:content
```

## 4. Build and preview

```bash
npm run build
npm run preview
```

## 5. Commit and release

Push your branch and let your CI workflow run smoke checks and production build steps.

<ds-divider></ds-divider>

<div class="button-row">
  <a href="../guides/configuration"><ds-button variant="secondary">Next: Configuration</ds-button></a>
</div>
