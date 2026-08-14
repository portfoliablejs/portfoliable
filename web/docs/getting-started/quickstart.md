# Quickstart

This is the fastest path from a brand-new scaffolded app to a working first portfolio build.

## 1. Create the project

```bash
npm create portfoliable@latest my-portfolio
# or
npm create portfoliable my-portfolio
cd my-portfolio
npm install
```

## 2. Start the app

```bash
npm run portfoliable
```

This starts the local dev server and loads the starter portfolio content. You should see the default home layout, case cards, and starter case content.

## 3. Open the generated project structure

In a typical generated project, the files you care about most are:

- `src/content/cases/` — your case study markdown files
- `src/content/about/` — about page content
- `configs/` — runtime config and i18n configuration
- `public/` — publicly served assets and API endpoints

Do not edit the generated app shell blindly. The main content flow is through the content folder and config files.

## 4. Create your first case

Use the built-in scaffold command:

```bash
npm run portfoliable-create-case -- --name "My First Case"
```

That creates a starter case file with the expected metadata and body structure. You can then open the generated markdown and replace the placeholder copy with your own content.

## 5. Fill in the case metadata

Each case should eventually include:

- a stable `id`
- localized `title` and `shortDesc`
- `thumbCategory`, `thumbBrand`, `thumbModel`, and `thumbColor`
- valid image paths or device metadata
- correct locale sections if you use more than one language

A typical case file starts with a config block and a markdown body using locale markers.

## 6. Validate your content

Before building:

```bash
npm run validate:content
```

This checks your cases against the expected content contract and catches missing or invalid metadata early.

## 7. Add a second language if needed

If you want content in more than one language:

```bash
npm run add:language -- --code es --name Español --html-lang es-ES
```

After that, review the generated locale sections and fill in the translated values.

## 8. Customize the homepage and theme

Open the project config and update your homepage title, footer copy, theme tokens, and visibility settings. Most branding changes live in the config layer instead of large CSS rewrites.

## 9. Build and preview

When you are ready:

```bash
npm run build
npm run preview
```

`build` creates the production bundle, and `preview` lets you test the final static output locally before publishing.

## 10. Publish

Once the app looks correct:

- push the project to your hosting target
- ensure your static host serves the build output correctly
- confirm URL paths, localized routes, and social metadata work as expected

## Typical first-project checklist

Before you ship, confirm:

- the portfolio home view looks correct
- at least one case renders with working metadata
- the case titles and summaries are correct
- your chosen locale configuration is consistent
- links and media paths resolve
- the build succeeds without validation errors

## Next steps

- [Configuration](../guides/configuration)
- [Content authoring](../guides/content)
- [Languages and localization](../guides/setting-languages)
- [Localized sharing and visibility](../sharing-visibility/localized-sharing-and-visibility)
