# Accessibility and inclusive design

Portfoliable is built for real portfolios that need to work on laptops, mobile devices, keyboards, screen readers, and public-facing browsers. Accessibility is not an extra layer; it is part of the default content and UI contract.

## What this means in practice

The generated portfolio should stay usable when:

- a user browses with a keyboard only
- a visitor uses a screen reader or browser assistive technology
- a portfolio is viewed in bright, dark, or low-contrast environments
- a case includes media, motion, or long-form content
- content is localized into more than one language

## The default standards to keep

### Structure and semantics

- use headings in a logical order
- keep links descriptive and meaningful
- preserve proper list and section semantics
- avoid relying on color alone to communicate state or meaning

### Interaction

- ensure primary actions can be reached by keyboard
- keep focus styles visible and clear
- avoid traps or hidden navigation states
- give icon-only controls a meaningful accessible label

### Readability

- keep paragraph lengths and spacing comfortable for reading
- preserve good contrast in both default and custom theme states
- verify that long case content remains readable on mobile and tablet layouts
- review motion-sensitive interactions and ensure reduced-motion paths remain functional

### Media and content quality

- include useful alt text or equivalent description when a media asset communicates meaning
- provide localized text when a case or About section is translated
- avoid publishing a case that only works visually without textual context

## Where to review accessibility in a Portfoliable project

### In the app shell

Check the homepage, About view, and case reader after changing theme tokens or navigation defaults.

### In case content

Review headings, narrative flow, action labels, summary text, and any imported image or video content.

### In localization

Accessibility problems often appear when translations are incomplete or when directional layout changes are not tested.

## Recommended workflow

1. review the default app shell before publishing
2. inspect each case for heading order and readable copy
3. test keyboard navigation across the main flows
4. confirm the portfolio still reads well in both default and customized themes
5. validate content and build before release

```bash
npm run validate:content
npm run build
npm run preview
```

## Good default mindset

Treat accessibility as part of the content quality bar, not as a final QA step. A portfolio that is easy to read, navigate, and understand is more useful for everyone.
