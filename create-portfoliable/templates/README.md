# Portfoliable user manual

This is the short end-user guide for a project created with:

```bash
npm create portfoliable@latest
# or
npm create portfoliable
```

Use it after scaffolding to run, edit, validate, and publish your portfolio.

For a more detailed user-manual, please visit the official [Portfoliable documentation](https://www.portfoliable.js.org/docs/)

## 1. Create and run a project

```bash
npm create portfoliable@latest my-portfolio
# or
npm create portfoliable my-portfolio
cd my-portfolio
npm run portfoliable
```

The app starts in local development mode and opens the browser by default.

## 2. Main commands

```bash
npm run portfoliable
npm run build
npm run preview
npm run validate:content
npm run convert:audio
npm run convert:video
npm run portfoliable-create-case -- --name "My First Case"
npm run add:language -- --code es --name Español --html-lang es-ES
npm run portfoliable-thumbnail-options
```

## 3. Generated project structure

A generated project usually includes:

- `src/content/cases/` for case markdown files
- `src/content/about/` for About content
- `configs/` for runtime and locale configuration
- `public/` for static assets and backend endpoints

## 4. Create and edit a case

```bash
npm run portfoliable-create-case -- --name "My Case"
```

Each case should include:

- a stable `id`
- localized `title` and `shortDesc`
- valid thumbnail metadata
- readable localized markdown sections
- correct share and link metadata when needed

Example:

```md
<!-- lang:en -->
## Project context
This is the English case body.

<!-- lang:pt -->
## Contexto do projeto
Este é o corpo do caso em português.
```

## 5. Add and remove languages

To add a language, you can use the following command:

```bash
npm run add:language -- --code es --name Español --html-lang es-ES
```

To add locale-specific languages, you can use `--rtl` or `--ltf`, which will set the `dir` to left-to-right or right-to-left.

```bash
npm run add:language -- --code ar --name العربية --html-lang ar-SA --rtl
npm run add:language -- --code it --name Italiano --html-lang it-IT --ltr
```

To remove a locale, use:

```bash
npm run delete:language -- --code es
```

You can also delete a default locale using:

```bash
npx portfoliable delete-language --code es --force 
```

Then fill in translated metadata and content blocks for the new locale.

## 6. Thumbnail device catalog

Inspect supported device combinations:

```bash
npm run portfoliable-thumbnail-options
npm run portfoliable-thumbnail-options -- --full
npm run portfoliable-thumbnail-options -- --json
```

Use the generated tuple in your case config, for example:

```text
thumbCategory=mobile thumbBrand=apple thumbModel=Apple iPhone 15 thumbColor=Black
```

## 7. Validate before shipping

```bash
npm run validate:content
npm run build
npm run preview
```

Validate early so missing metadata and broken locale sections are caught before production builds.

## 8. Protected cases

If a case needs a secure unlock flow, configure the backend endpoint in your app config and keep the real secret server-side.

Do not store passwords directly in markdown files.

### The setup flow

1. Mark the case as protected in its frontmatter:

```js
{
  id: 'mobile-product-launch',
  isProtected: true
}
```

2. Keep the unlock endpoint in the generated project config:

```js
export default {
  protection: {
    unlockEndpoint: '/api/unlock-case.php'
  }
};
```

3. Copy the example backend config into your project and add a hash for each protected case:

```bash
cp public/api/password.config.example.json public/api/password.config.json
```

Then add a record like:

```json
{
  "cases": {
    "mobile-product-launch": {
      "hash": "$argon2id$v=19$m=65536,t=4,p=1$...generated-hash..."
    }
  }
}
```

4. Generate a secure password hash:

```bash
npm run password:hash -- --case-id mobile-product-launch --password "your-secret"
```

5. Keep the real file private and protected by the server rules in `public/api/.htaccess`.

### Important protections

- `public/api/password.config.json` should stay out of git
- the app should unlock the case only through the PHP endpoint
- the unlock response should be treated as non-cacheable
- frontend markdown is never the place to keep the real secret

When a protected case loads, the app prompts for a passcode before revealing the locked content.

## 9. Useful behavior to know

- the home view renders case cards from metadata
- cases support localized routes and localized metadata
- the app supports visibility rules for web, crawler, and AI exposure
- the reader can include summaries, audio, table of contents, and navigation controls

## 10. Convert WAV files to MP3

If you keep narration or voice assets as WAV while editing, you can convert them to MP3 before shipping:

```bash
npm run convert:audio
```

This command scans your project for `.wav` files and writes `.mp3` files in the same folders.

Use this optional flag to target one directory:

```bash
npm run convert:audio -- --dir public/audio
```

`ffmpeg` is required (on macOS: `brew install ffmpeg`).

## 11. Convert videos to MP4

If you keep source footage in mixed formats while editing, you can convert videos to MP4 before shipping:

```bash
npm run convert:video
```

This command scans your project for video files (for example `.mov`, `.mkv`, `.avi`, `.webm`) and writes `.mp4` files in the same folders.

Use this optional flag to target one directory:

```bash
npm run convert:video -- --dir public/video
```

Use `--force` to overwrite existing `.mp4` outputs:

```bash
npm run convert:video -- --dir public/video --force
```

`ffmpeg` is required (on macOS: `brew install ffmpeg`).

This is the user-facing contract. For maintainer internals, use the repository root README instead.
