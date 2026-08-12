# Adding a new case study

The easiest and safest way to create a new case is to use the built-in scaffold command in your generated project.

## Create the case

```bash
npm run portfoliable-create-case -- --name "My New Case"
```

This creates a starter case file under your content folder with the expected metadata structure and localized sections.

## Fill in the required metadata

Before writing the body content, confirm these values are present and correct:

- `id`
- `slugByLocale`
- localized `title`
- localized `shortDesc`
- localized `readTime`
- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`

Without these, the case may not render correctly in the gallery or case reader.

## Keep the case content localized

Use explicit language blocks so each locale is easy to maintain:

```md
<!-- lang:en -->
## Context
Your English case details go here.

<!-- lang:pt -->
## Contexto
Detalhes do caso em português.
```

This pattern keeps your content readable and prevents hidden localization issues.

## Add supporting details

Most strong case studies include:

- a concise summary for the gallery card
- a clear problem statement
- the process or solution flow
- measurable results or impact
- action links for preview, repo, or live demo

## Validate early and often

Run the project validation before building:

```bash
npm run validate:content
```

Then preview the portfolio locally:

```bash
npm run build
npm run preview
```

## Common mistakes to avoid

- reusing an `id` that already exists
- changing `slugByLocale` values after a case has been published
- forgetting to translate required metadata fields for a new locale
- leaving an invalid thumbnail metadata combination

A clean case file is easier to maintain and safer to publish.
