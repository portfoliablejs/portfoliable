# Audio summaries

The audio decorator adds spoken summary support to a case. This is useful for product launches, accessible reading experiences, and richer storytelling when a case deserves a more cinematic presentation.

## Where the audio settings live

In the case metadata, use:

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

## When to use it

Use audio when the case benefits from:

- a spoken version of the overview
- accessibility support for long-form content
- a polished executive or launch narrative

Do not add audio to every case. It should feel intentional and supportive rather than decorative.

## Recommended setup flow

1. add the audio asset to the case folder
2. assign localized `audioSrc` values
3. set `audioLabel` for each active locale
4. set `showPlayer` to `true`
5. validate and preview the case

```bash
npm run validate:content
npm run build
npm run preview
```

## Best practices

- keep the same audio source for locales that share the same spoken content
- provide a label for each active language
- prefer stable paths and well-named files
- test actual playback in the browser before shipping

Audio is a case decorator, not a replacement for the actual article. It should complement the written story.
