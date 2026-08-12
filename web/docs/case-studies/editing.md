# Editing an existing case study

Case edits are usually low-risk as long as you preserve the metadata contract and the route identity of the case.

## Safe changes

These are usually safe to do in a normal update:

- updating the title and summary copy
- revising the case body text
- updating read-time labels
- adjusting repository or demo links
- refining the thumbnail metadata while keeping the asset paths valid

## Changes that need extra care

These edits can affect deep links or content consistency:

- changing the case `id`
- changing localized `slugByLocale` values
- deleting or renaming a locale block
- changing visibility rules or protection settings without checking the runtime behavior

## Recommended workflow

1. open the case file in your content folder
2. update metadata first
3. revise the localized body content
4. check any associated thumbnail or share metadata
5. run validation
6. preview the generated portfolio locally

```bash
npm run validate:content
npm run build
npm run preview
```

## Good editing habits

- keep route slugs stable once a case is published
- preserve localized fields when a locale is still supported
- avoid large metadata rewrites in a single change if possible
- preview the home gallery and the case reader after significant edits

## What to check in the browser

After editing a case, review:

- the home grid card
- the case detail page
- localized metadata output
- any share or SEO fields tied to the case
- thumbnail rendering in the gallery

Small, focused edits are easier to review and less likely to create broken links.
