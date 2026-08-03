# Versioning

Portfoliable separates website delivery from npm package delivery.

## Two tracks

- Package track: publishes npm artifacts and release tags.
- Web track: publishes marketing/docs static output to GitHub Pages.

## Package semantics

For package releases, use conventional version bumps:

- major for breaking changes
- minor for new backward-compatible features
- patch for fixes and maintenance

## Web semantics

The website can ship independently whenever docs, marketing copy, or content structure changes.

<ds-divider></ds-divider>

## Recommendation

Treat docs changes like product changes:

1. Use pull requests with review.
2. Keep changeset notes in changelog updates.
3. Publish via web release workflow once merged.
