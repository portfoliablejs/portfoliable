# create-portfoliable

Create a Portfoliable project from the command line.

## Quick start

```bash
npm create portfoliable@latest my-site
# or
npx create-portfoliable my-site
```

## What it does

- scaffolds a new Portfoliable portfolio app
- installs the runtime dependencies needed for the generated project
- configures the project structure and base files
- provides a local dev, build, and preview workflow
- publishes the canonical package to npm.org and a scoped alias to GitHub Packages

## Documentation

- Repo: https://github.com/portfoliablejs/portfoliable
- Package: https://www.npmjs.com/package/create-portfoliable

## Publishing

This package is released only through the repository workflow. The canonical npm.org identity is `create-portfoliable`, which preserves `npm create portfoliable@latest`. The same version and payload are also published to GitHub Packages as `@portfoliablejs/create-portfoliable`, because GitHub's npm registry requires scoped names.

The registries are separate publish targets; publishing to one does not mirror to the other. The release workflow checks each registry before publishing and provides manual recovery modes for a version missing from GitHub Packages or a tagged release missing from npm.org.

## License

MIT

Normal maintainers do not publish this package locally.
