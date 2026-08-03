# Accessibility Checklist

Use this checklist before shipping docs or runtime-facing content changes.

## Structure

- Headings follow logical order without skipping levels.
- Links use descriptive text.
- Lists and tables are used semantically.

## Visual and readability

- Body text contrast is readable on default and themed backgrounds.
- Font sizes remain legible on mobile breakpoints.
- Motion-heavy UI has a reduced-motion-friendly path.

## Interaction

- Core controls are reachable via keyboard.
- Focus indicators are visible and not overridden.
- Icon-only actions expose meaningful labels.

## Media and localization

- Images have useful alternative descriptions when needed.
- Language-specific content is complete in both supported locales.

## Final command checks

```bash
npm run validate:content
npm run build
```

Add screenshot evidence in pull requests when accessibility-sensitive styles are changed.
