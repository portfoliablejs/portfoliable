# Deploy

Use separate workflows for package release and website deployment.

## Why split workflows

- Package release publishes npm artifacts and release tags.
- Website deployment publishes static docs/marketing files to GitHub Pages.
- Isolation avoids coupling website publish failures to npm release state.

## Web deployment artifact

The web workflow builds the VitePress site and uploads:

```text
web/.vitepress/dist
```

## Production checks

1. Run web build locally.
2. Verify navigation paths on homepage and /docs.
3. Validate custom elements render correctly in static output.
4. Deploy to Release environment via GitHub Actions.

<div class="docs-callout">
  <strong>Tip</strong>
  <p>
    Keep package release automation unchanged and version web content independently through normal commits.
  </p>
</div>
