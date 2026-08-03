# Portfoliable Web

This folder contains the public website and end-user documentation for Portfoliable.

## Stack

- VitePress (open-source docs management)
- Valence web components for UI sections in both homepage and docs pages

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run smoke
```

From repository root:

```bash
npm run web:dev
npm run web:build
npm run web:preview
```

## Output

Production build artifact:

```text
web/.vitepress/dist
```

That artifact is deployed by the dedicated workflow in .github/workflows/web-release.yml.
