# Custom thumbnail setup

The catalog is the default and easiest path, but Portfoliable also supports custom thumbnail image sources when you want full control over a case card.

## Use a custom source

Add localized thumbnail source values directly to the case metadata:

```yaml
thumbSrc.en: assets/thumbs/en/my-case.avif
thumbSrc.pt: assets/thumbs/pt/my-case.avif
```

This bypasses catalog-only rendering and uses the artwork you prepared.

## Best practices for image assets

- export optimized AVIF or PNG files
- keep a consistent aspect ratio across cases
- store locale-specific variants only when the text or composition differs
- keep file paths relative to the generated project

## When to prefer custom source instead of catalog mode

Choose a custom thumbnail when:

- the device frame does not match the project aesthetic
- a case needs a more editorial or branding-heavy cover
- the catalog rendering produces visual artifacts in a target browser
- you want a stronger control over how the case is presented on the home screen

## Browser notes

Thumbnail composition in the home gallery can vary slightly across browsers, especially around horizontal scroll and masked device frames. Safari and certain WebKit-based browsers are often more sensitive to alpha-edge behavior during wheel or trackpad scrolling.

If you notice flicker, jitter, or inconsistent screen composition, the safest user-level fallback is to provide `thumbSrc` for that case and remove the need for the dynamic device catalog layer.

## Recommended QA flow

Test your thumbnails in at least:

1. Chrome
2. Safari
3. DuckDuckGo or your primary WebKit-based browser

During QA, check:

- home gallery rendering
- case detail rendering
- horizontal scrolling behavior
- image fallback quality when a source is missing

## Validation commands

```bash
npm run validate:content
npm run build
npm run preview
```

If a frame does not resolve correctly, prefer a direct custom thumbnail source rather than forcing the default catalog path.
