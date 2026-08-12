# Localized sharing URLs and visibility controls

Portfoliable uses localized metadata and route-aware visibility controls to decide how a case or About page appears in the browser, in social previews, and in indexing systems.

## Why this matters

If you want your portfolio to feel polished and predictable, you need to think about:

- localized URLs
- social sharing previews
- search and crawler visibility
- AI-indexing flags
- whether a case is public or protected

The good news is that most of this is controlled in metadata and config, not through custom code.

## Canonical localized route pattern

Portfoliable resolves routes in a locale-aware way.

Examples:

- `/en/case/mobile-product-launch`
- `/pt/case/lancamento-de-produto-mobile`
- `/en/about`
- `/pt/sobre`
- `/en`

This keeps the generated portfolio consistent for multiple languages and helps the site use correct canonical metadata.

## Case metadata you should review

In a case file, pay attention to these values:

```js
"slugByLocale": {
  "en": "mobile-product-launch",
  "pt": "lancamento-de-produto-mobile"
},
"socialImage": {
  "en": "https://example.com/share-en-16x9.jpg",
  "pt": "https://example.com/share-pt-16x9.jpg"
},
"visibility": {
  "web": true,
  "crawlers": true,
  "ai": true,
  "locales": {
    "pt": { "crawlers": false }
  }
},
"isProtected": false,
"isUnlocked": false
```

### What these fields mean

- `slugByLocale` — localized route slug for each language
- `socialImage` — image used in share cards and Open Graph output
- `visibility.web` — whether the item appears in app-level navigation lists
- `visibility.crawlers` — whether crawler/SEO metadata is eligible
- `visibility.ai` — whether AI indexing hints are emitted
- `visibility.locales` — per-locale overrides
- `isProtected` — indicates the case may require unlocking
- `isUnlocked` — user session state after a valid unlock

## About page metadata

The About page also uses localized metadata, including slug and visibility values.

Example:

```js
"slugByLocale": {
  "en": "about",
  "pt": "sobre"
},
"visibility": {
  "web": true,
  "crawlers": true,
  "ai": true,
  "locales": {}
}
```

This keeps the About page in sync with the rest of the portfolio and allows correct route generation for each locale.

## Global defaults

The default app config provides the baseline visibility rules:

```js
export default {
  visibility: {
    web: true,
    crawlers: true,
    ai: true,
    locales: {}
  }
};
```

Per-case settings override these defaults when needed.

## Social and SEO metadata

Portfoliable emits metadata based on the current route and content type.

For case routes:

- title comes from case metadata
- description comes from `shortDesc`
- image may use `socialImage` or fall back to `thumbSrc`

For About routes:

- title comes from About metadata
- description uses the About summary or subtitle
- image may use About `socialImage`

For the home page:

- `meta_home_title` and `meta_home_description` are used as the key page metadata inputs

## SEO and route behavior

A few important rules:

- Home, About, and case reader pages are the main SEO-eligible content routes.
- Player or media-focused routes are generally not treated as primary SEO targets.
- `visibility.crawlers` and `visibility.ai` act as metadata hints rather than a replacement for good content strategy.

## Protected cases

Portfoliable supports protected cases, which means a case can require a valid unlock before it is fully accessible.

Important rule:

- never store a raw password in the case markdown file

Protected content should use a server-side unlock flow instead.

## Secure mode setup

The generated project expects a server-side unlock endpoint for real protection.

Typical files include:

- `public/api/unlock-case.php`
- `public/api/password.config.example.json`
- `public/api/.htaccess`
- scripts for generating password hashes

Example config:

```js
export default {
  protection: {
    unlockEndpoint: '/api/unlock-case.php'
  }
};
```

Then generate a protected-case hash:

```bash
npm run password:hash -- --case-id mobile-product-launch --password "your-secret"
```

This creates a safe hash you can store in your backend config instead of a plaintext secret.

## Common visibility mistakes

### Treating web visibility as the same as crawler visibility

These are separate. A case can be visible in the app but still not be a good crawler target.

### Forgetting to configure localized roots

If locale metadata is wrong or missing, the site may generate inconsistent canonical URLs or share cards.

### Using protected mode as decoration only

A locked case with no actual backend enforcement is not real protection. Use the secure endpoint flow when the content truly needs to be private.

## Recommended workflow

1. define localized slugs for each case
2. set visibility flags intentionally
3. add social images and summaries
4. review the default metadata for the home page and About page
5. configure secure unlock flow for any protected case
6. validate and preview before publishing

Example:

```bash
npm run validate:content
npm run build
npm run preview
```

## Next steps

- [Content authoring](../guides/content)
- [Languages and localization](../guides/setting-languages)
- [Configuration](../guides/configuration)

Operational rules:

- keep `public/api/password.config.json` out of git
- block direct access with `public/api/.htaccess`
- return `Cache-Control: no-store` on unlock responses

## Automation behavior

When adding or removing locales with CLI scripts:

- localized language blocks are synced
- `slugByLocale` fields are created/pruned automatically
- localized slug values are normalized to kebab-case

Run your normal validation workflow after locale changes.

## Search behavior

Case navigator search applies protection visibility rules.

- Locked protected cases are automatically hidden from search results.
- Unlocked protected cases become searchable again in the active session.

Default-locale grouping behavior:

- Only in the default locale (`en`), the first search result is `Main View`.
- Results below `Main View` are case studies.
- In non-default locales, search shows case studies only.

## Search engine hierarchy signals

Portfoliable can help search engines understand route hierarchy, but it cannot force Google, Bing, or other networks to render grouped sitelinks in a specific way.

- Home emits structured data that lists About first and then crawlable case readers.
- About and Case reader routes emit breadcrumb-style structured data rooted in Home.
- Canonical and `hreflang` links reinforce the localized route structure.

Search engines remain responsible for deciding if grouped results appear and in what order.
