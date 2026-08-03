#!/usr/bin/env node
// File: create-portfoliable/bin/create-portfoliable.mjs
// Purpose: Create a new Portfoliable consumer app from starter templates.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// === DEFAULTS ===
// Defines default target folder when no project name is provided.
const DEFAULT_TARGET = 'my-portfolio';

// === CLI DISPLAY HELPERS ===
// Wraps a message with ANSI color code and reset sequence.
function color(code, message) {
  return `\x1b[${code}m${message}\x1b[0m`;
}

// Resolves runtime dependency version for generated app package.json.
function resolveRuntimeDependencyVersion(currentFilePath) {
  // Allows explicit overrides for local integration and smoke tests.
  const override = process.env.PORTFOLIABLE_RUNTIME_DEP;
  if (override) {
    return override;
  }

  try {
    // Resolves published package manifest adjacent to this bin entrypoint.
    const packageJsonPath = path.resolve(path.dirname(currentFilePath), '..', 'package.json');
    // Reads package version to keep scaffolded dependency aligned with published artifact.
    const packageVersion = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))?.version;
    if (typeof packageVersion === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(packageVersion)) {
      return `^${packageVersion}`;
    }
  } catch {
    // Falls back below with warning to avoid hardcoded stale versions.
  }

  console.warn(
    color(
      '33',
      'Warning: could not resolve package version for @portfoliable/create default dependency. Falling back to latest.'
    )
  );
  return 'latest';
}

// === ARGUMENT PARSING ===
// Parses initializer arguments and returns normalized options.
function parseArgs(argv) {
  // Extracts runtime args excluding node executable and script path.
  const args = argv.slice(2);
  // Initializes parser defaults.
  const options = {
    target: DEFAULT_TARGET,
    force: false,
    install: true,
    launch: true
  };

  // Iterates all user-provided CLI flags and positional values.
  for (let i = 0; i < args.length; i += 1) {
    // Reads the current token under evaluation.
    const arg = args[i];

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--no-install') {
      options.install = false;
      continue;
    }

    if (arg === '--no-preview') {
      options.launch = false;
      continue;
    }

    if (arg === '--no-dev') {
      options.launch = false;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (!arg.startsWith('-') && options.target === DEFAULT_TARGET) {
      options.target = arg;
    }
  }

  return options;
}

// Prints help/usage text for initializer flags.
function printHelp() {
  console.log('Usage: npm create @portfoliable [project-name] [-- --force] [-- --no-install] [-- --no-preview] [-- --no-dev]');
  console.log('');
  console.log('Options:');
  console.log('  --force       Create in a non-empty directory');
  console.log('  --no-install  Skip npm install');
  console.log('  --no-preview  Skip auto-starting live preview (compat alias for --no-dev)');
  console.log('  --no-dev      Skip auto-starting live preview');
}

// Prints command reference box shown after scaffolding.
function printCommandsBox() {
  // Defines fixed width for terminal output box formatting.
  const width = 86;
  // Creates one boxed line with padded content.
  const line = (text = '') => `│ ${text.padEnd(width - 4)} │`;

  console.log('╭' + '─'.repeat(width - 2) + '╮');
  console.log(line('Available commands'));
  console.log(line());
  console.log(line('[Start]'));
  console.log(line('  npm run portfoliable'));
  console.log(line());
  console.log(line('[Build and Preview]'));
  console.log(line('  npm run portfoliable-build'));
  console.log(line('  npm run portfoliable-preview'));
  console.log(line());
  console.log(line('[Thumbnail Catalog]'));
  console.log(line('  npm run portfoliable-thumbnail-options'));
  console.log(line('  npm run portfoliable-thumbnail-options -- --full'));
  console.log(line('  npm run portfoliable-thumbnail-options -- --json'));
  console.log(line());
  console.log(line('[Create Content]'));
  console.log(line('  npm run portfoliable-create-case'));
  console.log(line('  npm run portfoliable-scaffold-case'));
  console.log(line('  npx portfoliable create-case --name "My New Case"'));
  console.log('╰' + '─'.repeat(width - 2) + '╯');
}

// === NAME AND PATH HELPERS ===
// Converts a freeform project name into npm-safe package name format.
function sanitizePackageName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-portfolio';
}

