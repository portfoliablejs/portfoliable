# Editing a case decorator

Case edits are usually safe as long as you preserve the case identity, metadata contract, and locale structure.

## Safe edits

These are low-risk updates:

- rewriting the narrative body copy
- adjusting summary text and summary markers
- refining the audio label and player settings
- updating repository or demo links
- revising thumbnail metadata so the gallery card looks better

## Edits that need extra care

These changes can break routes or confuse the reading experience:

- changing the case `id`
- changing locale slugs after the case is live
- removing a locale block that is still active
- turning off reader or navigator behavior without checking the layout

## Good editing workflow

1. open the case markdown file
2. review the metadata block first
3. update decorator fields as needed
4. check localized content and audio metadata
5. validate and preview locally

```bash
npm run validate:content
npm run build
npm run preview
```

## What to review in the browser

After editing a case, confirm:

- the home card still renders cleanly
- the summary content displays correctly
- the reader body is still readable
- the navigator still works when the case has headings
- any audio player appears only when it should
- the thumbnail metadata still matches the device catalog

Keep the decorator behavior intentional. A case should support the story, not fight it.
