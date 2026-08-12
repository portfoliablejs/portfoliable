#!/usr/bin/env node
// File: scripts/switch-valence-source.mjs
// Purpose: Switch installed valence source between declared npm range and local workspace path.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// MARK: MODE CONFIGURATION
const VALID_MODES = new Set(['status', 'local', 'npm']);

// MARK: PROCESS HELPERS
// Prints an error and exits immediately for invalid script states.
function fail(message) {
  console.error(message);
  process.exit(1);
}

// Runs a child process command and fails fast when the command exits non-zero.
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

// Reads and parses a JSON file with standardized error reporting.
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Failed to read JSON file: ${filePath}\n${error.message}`);
  }
}

// Reads declared valence dependency range from repository package metadata.
function getDeclaredRange(repoRoot) {
  const pkg = readJson(path.join(repoRoot, 'package.json'));
  const range = pkg?.dependencies?.['@portfoliablejs/valence'];
  if (!range) {
    fail('Missing dependency declaration for @portfoliablejs/valence in package.json');
  }
  return range;
}

// Detects currently installed valence mode (missing, npm package, or local link).
function getInstalledState(repoRoot) {
  const modulePath = path.join(repoRoot, 'node_modules', '@portfoliable', 'valence');

  if (!fs.existsSync(modulePath)) {
    return {
      installed: false,
      mode: 'missing',
      version: null,
      symlinkTarget: null,
    };
  }

  const stat = fs.lstatSync(modulePath);
  const symlinkTarget = stat.isSymbolicLink() ? fs.readlinkSync(modulePath) : null;
  const packageJsonPath = path.join(modulePath, 'package.json');
  const version = fs.existsSync(packageJsonPath) ? readJson(packageJsonPath).version : null;

  return {
    installed: true,
    mode: stat.isSymbolicLink() ? 'local-link' : 'npm-package',
    version,
    symlinkTarget,
  };
}

// Warns when required template exports are missing from installed valence source.
function warnIfTemplateExportsMissing(repoRoot) {
  const mainPath = path.join(repoRoot, 'node_modules', '@portfoliable', 'valence', 'src', 'main.js');
  if (!fs.existsSync(mainPath)) return;

  const source = fs.readFileSync(mainPath, 'utf8');
  const hasHomeViewExport = source.includes("./stories/templates/HomeView/HomeView.js");
  const hasPlayerViewExport = source.includes("./stories/templates/PlayerView/PlayerView.js");

  if (hasHomeViewExport && hasPlayerViewExport) return;

  console.warn('warning: installed @portfoliablejs/valence package is missing template exports required by create-portfoliable runtime (HomeView/PlayerView).');
  console.warn('warning: use npm run valence:local while developing until a published Valence version includes template exports.');
}

// Prints declared dependency and currently installed valence status information.
function printStatus(repoRoot, declaredRange) {
  const installed = getInstalledState(repoRoot);

  console.log(`declared range: ${declaredRange}`);
  if (!installed.installed) {
    console.log('installed: no');
    return;
  }

  console.log(`installed: yes (${installed.mode})`);
  if (installed.version) {
    console.log(`installed version: ${installed.version}`);
  }
  if (installed.symlinkTarget) {
    console.log(`local link target: ${installed.symlinkTarget}`);
  }

  warnIfTemplateExportsMissing(repoRoot);
}

// MARK: SOURCE SWITCH OPERATIONS
// Installs valence from a local filesystem path and refreshes compatibility assets.
function switchToLocal(repoRoot) {
  const localInput = process.env.VALENCE_LOCAL_PATH || '../../valence';
  const localPath = path.resolve(repoRoot, localInput);
  const localPackageJsonPath = path.join(localPath, 'package.json');

  if (!fs.existsSync(localPackageJsonPath)) {
    fail(`Could not find valence package.json at: ${localPackageJsonPath}`);
  }

  const localPkg = readJson(localPackageJsonPath);
  if (localPkg.name !== '@portfoliablejs/valence') {
    fail(`Expected package name @portfoliablejs/valence at ${localPackageJsonPath}, found ${localPkg.name || '(missing)'}`);
  }

  run('npm', ['install', `@portfoliablejs/valence@file:${localPath}`, '--no-save']);
  run('npm', ['run', 'ensure:valence']);
}

// Installs valence from the declared npm range and refreshes compatibility assets.
function switchToNpm(declaredRange) {
  run('npm', ['install', `@portfoliablejs/valence@${declaredRange}`, '--no-save']);
  run('npm', ['run', 'ensure:valence']);
}

// MARK: SCRIPT ENTRYPOINT
// Routes CLI mode selection for status reporting and source switching.
function main() {
  const mode = process.argv[2] || 'status';
  if (!VALID_MODES.has(mode)) {
    fail('Usage: node ./scripts/switch-valence-source.mjs [status|local|npm]');
  }

  const repoRoot = process.cwd();
  const declaredRange = getDeclaredRange(repoRoot);

  if (mode === 'status') {
    printStatus(repoRoot, declaredRange);
    return;
  }

  if (mode === 'local') {
    switchToLocal(repoRoot);
    printStatus(repoRoot, declaredRange);
    return;
  }

  switchToNpm(declaredRange);
  printStatus(repoRoot, declaredRange);
}

main();
