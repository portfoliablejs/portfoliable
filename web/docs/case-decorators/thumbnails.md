# Thumbnail device catalog

The thumbnail decorator is how Portfoliable presents a case in the portfolio gallery. It uses device metadata to wrap the case image in a consistent device frame.

## Device metadata fields

Each case should include:

- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`

Example:

```js
"thumbCategory": "mobile",
"thumbBrand": "apple",
"thumbModel": "Apple iPhone 15",
"thumbColor": "Black"
```

## Command to inspect supported devices

Use the CLI to inspect the valid device combinations:

```bash
npm run portfoliable-thumbnail-options
npm run portfoliable-thumbnail-options -- --full
npm run portfoliable-thumbnail-options -- --json
```

This is the command you want when deciding which device frame and color profile to use for a case.

## Why this matters

The device thumbnail decorator controls:

- the home gallery presentation
- how the case reads visually in the portfolio grid
- whether a case looks product-grade or ad hoc

If the metadata is wrong, the card may fall back unpredictably or look visually inconsistent.

## Best practices

- keep names consistent across all cases
- prefer real device names over shorthand labels
- use the same design language across the portfolio
- check the gallery and case detail view after editing metadata

## Validation

```bash
npm run validate:content
npm run build
npm run preview
```

If you want full control over a specific case card, use a custom `thumbSrc` instead of relying only on the generated device catalog.
