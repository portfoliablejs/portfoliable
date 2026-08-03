# Editing Case Studies

Editing existing cases should preserve identifiers and URL stability.

## Safe edits

These changes are low risk:

- Updating title, summary, and article body text
- Updating read-time labels
- Updating repository and demo URLs
- Refining thumbnail metadata while keeping file references valid

## Changes that need extra care

- id changes can break references and historical links
- slug changes modify deep links and may require redirects
- deleting language fields can break localized rendering

## Editing workflow

1. Open the target file in src/content/cases.
2. Edit frontmatter first, then article body.
3. Run content validation.
4. Run local preview and check the case card and article view.

## Recommended checks

```bash
npm run validate:content
npm run build
npm run preview
```

Keep edits small and review with screenshots when changing visual or metadata-heavy sections.
