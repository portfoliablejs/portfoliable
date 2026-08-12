# Adding a new case decorator

Create a new case with the built-in scaffold command so the metadata contract is correct from the start.

## Create the case

```bash
npm run portfoliable-create-case -- --name "My New Case"
```

This creates a starter case file with the default metadata and localized body structure.

## Fill in the key case fields

Before writing the article body, make sure the case includes:

- `id`
- localized `title` and `shortDesc`
- localized `readTime`
- `thumbCategory`
- `thumbBrand`
- `thumbModel`
- `thumbColor`
- any decorator values you want to enable, such as `showReader`, `showPlayer`, or `showNavigator`

## Decorator choices for a stronger case

A good case often uses a mix of:

- `showReader: true` for the narrative body
- `showNavigator: true` when sections are long
- `showPlayer: true` when audio summary is available
- `showSummary: true` when a compact executive snapshot is useful
- thumbnail metadata for gallery presentation

## Example pattern

```js
"showReader": true,
"showNavigator": true,
"showSummary": true,
"showPlayer": true,
"thumbCategory": "mobile",
"thumbBrand": "apple",
"thumbModel": "Apple iPhone 15",
"thumbColor": "Black"
```

## Validate before preview

```bash
npm run validate:content
npm run build
npm run preview
```

## Common mistakes to avoid

- reusing an existing `id`
- leaving required localized metadata empty
- changing route identifiers after publishing
- setting thumbnail values that do not match a valid device combination

When the case is scaffolded correctly, the decorator layout becomes much easier to manage over time.
