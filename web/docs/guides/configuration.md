# Configuration and branding

Portfoliable is designed so most day-to-day customization happens in a few config files instead of scattered CSS edits. The main runtime config is the design config file generated in your project.

## Where configuration lives

In a generated project, the core config files are usually:

- `configs/portfoliable.design.config.js` — app shell behavior, home view, visibility, theme overrides, header behavior
- `configs/i18n/i18n.config.js` — available locales, labels, and locale metadata
- `configs/i18n/i18n.labels.js` — translated UI labels used by the app
- `src/content/about/ABOUTME.md` — About page metadata and actions
- `src/content/cases/**/case.md` — per-case metadata, summary, and article content

You do not need to edit all of them for every change. Most common work happens in the design config and the case files.

## What you can customize

### Home view

The home view controls the landing experience of your portfolio.

Typical settings include:

- `itemCount` — how many cards appear in the initial gallery
- `engine` — rendering engine mode
- `showBreadcrumb` — breadcrumb visibility in the shell
- `showLanguageMenu` — whether language selection is visible
- `gallery` overrides — home-specific spacing and height tweaks

Example:

```js
export default {
  homeView: {
    itemCount: 8,
    engine: 'minimal',
    showBreadcrumb: false,
    showLanguageMenu: true,
    gallery: {
      '--ds-gallery-height': '52vh'
    }
  }
};
```

### Visibility and indexing

Portfoliable supports visibility controls for web navigation, crawlers, and AI indexing. These are important for public-facing portfolios and for controlling what gets indexed.

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

Use these settings to decide whether a case or About page should appear in app navigation, robots metadata, and AI/crawler metadata flows.

### Protection

The protection config defines how protected cases are unlocked.

```js
export default {
  protection: {
    unlockEndpoint: '/api/unlock-case.php'
  }
};
```

This is the default endpoint pattern used by secure unlock flows. Keep it in your config rather than hardcoding the value into markdown files.

### Password-protected cases

Use protected cases when a project should remain hidden until the user enters the correct passcode. The important rule is that the real password never belongs in the case markdown file.

Recommended flow:

1. Mark the case as protected in the case metadata:

```js
{
  id: 'mobile-product-launch',
  isProtected: true
}
```

2. Keep the server endpoint configured in your app config:

```js
export default {
  protection: {
    unlockEndpoint: '/api/unlock-case.php'
  }
};
```

3. Copy the example backend config and add a hash for each protected case:

```bash
cp public/api/password.config.example.json public/api/password.config.json
```

Then add entries like:

```json
{
  "cases": {
    "mobile-product-launch": {
      "hash": "$argon2id$v=19$m=65536,t=4,p=1$...generated-hash..."
    }
  }
}
```

4. Generate a safe server-side hash:

```bash
npm run password:hash -- --case-id mobile-product-launch --password "your-secret"
```

5. Keep `public/api/password.config.json` outside git and block direct access with the rules in `public/api/.htaccess`.

Operational rules:

- never store raw passwords in markdown or frontmatter
- always verify via the PHP unlock endpoint
- return `Cache-Control: no-store` from unlock responses
- do not rely on `isProtected` alone for real security; it is only the client-side lock state

### Header and navigation settings

The app shell exposes header-level contract overrides for breadcrumbs, language menu, navigation region, and About button options. These are usually used when you want a very specific branded shell behavior.

### Design tokens and component overrides

The config surface allows token overrides for Valence components through the `components` section. In practice, start small and keep styling consistent.

Example:

```js
export default {
  components: {
    atoms: {
      button: {
        '--ds-button-bg': '#111827',
        '--ds-button-hover-bg': '#1f2937',
        '--ds-button-radius': '999px'
      }
    }
  }
};
```

Do not treat this as a free-for-all CSS override system. Use it to adjust product-level brand primitives rather than to fight the component library with ad hoc styles.

## Theme strategy

A strong default workflow is:

1. set a few core brand tokens once
2. keep them consistent across the portfolio
3. let the app shell and components consume them everywhere
4. avoid duplicating color overrides at too many layers

Good examples:

- background tone
- accent color
- typography family
- button radius or density adjustments

Bad examples:

- custom CSS that duplicates Valence component defaults in many places
- setting visual values on individual cases instead of respecting the shared config

## Localization configuration

Language behavior is not just a case body feature. It is also a runtime concern.

Your locale setup usually lives in:

- `configs/i18n/i18n.config.js`
- `configs/i18n/i18n.labels.js`

Use the CLI instead of editing everything by hand when possible:

```bash
npm run add:language -- --code es --name Español --html-lang es-ES
npm run delete:language -- --code es
npm run sync:locales
```

This keeps the locale config, labels, and case metadata aligned.

## Common customization workflows

### Change the portfolio title and footer

Update the home config values in your design config so the landing page reflects your brand.

### Change a case’s default metadata

Edit the case header block in the markdown file. This is where you set:

- `id`
- `slugByLocale`
- `title`
- `shortDesc`
- `thumbSrc` and thumbnail model metadata
- visibility and protection flags

### Add a new locale

```bash
npm run add:language -- --code fr --name Français --html-lang fr-FR
```

Then translate the generated placeholders and run validation again.

### Modify social/SEO output

The case and About page metadata drive share cards and social metadata. Update the localized metadata there instead of trying to patch the rendered output at runtime.

## Edge cases and mistakes to avoid

### Editing too much in generated output

If you can adjust a brand or behavior in config, prefer that over rewriting the generated shell or custom component logic.

### Missing locale keys

If a locale exists in the config but missing in case metadata, the page can fall back awkwardly or render incomplete translations.

### Hiding content without understanding visibility rules

`web`, `crawlers`, and `ai` are separate concerns. A case can be visible in the app but still suppressed from crawl-oriented metadata if you configure it that way.

### Moving IDs or slug values too casually

Changing a case `id` or locale slug can break deep links and cached route behavior. Keep these stable when possible.

## Recommended workflow

1. set homepage metadata and theme tokens
2. tune the app shell and header behavior
3. add or update case metadata
4. add languages where needed
5. run validation and build
6. preview locally before publishing

Example flow:

```bash
npm run portfoliable
npm run validate:content
npm run build
npm run preview
```

## Next steps

- [Content authoring](./content)
- [Languages and localization](./setting-languages)
- [Localized sharing and visibility](../sharing-visibility/localized-sharing-and-visibility)
