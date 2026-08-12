# Case decorators overview

Portfoliable treats each case as a structured content object with optional decorators that change how the case behaves in the reader, home gallery, and public share flows.

## What a decorator is

A case decorator is a configuration or content layer that modifies a case without changing the underlying story. In Portfoliable, the main decorators are:

- reader content and body layout
- summary panel and key takeaways
- navigation/controller behavior
- audio player and audio summary
- device-thumbs and catalog-based presentation

These options are not separate apps. They are different ways of shaping the same case.

## The decorator model

The generated case structure uses a metadata contract plus localized markdown blocks. The same case can be:

- fully reader-driven
- summary-only for a quick scan
- audio-enabled for a spoken summary
- gallery-optimized with a device frame and thumbnail metadata

The most common decorators are managed directly in the case markdown file.

## Standard case decorators

### Summary decorator

The summary decorator displays a compact overview of the case and is useful for quick scanning in the home experience or executive review flows.

You can enable or disable summary rendering and adjust what appears inside it.

### Reader decorator

The reader decorator controls the long-form article body. It determines if the case is read as a full narrative, a shorter summary, or a locked-down reader experience.

### Navigator decorator

The navigator/controller controls the case UI chrome, in-page controls, and article navigation. Keep this enabled when a case has structured sections and the user benefits from moving through them.

### Audio decorator

The audio decorator adds a localized player for spoken summaries. This is often used for product launches, investor-facing stories, or accessible reading alternatives.

### Thumbnail decorator

Thumbnail metadata decorates the case card with a device frame and layout profile. This is the main visual shell for case tiles in the portfolio gallery.

## The real CLI for device inspection

If you want to inspect the device catalog values the runtime supports, use:

```bash
npm run portfoliable-thumbnail-options
npm run portfoliable-thumbnail-options -- --full
npm run portfoliable-thumbnail-options -- --json
```

These commands list the supported device combinations and help you match the case metadata to a valid `thumbCategory`, `thumbBrand`, `thumbModel`, and `thumbColor` combination.

## Recommended workflow

1. Create the case.
2. Fill in metadata and localized copy.
3. Choose the reader and summary behavior.
4. Decide if the case needs audio.
5. Set the thumbnail metadata or custom thumbnail source.
6. Validate and preview locally.

```bash
npm run validate:content
npm run build
npm run preview
```

## Good default pattern

Use the smallest decorator set that clearly supports the case:

- short cases may not need a large summary block
- archive or research cases may prefer a compact reader without heavy audio
- launch cases often benefit from summary + audio + device thumbnail visuals

A strong case decorator setup keeps the portfolio interesting without making the reading experience noisy.
