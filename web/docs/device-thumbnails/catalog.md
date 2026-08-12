# Device thumbnails and catalog-based rendering

Portfoliable can render device-style thumbnails automatically from metadata. This is the simplest way to get consistent case cards without preparing custom artwork for each project.

## The main fields that drive the catalog

Each case should include the following metadata:

- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`

These values tell the app which device frame to render and which color profile to use.

## Example values

```yaml
thumbCategory: mobile
thumbBrand: apple
thumbModel: Apple iPhone 15
thumbColor: Black
```

```yaml
thumbCategory: tablet
thumbBrand: samsung
thumbModel: Galaxy Tab S9
thumbColor: Graphite
```

## What the app does with this metadata

When the case is rendered:

- the correct frame family is chosen from the device catalog
- the color and product combination are matched to the available catalog entries
- the case image is composed inside the device shell for the home grid and detail view

This is designed to keep portfolio cards visually consistent and easy to maintain.

## Best practices

- use consistent naming across all cases
- prefer real device names over internal shorthand
- keep the same visual language across the gallery
- validate both the home view and the case detail view after changing metadata

## Common issues to check

### Missing values

If one of the metadata fields is missing or invalid, the rendered frame may fall back unexpectedly or render blank.

### Mismatched app metadata

Keep `thumbCategory`, `thumbBrand`, `thumbModel`, and `thumbColor` aligned with the actual asset and frame values used by the case.

### Visual inconsistency

If the gallery looks noisy, use a simpler, more consistent set of catalog variants across the portfolio instead of mixing too many device families.

## Recommended validation

```bash
npm run validate:content
npm run build
npm run preview
```

Then check the home page and case screen to confirm the device frame still looks correct after metadata updates.
