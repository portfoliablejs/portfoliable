# Accessibility checklist

Use this checklist before Shipping or publishing a portfolio update.

## Content structure

- headings follow a logical flow and do not skip levels
- link text describes the destination or purpose
- sections are easy to scan on mobile and desktop
- each case has clear context and readable summary text

## Visual readability

- text remains readable on default and custom color themes
- contrast is strong enough for both body text and UI labels
- long-form case text stays comfortable to read on narrow screens
- no important meaning depends on color alone

## Interaction and navigation

- primary actions are reachable with the keyboard
- focus states remain visible on custom theme overrides
- icon-only controls include accessible labels
- the language switcher and navigation controls remain usable in all supported locales

## Media and content quality

- images or video content include meaningful alternative text or relevant surrounding explanation
- case summaries are not ambiguous or overly promotional without context
- localized content is complete when a locale is active
- motion-heavy sections still work when reduced motion is preferred

## Final checks before release

```bash
npm run validate:content
npm run build
npm run preview
```

For large design changes, review the portfolio in multiple browsers and on mobile widths before publishing.
