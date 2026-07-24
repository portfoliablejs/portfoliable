# Portfoliable Visual Configuration

Use `portfoliable.config.js` at the project root to customize template and design values.

## Main sections

- `homeView`: title, footer, itemCount, engine
- `themeTokens`: CSS custom properties
- `galleryItemDefaults`: default gallery behavior

## Example

```js
export default {
  homeView: {
    title: { en: "Portfolio", pt: "Portfolio" },
    footer: { en: "All rights reserved", pt: "Todos os direitos reservados" },
    itemCount: 4,
    engine: 'minimal'
  },
  themeTokens: {
    '--color-bg': '#FFFFFF',
    '--color-black': '#000000'
  }
};
```

This file is the easiest place for developers to chain simple value changes.