// Returns true when a directory does not exist or contains no meaningful files.
function isDirectoryEmpty(dirPath) {
  if (!fs.existsSync(dirPath)) return true;
  // Ignores macOS metadata file when checking emptiness.
  const files = fs.readdirSync(dirPath).filter((entry) => entry !== '.DS_Store');
  return files.length === 0;
}

// Copies one template file, applying optional text transforms before writing.
function writeFileFromTemplate(templateRoot, relativePath, targetRoot, transforms = []) {
  // Resolves template source file path.
  const sourcePath = path.join(templateRoot, relativePath);
  // Resolves destination file path in target project.
  const destinationPath = path.join(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

  // Reads source file content for transform pipeline.
  let content = fs.readFileSync(sourcePath, 'utf8');
  // Applies each provided content transform sequentially.
  for (const transform of transforms) {
    content = transform(content);
  }

  fs.writeFileSync(destinationPath, content, 'utf8');
}

// Writes .gitignore from template fallback names to final destination.
function writeGitignoreTemplate(templateRoot, targetRoot) {
  // Defines acceptable template filenames used for gitignore source.
  const candidates = ['.gitignore', 'gitignore'];

  // Selects first existing candidate and writes it as .gitignore.
  for (const candidate of candidates) {
    // Resolves candidate template path.
    const sourcePath = path.join(templateRoot, candidate);
    if (!fs.existsSync(sourcePath)) continue;

    // Resolves destination .gitignore path.
    const destinationPath = path.join(targetRoot, '.gitignore');
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, fs.readFileSync(sourcePath, 'utf8'), 'utf8');
    return;
  }

  throw new Error('Missing gitignore template file in create-portfoliable package.');
}

// Copies a required template file path as-is.
function copyTemplateTree(templateRoot, relativePath, targetRoot) {
  // Resolves source template path.
  const sourcePath = path.join(templateRoot, relativePath);
  // Resolves destination path in output project.
  const destinationPath = path.join(targetRoot, relativePath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing template file: ${sourcePath}`);
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, fs.readFileSync(sourcePath, 'utf8'), 'utf8');
}

// Recursively copies a template directory tree into target project.
function copyTemplateDirectory(templateRoot, relativeDirPath, targetRoot) {
  // Resolves source directory path.
  const sourceDir = path.join(templateRoot, relativeDirPath);
  // Resolves destination directory path.
  const destinationDir = path.join(targetRoot, relativeDirPath);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Missing template directory: ${sourceDir}`);
  }

  fs.mkdirSync(destinationDir, { recursive: true });

  // Iterates source directory entries for recursive copy.
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    // Resolves source entry path.
    const sourcePath = path.join(sourceDir, entry.name);
    // Resolves destination entry path.
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyTemplateDirectory(templateRoot, path.join(relativeDirPath, entry.name), targetRoot);
      continue;
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

