# Deploying a Portfoliable site

Portfoliable separates the runtime package from the docs and marketing site. This is intentional: you should not force your app release workflow and your web publishing workflow into one pipeline.

## Two deployment tracks

### 1. Package deployment

This track publishes the npm package and the generated app runtime. It is for the creator package and feature updates.

### 2. Web deployment

This track publishes the docs and marketing website, usually to a static host such as GitHub Pages.

## The web artifact

The web project builds a static VitePress export into:

```text
web/.vitepress/dist
```

That is the artifact deployed by the web release workflow.

## Recommended production checklist

Before publishing the site, confirm:

1. the VitePress build completes locally
2. the home page and docs navigation still work as expected
3. custom components render correctly in static output
4. SEO and share metadata still look correct on the key routes
5. home metadata values are still set correctly
6. localized routes and `hreflang` data are still valid
7. visibility flags still prevent or allow indexing as intended
8. protected and private cases remain appropriately hidden when configured

## Local validation commands

```bash
cd web
npm run build
npm run preview
```

Then test the navigation, case routes, and any updated localized pages in the browser.

## Best practice

Keep package change management separate from website publishing. The docs site should move when content or marketing changes, while the package release cycle can stay independent.
