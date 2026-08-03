# Configuration

Portfoliable runtime configuration lives in portfoliable.config.js.

## Key sections

- homeView: title, footer, itemCount, engine, and menu visibility.
- themeTokens: CSS custom properties injected at runtime.
- content metadata: case-level values consumed by gallery and article views.

## Theme token strategy

Define brand primitives once and let Valence consume them everywhere:

```js
export default {
  themeTokens: {
    '--color-bg': '#f9fbff',
    '--color-accent': '#0f6c5c',
    '--font-family': 'Avenir Next, Segoe UI, sans-serif'
  }
};
```

## Recommendation

Treat tokens as product API. Change them through reviewed pull requests and keep visual snapshots for critical flows.