// === INITIALIZER ORCHESTRATION ===
// Executes full scaffold flow: parse options, create files, install deps, and optional launch.
function run() {
  // Parses command-line options.
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Resolves current working directory.
  const cwd = process.cwd();
  // Resolves current script path for template root discovery.
  const currentFile = fileURLToPath(import.meta.url);
  // Derives human-facing project name from target path.
  const projectName = path.basename(options.target);
  // Derives npm-safe package name.
  const packageName = sanitizePackageName(projectName);
  // Resolves absolute target output directory.
  const targetDir = path.resolve(cwd, options.target);
  // Resolves runtime dependency version for generated app dependencies.
  const runtimeDependencyVersion = resolveRuntimeDependencyVersion(currentFile);

  if (!options.force && !isDirectoryEmpty(targetDir)) {
    console.error(color('31', `Refusing to create in non-empty directory: ${targetDir}`));
    console.error(color('33', 'Use --force if you want to continue.'));
    process.exit(1);
  }

  // Ensures target directory exists before writing scaffold files.
  fs.mkdirSync(targetDir, { recursive: true });

  // Resolves template root directory bundled with create-portfoliable.
  const templateRoot = path.resolve(path.dirname(currentFile), '..', 'templates');

  // Builds generated package.json content for consumer app.
  const packageJsonTemplate = JSON.stringify(
    {
      name: packageName,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        portfoliable: 'portfoliable dev',
        'portfoliable-build': 'portfoliable build',
        'portfoliable-preview': 'portfoliable preview',
        'portfoliable-thumbnail-options': 'portfoliable thumbnail-options',
        'portfoliable-create-case': 'portfoliable create-case',
        'portfoliable-scaffold-case': 'node ./scripts/scaffold-case.mjs'
      },
      dependencies: {
        '@portfoliablejs/valence': '^0.1.0',
        '@portfoliable/create': runtimeDependencyVersion
      }
    },
    null,
    2
  );

  // Writes generated package.json to target project.
  fs.writeFileSync(path.join(targetDir, 'package.json'), `${packageJsonTemplate}\n`, 'utf8');

  writeGitignoreTemplate(templateRoot, targetDir);
  writeFileFromTemplate(templateRoot, 'index.html', targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'main.js'), targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'cases', 'index.js'), targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'parser', 'markdown.js'), targetDir);
  // Resolves optional template assets directory.
  const templateAssetsDir = path.join(templateRoot, 'src', 'assets');
  // Copies assets directory when present.
  if (fs.existsSync(templateAssetsDir) && fs.statSync(templateAssetsDir).isDirectory()) {
    copyTemplateDirectory(templateRoot, path.join('src', 'assets'), targetDir);
  }
  copyTemplateTree(templateRoot, path.join('scripts', 'scaffold-case.mjs'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'mobile-product-launch.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'mobile-checkout-flow.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'compact-research-archive.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'wearable-companion.md'), targetDir);

  // Generates starter README content in the scaffolded project.
  const readme = `# ${projectName}\n\nCreated with @portfoliable/create.\n\n## Where to edit cases\n\n- Add or update markdown cases in \`src/content/cases/\`\n- Each \`.md\` file becomes a gallery item and updates in the browser during \`npm run portfoliable\`\n- Device frames are resolved from the installed Valence catalog\n\n## Commands\n\n### Start\n\n- npm run portfoliable\n\n### Build and Preview\n\n- npm run portfoliable-build\n- npm run portfoliable-preview\n\n### Thumbnail Catalog\n\n- npm run portfoliable-thumbnail-options\n- npm run portfoliable-thumbnail-options -- --full\n- npm run portfoliable-thumbnail-options -- --json\n\n### Create Content\n\n- npm run portfoliable-create-case\n- npm run portfoliable-scaffold-case\n- npx portfoliable create-case --name \"My New Case\"\n`;
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme, 'utf8');

  console.log(color('36', `Created ${projectName} at ${targetDir}`));

  if (!options.install) {
    console.log(color('33', 'Skipped npm install (--no-install).'));
    printCommandsBox();
    console.log(`Next steps:\n  cd ${options.target}\n  npm install\n  npm run portfoliable`);
    return;
  }

  console.log(color('36', 'Installing dependencies...'));
  // Runs npm install in newly scaffolded project.
  const installResult = spawnSync('npm', ['install'], {
    cwd: targetDir,
    stdio: 'inherit'
  });

  if (installResult.status !== 0) {
    console.error(color('31', 'npm install failed. Run it manually in the new project folder.'));
    process.exit(installResult.status || 1);
  }

  console.log(color('32', 'Setup complete.'));

  printCommandsBox();

  if (options.launch) {
    console.log(color('36', 'Building starter app...'));
    // Executes initial production build to validate scaffold output.
    const buildResult = spawnSync('npm', ['run', 'portfoliable-build'], {
      cwd: targetDir,
      stdio: 'inherit'
    });

    if (buildResult.status !== 0) {
      console.error(color('31', 'Build failed. Run npm run portfoliable-build manually to inspect issues.'));
      process.exit(buildResult.status || 1);
    }

    console.log(color('36', 'Launching live preview (auto-opens in browser)...'));
  // Starts development server with auto-open for immediate verification.
    const devResult = spawnSync('npm', ['run', 'portfoliable', '--', '--open'], {
      cwd: targetDir,
      stdio: 'inherit'
    });

    if (devResult.status !== 0) {
      process.exit(devResult.status || 1);
    }
    return;
  }

  console.log(`Next steps:\n  cd ${options.target}\n  npm run portfoliable`);
}

// Executes initializer orchestration.
run();
