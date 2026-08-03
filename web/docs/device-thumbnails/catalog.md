# Thumbnail Catalog

Portfoliable supports metadata-driven device thumbnail rendering through Valence.

## Core metadata fields

Each case should set:

- thumbCategory
- thumbBrand
- thumbModel
- thumbColor

These fields select the device frame style and color profile used by the thumbnail component.

## Common examples

```yaml
thumbCategory: mobile
thumbBrand: apple
thumbModel: Apple iPhone 12
thumbColor: Black
```

```yaml
thumbCategory: tablet
thumbBrand: samsung
thumbModel: Galaxy Tab S9
thumbColor: Graphite
```

## Best practices

- Use consistent naming across cases for easier filtering and visual coherence.
- Prefer real device naming rather than internal shorthand.
- Verify thumbnail rendering in both home gallery and case detail flows.
