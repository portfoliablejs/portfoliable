#!/usr/bin/env node
// File: create-portfoliable/bin/create-portfoliable.mjs
// Purpose: Create a new Portfoliable consumer app from starter templates.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ui,
  printRailSegment,
  isInteractiveTerminal,
  promptFancyDotsPreference,
  readProjectUiPreferences,
  writeProjectUiPreferences
} from '../scripts/terminal-ui.mjs';

// MARK: DEFAULTS
// Defines default target folder when no project name is provided.
const DEFAULT_TARGET = 'my-portfolio';

// MARK: CLI DISPLAY HELPERS
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

// MARK: ARGUMENT PARSING
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

    if (arg === '--no-interactive') {
      options.interactive = false;
      continue;
    }

    if (arg === '--interactive') {
      options.interactive = true;
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
  console.log('Usage: npm create @portfoliable [project-name] [-- --force] [-- --no-install] [-- --no-preview] [-- --no-dev] [-- --no-interactive]');
  console.log('');
  console.log('Options:');
  console.log('  --force       Create in a non-empty directory');
  console.log('  --no-install  Skip npm install');
  console.log('  --no-preview  Skip auto-starting live preview (compat alias for --no-dev)');
  console.log('  --no-dev      Skip auto-starting live preview');
  console.log('  --no-interactive  Disable first-run interactive prompts');
  console.log('  --interactive     Force first-run interactive prompts when TTY is available');
}

// MARK: NAME AND PATH HELPERS
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

// MARK: INITIALIZER ORCHESTRATION
// Executes full scaffold flow: parse options, create files, install deps, and optional launch.
async function run() {
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
  // Resolves current terminal interaction policy.
  const interactiveEnabled = options.interactive !== false;

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
        dev: 'portfoliable dev',
        build: 'portfoliable build',
        preview: 'portfoliable preview',
        'validate:content': 'node ./scripts/validate-content.mjs',
        'validate:protection': 'node ./scripts/validate-protection.mjs',
        'convert:audio': 'node ./scripts/convert-wav-to-mp3.mjs',
        'convert:video': 'node ./scripts/convert-video-to-mp4.mjs',
        'password:hash': 'node ./scripts/generate-password-hash.mjs',
        'create:case': 'node ./scripts/scaffold-case.mjs',
        'delete:case': 'node ./scripts/delete-case.mjs',
        'sync:locales': 'node ./scripts/sync-locales.mjs',
        'sync:locales:watch': 'node ./scripts/sync-locales.mjs --watch',
        'add:language': 'node ./scripts/add-language.mjs',
        'delete:language': 'node ./scripts/delete-language.mjs',
        'portfoliable-build': 'portfoliable build',
        'portfoliable-preview': 'portfoliable preview',
        'portfoliable-thumbnail-options': 'portfoliable thumbnail-options',
        'portfoliable-create-case': 'portfoliable create-case',
        'portfoliable-delete-case': 'portfoliable delete-case',
        'portfoliable-sync-locales': 'portfoliable sync-locales'
      },
      dependencies: {
        '@portfoliablejs/valence': '^1.0.0-alpha',
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
  copyTemplateDirectory(templateRoot, 'scripts', targetDir);
  copyTemplateDirectory(templateRoot, path.join('src', 'content'), targetDir);
  copyTemplateDirectory(templateRoot, 'configs', targetDir);
  copyTemplateDirectory(templateRoot, 'public', targetDir);
  copyTemplateTree(templateRoot, 'README.md', targetDir);

  printRailSegment();
  printRailSegment({ dot: true, label: `${color('36', 'Creating project structure...')}` });
  console.log(color('36', `Created ${projectName} at ${targetDir}`));

  const existingPreferences = readProjectUiPreferences(targetDir);
  const isFirstRun = !existingPreferences;
  let fancyDots = existingPreferences?.fancyDots ?? true;

  if (isFirstRun) {
    if (interactiveEnabled && isInteractiveTerminal()) {
      printRailSegment();
      printRailSegment({ dot: true, label: `${ui.dim}First-time setup${ui.reset}` });
      fancyDots = await promptFancyDotsPreference({
        question: 'Use decorative terminal lines and dots in this project?',
        defaultValue: true,
        width: 86
      });
    } else {
      console.log(color('33', 'Interactive first-run selection skipped (non-interactive terminal).'));
    }

    writeProjectUiPreferences(targetDir, fancyDots);
    console.log(color('36', `Saved terminal UI preference: ${fancyDots ? 'decorative' : 'simple'}.`));
  }

  if (!options.install) {
    console.log(color('33', 'Skipped npm install (--no-install).'));
    console.log(`Next steps:\n  cd ${options.target}\n  npm install\n  npm run portfoliable`);
    console.log(color('36', 'After launch, Portfoliable will ask if you want to open the command guide.'));
    return;
  }

  printRailSegment();
  printRailSegment({ dot: true, label: `${color('36', 'Installing dependencies...')}` });
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
  printRailSegment({ dot: true, label: `${color('32', 'Dependencies installed.')}` });
  console.log(color('36', 'Command guide is available after launch via interactive prompt.'));

  if (options.launch) {
    printRailSegment();
    printRailSegment({ dot: true, label: `${color('36', 'Preparing first build...')}` });
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

    printRailSegment({ dot: true, label: `${color('32', 'Starter build complete.')}` });
    console.log(color('36', 'Launching development server (auto-opens in browser)...'));
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

// MARK: SCRIPT ENTRYPOINT
// Executes initializer orchestration.
run().catch((error) => {
  console.error(color('31', error?.stack || String(error)));
  process.exit(1);
});
