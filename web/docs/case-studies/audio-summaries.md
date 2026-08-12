# Audio summaries

Portfoliable supports optional audio summaries for cases. This is useful when you want a richer reading experience, a more accessible story layer, or an additional way to consume the same case content.

## Where audio metadata lives

Audio summary settings live in the case metadata and usually include:

- `audioLabel`
- `audioSrc`
- `showPlayer`

Example:

```js
"audioLabel": {
  "en": "Mobile Product Launch Audio Summary",
  "pt": "Resumo em áudio do lançamento do produto"
},
"audioSrc": {
  "en": "/src/content/cases/mobile-product-launch/audio-summary.mp3",
  "pt": "/src/content/cases/mobile-product-launch/audio-summary.mp3"
},
"showPlayer": true
```

## When to use audio summaries

Use audio if the case benefits from:

- a spoken version of the summary or narrative
- a richer accessibility experience
- a polished presentation for demos or stakeholder review

Do not force audio onto every case. The value is strongest when the content is already strong and the audio adds context instead of noise.

## Best practices

- keep the same audio file for all supported locales when the language is not meaningfully different
- provide localized labels when the player label is exposed in the UI
- use a consistent file naming pattern across cases
- test playback on the actual case detail view

## Recommended workflow

1. add the audio file to the case folder
2. set the localized `audioSrc` values
3. set `audioLabel` for each supported locale
4. enable `showPlayer`
5. validate and preview the case in the browser

## Validation

```bash
npm run validate:content
npm run build
npm run preview
```

Then check that the audio player appears correctly, the labels render correctly, and the case still loads cleanly in the gallery and detail view.
