# Adding Case Studies

Add new case studies through the scaffold flow so metadata stays valid from the beginning.

## Create a new case

```bash
npm run scaffold:case -- --slug your-case-slug
```

This creates a markdown file under src/content/cases with starter frontmatter and content sections.

## Complete required frontmatter

Confirm these values exist before writing body content:

- id
- slug
- title.en and title.pt
- shortDesc.en and shortDesc.pt
- readTime.en and readTime.pt
- year.en and year.pt
- thumbCategory, thumbBrand, thumbModel, thumbColor

## Write your case content

Use language sections for content body:

```markdown
## English
Your English content.

## Portuguese
Seu conteudo em portugues.
```

## Validate before commit

```bash
npm run validate:content
```

Validation catches missing fields and malformed content contract values before build.
