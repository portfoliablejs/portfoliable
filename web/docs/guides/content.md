# Content authoring

Portfoliable is a content-first portfolio system. The most important work is usually not in the app shell but in the case files and their metadata.

## What a case looks like

Each case is a markdown file with:

- a config block with metadata
- localized body sections
- optional summary blocks
- optional actions and social links
- an optional protection flag

The app reads the case metadata and renders it in the home grid, case reader, links, and social previews.

## The main case file structure

A generated case file typically includes:

- `id`
- `caseOrder`
- `slugByLocale`
- `title`
- `shortDesc`
- `readTime`
- `kicker`
- `thumbSrc`
- `thumbCategory`, `thumbBrand`, `thumbModel`, `thumbColor`
- `visibility`
- `social` and `actions`
- localized markdown body content

Example structure:

```md
<!-- config
{
  "id": "my-first-case",
  "caseOrder": 10,
  "slugByLocale": {
    "en": "my-first-case",
    "pt": "meu-primeiro-case"
  },
  "title": {
    "en": "My First Case",
    "pt": "Meu Primeiro Caso"
  },
  "shortDesc": {
    "en": "A concise summary of the work.",
    "pt": "Um resumo conciso do trabalho."
  },
  "thumbCategory": "mobile",
  "thumbBrand": "apple",
  "thumbModel": "Apple iPhone 15",
  "thumbColor": "Black"
}
-->

<!-- lang:en -->
## Context

Your English version of the case body goes here.

<!-- lang:pt -->
## Contexto

Sua versao em Portugus vai aqui.
```

## Required metadata fields

At a minimum, make sure your case includes the values Portfoliable expects for the gallery and reader:

- `id`
- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`
- localized `title`
- localized `shortDesc`
- localized `readTime`
- localized `kicker`
- localized `thumbSrc`

If these are missing, your case may not render correctly in the portfolio grid or detail view.

## Best practices for writing case content

### Write metadata first

Before writing the long-form case narrative, fill in the field values that control the homepage card and detail view.

### Keep locale sections explicit

When you support multiple languages, add a clear `<!-- lang:xx -->` section for each one. This makes the documentation and the runtime behavior predictable.

### Use concise summaries

The homepage and social metadata usually depend on the `shortDesc` and `title`. Keep these concise and compelling.

### Validate often

Use the validation command regularly while editing:

```bash
npm run validate:content
```

This catches invalid case metadata before build time.

## Creating a new case

Use the built-in scaffold command:

```bash
npm run portfoliable-create-case -- --name "My New Case"
```

This creates a starter case with the expected metadata structure. You can then rewrite its text and settings.

If you want to delete a case by id:

```bash
npm run portfoliable-delete-case -- --id my-new-case
```

## Common edge cases

### Missing locale keys

If you add a locale but do not update the localized metadata for the case, the app may render missing values or fallback text.

### Broken asset paths

If a thumbnail or media path is wrong, the gallery may render empty cards or broken covers. Keep asset paths relative and tested.

### Duplicate id values

Case ids should be unique. Reusing an id can create confusing route conflicts and broken references.

### Unstable slugs

If a `slugByLocale` value changes, deep links may break. Keep slugs stable once published.

### Protected content without a backend

If a case is protected but the server-side unlock endpoint is not configured correctly, the app may appear locked or inconsistent. This is especially important for premium or private work.

## Summary blocks and actions

Cases can include more than body copy. You can also configure:

- `summary` blocks used for compact dry-run summaries or recruiter-facing context
- primary, secondary, and tertiary actions
- social sharing options
- video/demo links
- repository links

These values are not optional in all projects, but they are highly recommended when you want a richer case viewer and social preview output.

## Recommended workflow

1. create the case
2. fill metadata
3. add localized sections
4. make sure the thumbnail values are valid
5. validate content
6. run the app locally
7. build and preview before shipping

Example:

```bash
npm run portfoliable-create-case -- --name "Case Study One"
npm run validate:content
npm run build
npm run preview
```

## Next steps

- [Configuration](./configuration)
- [Languages and localization](./setting-languages)
- [Localized sharing and visibility](../sharing-visibility/localized-sharing-and-visibility)
