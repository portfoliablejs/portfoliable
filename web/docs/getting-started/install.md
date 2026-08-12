# Install and create a portfolio project

This is the starting point for every new Portfoliable project.

## Requirements

Before creating a project, make sure your machine has:

- Node.js 18 or newer
- npm available in your terminal
- a writable local folder where the project will be created
- internet access so npm can download the initializer and dependency packages

Check your versions:

```bash
node -v
npm -v
```

If both commands return a version, you are ready to continue.

## Create a project

Run the initializer from a folder where you want the project to live:

```bash
npm create portfoliable my-portfolio
```

You can replace `my-portfolio` with your own project name. If the target folder does not exist, the initializer creates it. If it already exists, the initializer may ask before overwriting files.

You can also skip install during scaffolding if needed:

```bash
npm create portfoliable my-portfolio -- --no-install
```

And if the folder already exists and you want to overwrite, use:

```bash
npm create portfoliable my-portfolio -- --force
```

## Move into the new project

```bash
cd my-portfolio
```

## Install dependencies

If you used `--no-install`, install manually:

```bash
npm install
```

## Start the local app

```bash
npm run portfoliable
```

This starts the development server and opens the app in the browser by default. The app validates content and protection rules before the dev session becomes active.

## Useful startup flags

If you want to prevent the browser from opening automatically:

```bash
npm run portfoliable -- --no-open
```

If you want to force the command guide to appear after startup:

```bash
npm run portfoliable -- --commands
```

If you want to suppress the command guide entirely:

```bash
npm run portfoliable -- --no-commands
```

## What you should expect on first run

The first dev run typically does three things:

1. starts the Vite development server
2. loads the generated project content and config
3. checks that case metadata and protection config are valid before continuing

If you are using a non-interactive terminal, the create flow skips prompt-based interaction automatically.

## Generated scripts you will use most often

In the generated project, these are the core scripts:

```bash
npm run portfoliable
npm run build
npm run preview
npm run validate:content
npm run portfoliable-create-case -- --name "Your Case"
npm run portfoliable-thumbnail-options
npm run add:language -- --code es --name Español --html-lang es-ES
```

You do not need to understand every command immediately. The important thing is that the generated project gives you a complete local workflow for building, validating, and previewing your portfolio.

## Next step

Continue to the quickstart to go from a fresh project to a complete first case and preview.

- [Quickstart](./quickstart)
- [Configuration](../guides/configuration)
