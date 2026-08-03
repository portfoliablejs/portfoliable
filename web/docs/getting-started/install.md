# Install

Use Node 18 or later.

## Create a project

```bash
npm create @portfoliable
```

Follow the prompts and then move into the generated project folder.

## Install dependencies

```bash
npm install
```

## Start local development

```bash
npm run dev
```

The app runs with live reload and validates content contracts before dev/build scripts execute.

<div class="docs-callout">
  <strong>Maintainer note</strong>
  <p>
    In the monorepo itself, root scripts forward to create-portfoliable scripts.
    End users should use the generated project scripts directly.
  </p>
</div>
