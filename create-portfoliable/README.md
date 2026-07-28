# create-portfoliable

CLI initializer used by `npm create portfoliable@latest`.

Important:
- Run `npm create portfoliable@latest`, not `npm run create portfoliable@latest`.

## Usage

```bash
npm create portfoliable@latest my-portfolio
cd my-portfolio
```

By default, the initializer installs dependencies and starts the preview server immediately so you can inspect the starter app without running another command.

Important:
- This initializer generates a project that depends on `@portfoliablejs/portfoliable` from npm.
- Ensure `@portfoliablejs/portfoliable` and `@portfoliablejs/valence` are publicly installable on npm.
- The starter app stores editable markdown cases in `src/content/cases/` and loads them into the gallery automatically.
- A fresh app includes 4 starter markdown cases and local thumbnail frame assets in `src/assets/devices/`.
- The starter app keeps its markdown parser local to the generated template so the initializer stays self-contained.

Generated scripts:
- `npm run portfoliable`
- `npm run portfoliable-build`
- `npm run build-portfoliable`
- `npm run portfoliable-preview`
- `npm run preview-portfoliable`
- `npm run portfoliable-scaffold-data`
- `npm run scaffold-data-portfoliable`
- `npm run portfoliable-scaffold-case`
- `npm run scaffold-case-portfoliable`

Optional flags:

```bash
npm create portfoliable@latest my-portfolio -- --no-install
npm create portfoliable@latest my-portfolio -- --force
npm create portfoliable@latest my-portfolio -- --no-preview
```

## Generated commands

- `npm run portfoliable`
- `npm run portfoliable-build`
- `npm run portfoliable-preview`
- `npm run portfoliable-scaffold-data`
- `npm run portfoliable-scaffold-case`
