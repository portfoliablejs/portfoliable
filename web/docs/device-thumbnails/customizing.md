# Custom Thumbnail Setup

When default catalog resolution is not enough, use explicit thumbnail image sources.

## Add localized thumbnail sources

```yaml
thumbSrc.en: assets/thumbs/en/my-case.avif
thumbSrc.pt: assets/thumbs/pt/my-case.avif
```

This bypasses catalog-only rendering and uses your own prepared images.

## Asset preparation

- Export high-quality AVIF or optimized PNG assets.
- Keep aspect ratio consistent across the portfolio for cleaner grids.
- Store English and Portuguese variants only when text differs in image.

## Validation steps

1. Confirm paths exist in the project.
2. Run build and open preview.
3. Check that images load without fallback glitches.

```bash
npm run build
npm run preview
```

If a frame does not resolve correctly, setting thumbSrc explicitly is the safest fallback.
