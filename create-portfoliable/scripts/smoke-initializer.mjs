// File: create-portfoliable/scripts/smoke-initializer.mjs
// Purpose: Smoke-test local initializer output by generating a project and validating built artifacts.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// MARK: PATH CONSTANTS
// Resolves package root used to execute initializer and downstream build commands.
const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// Defines isolated temporary workspace root used by the initializer smoke test.
const tempRoot = path.join(os.tmpdir(), 'portfoliable-initializer-smoke');
// Defines output directory where the generated sample app is created.
const generatedAppDir = path.join(tempRoot, 'my-portfolio');

// MARK: ERROR HANDLING
// Exits immediately with a prefixed smoke-test failure message.
function fail(message) {
  console.error(`[smoke:init] ${message}`);
  process.exit(1);
}

// MARK: COMMAND EXECUTION
// Runs an external command and stops the smoke test if the command exits non-zero.
function runOrFail(command, args, cwd, env = undefined) {
  // Executes child commands with inherited IO for transparent diagnostics.
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: env ? { ...process.env, ...env } : process.env
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

// MARK: ASSERTION HELPER
// Verifies bundle output contains expected markers proving starter template content is present.
function ensureContains(text, needle, description) {
  if (!text.includes(needle)) {
    fail(`Missing expected marker (${description}): ${needle}`);
  }
}

// Reads the create runtime dependency value from a generated app package.json.
function readGeneratedRuntimeDependency(appDir) {
  // Resolves generated package manifest path.
  const packageJsonPath = path.join(appDir, 'package.json');
  // Parses generated package manifest to inspect runtime dependency pin.
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson?.dependencies?.['@portfoliable/create'];
}

// Reads the local package version used as default runtime dependency baseline.
function readLocalPackageVersion() {
  // Resolves local create-portfoliable package manifest.
  const packageJsonPath = path.join(projectRoot, 'package.json');
  // Parses local package manifest and returns semantic version.
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
}

// MARK: SMOKE ORCHESTRATION
// Generates an app from the local initializer, builds it, and validates emitted artifacts/content.
function main() {
  console.log('[smoke:init] Preparing temp workspace...');
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });

  // Builds expected default runtime dependency from local package version.
  const expectedDefaultRuntimeDep = `^${readLocalPackageVersion()}`;

  console.log('[smoke:init] Verifying generated default runtime dependency (no override)...');
  runOrFail(
    'node',
    ['./bin/create-portfoliable.mjs', generatedAppDir, '--no-install', '--no-preview', '--no-interactive'],
    projectRoot
  );

  // Ensures scaffolded dependency follows package version when no override is provided.
  const generatedDefaultDep = readGeneratedRuntimeDependency(generatedAppDir);
  if (generatedDefaultDep !== expectedDefaultRuntimeDep) {
    fail(
      `Unexpected default runtime dependency: expected ${expectedDefaultRuntimeDep}, got ${String(generatedDefaultDep)}`
    );
  }

  // Cleans generated app before running existing integration/build path.
  fs.rmSync(generatedAppDir, { recursive: true, force: true });

  console.log('[smoke:init] Generating app from local initializer...');
  runOrFail(
    'node',
    ['./bin/create-portfoliable.mjs', generatedAppDir, '--no-preview', '--no-interactive'],
    projectRoot,
    { PORTFOLIABLE_RUNTIME_DEP: `file:${projectRoot}` }
  );

  console.log('[smoke:init] Building generated app...');
  runOrFail('npm', ['run', 'portfoliable-build'], generatedAppDir);

  // Resolves generated build assets directory.
  const distAssetsDir = path.join(generatedAppDir, 'dist', 'assets');
  if (!fs.existsSync(distAssetsDir)) {
    fail('dist/assets not found in generated app build output.');
  }

  // Reads generated asset filenames.
  const assets = fs.readdirSync(distAssetsDir);
  if (!assets.some((file) => file.endsWith('.avif'))) {
    fail('Expected at least one AVIF asset in generated app build output.');
  }

  // Resolves generated main bundle filename.
  const mainBundle = assets.find((file) => file.startsWith('index-') && file.endsWith('.js'));
  if (!mainBundle) {
    fail('Could not find generated app main bundle (index-*.js).');
  }

  // Loads generated main bundle text for starter content assertions.
  const bundleText = fs.readFileSync(path.join(distAssetsDir, mainBundle), 'utf8');
  ensureContains(bundleText, 'Making Portfoliable', 'starter case title');
  ensureContains(bundleText, 'Apple MacBook Air M5', 'starter model mapping');

  console.log('[smoke:init] Initializer smoke checks passed.');
}

main();