# Languages and localization

Portfoliable supports multilingual portfolios from the start. The app is designed to work with localized titles, slugs, metadata, and case content while maintaining a clean default language experience.

## Where localization lives

The generated app normally uses these files for language setup:

- `configs/i18n/i18n.config.js` — locale list and metadata
- `configs/i18n/i18n.labels.js` — translated UI labels
- case markdown files — localized body content and case metadata
- `src/content/about/ABOUTME.md` — localized About page content

You usually do not need to edit the locale plumbing by hand. The built-in commands are safer and more consistent.

## Default behavior

Portfoliable works best when:

- one locale is the default
- other locales are added intentionally
- each case has localized values for each supported language
- language sections in markdown are explicit and complete

If a case is missing a locale value, the app may fall back to defaults or render incomplete output.

## Add a locale

Use the CLI command:

```bash
npm run add:language -- --code es --name Español --html-lang es-ES
```

You can also add a locale explicitly as LTR or RTL:

```bash
npm run add:language -- --code ar --name العربية --html-lang ar-SA --rtl
npm run add:language -- --code it --name Italiano --html-lang it-IT --ltr
```

What this does:

- adds the locale to the app config
- updates the locale list used by the language switcher
- syncs localized sections in About and case files
- creates placeholder strings and localized blocks where needed

## Remove a locale

```bash
npm run delete:language -- --code es
```

If you remove the current default locale, use:

```bash
npm run delete:language -- --code en --force
```

This prunes the locale from the synchronized content and updates the remaining defaults.

## Sync localized content after manual edits

If you changed locale config by hand or want to ensure alignment across the app, run:

```bash
npm run sync:locales
```

This is the reset button for localized structure. It helps keep the case metadata and About page consistent with the locale config.

## Direction handling

Portfoliable derives the document direction from the configured locale data.

- LTR locales are used for left-to-right languages such as English and Portuguese.
- RTL locales are used for Arabic, Hebrew, Persian, and similar scripts.

Example:

```bash
npm run add:language -- --code ar --name العربية --html-lang ar-SA --rtl
```

The app applies both `lang` and `dir` metadata automatically so the content and page structure match the selected language.

## How to structure localized content

Your case markdown should include explicit language blocks, for example:

```md
<!-- lang:en -->
## Problem
This is the English explanation.

<!-- lang:pt -->
## Problema
Esta é a explicação em português.
```

The same pattern is used for localized `About` content and metadata. Avoid mixing everything into one block unless you are intentionally building a single-language content file.

## Locale edge cases

### Missing translations

If you add a new locale but leave a case untranslated, the app may fall back to a default or render incomplete data.

### Wrong `htmlLang`

The `htmlLang` value should match the real locale tag you want the browser to use. This affects language detection and page metadata.

### Bad direction assumptions

Do not assume that a locale is always LTR. If you are using an RTL language, confirm that the app is rendering in the correct direction and that the text flow looks correct.

### Locale-specific slugs

Use localized slugs intentionally. If a slug is changed in one locale, the route may no longer be stable for old links.

## Recommended workflow

1. add a locale with the CLI
2. translate the generated content
3. run `npm run sync:locales` if you edit locale files manually
4. validate your case metadata
5. preview the site in all locales you support

Example:

```bash
npm run add:language -- --code es --name Español --html-lang es-ES
npm run sync:locales
npm run validate:content
npm run build
```

## Next steps

- [Content authoring](./content)
- [Localized sharing and visibility](../sharing-visibility/localized-sharing-and-visibility)
- [Configuration](./configuration)
