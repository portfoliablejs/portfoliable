// File: create-portfoliable/scripts/smoke-packed.mjs
// Purpose: Smoke-test npm-packed initializer artifact by generating and building a consumer app.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// MARK: PATH CONSTANTS
// Resolves package root used for packing and command execution.
const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// Defines isolated temporary root used for packed-artifact smoke runs.
const tempRoot = path.join(os.tmpdir(), 'portfoliable-packed-smoke');
// Defines generated application output path.
const generatedAppDir = path.join(tempRoot, 'my-portfolio');

// MARK: ERROR HANDLING
// Exits immediately with a prefixed packed-smoke failure message.
function fail(message) {
  console.error(`[smoke:packed] ${message}`);
  process.exit(1);
}

// MARK: COMMAND EXECUTION HELPERS
// Runs external commands with inherited IO and fails on non-zero status.
function runOrFail(command, args, cwd, env = undefined) {
  // Executes child command with inherited terminal output.
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

// Runs external commands while capturing stdout/stderr, used for JSON-producing commands.
function runCaptureOrFail(command, args, cwd) {
  // Executes command while capturing stdout/stderr for parser use.
  const result = spawnSync(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    // Captures stderr text to enrich failure diagnostics.
    const stderr = (result.stderr || '').trim();
    fail(`Command failed: ${command} ${args.join(' ')}${stderr ? `\n${stderr}` : ''}`);
  }

  return (result.stdout || '').trim();
}

// MARK: ASSERTION HELPER
// Verifies the generated bundle contains expected content markers.
function ensureContains(text, needle, description) {
  if (!text.includes(needle)) {
    fail(`Missing expected marker (${description}): ${needle}`);
  }
}

// Reads create runtime dependency from generated app package.json.
function readGeneratedRuntimeDependency(appDir) {
  // Resolves generated package manifest path.
  const packageJsonPath = path.join(appDir, 'package.json');
  // Parses generated package manifest to inspect runtime dependency version.
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson?.dependencies?.['@portfoliable/create'];
}

// Reads local package version used as expected default dependency baseline.
function readLocalPackageVersion() {
  // Resolves local package manifest.
  const packageJsonPath = path.join(projectRoot, 'package.json');
  // Parses package version string from local manifest.
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
}

// MARK: PACK RESOLUTION
// Builds an npm tarball and resolves the exact file path returned by npm pack.
function resolveTarballPath() {
  // Runs npm pack and captures JSON output.
  const packOutput = runCaptureOrFail('npm', ['pack', '--json'], projectRoot);
  let parsed;

  try {
    parsed = JSON.parse(packOutput);
  } catch {
    fail(`Could not parse npm pack --json output: ${packOutput}`);
  }

  // Extracts returned tarball filename from npm pack JSON payload.
  const filename = parsed?.[0]?.filename;
  if (!filename) {
    fail('npm pack did not return a tarball filename.');
  }

  // Resolves tarball absolute path on disk.
  const tarballPath = path.join(projectRoot, filename);
  if (!fs.existsSync(tarballPath)) {
    fail(`Packed tarball not found: ${tarballPath}`);
  }

  return tarballPath;
}

// MARK: SMOKE ORCHESTRATION
// Packs the artifact, scaffolds an app from that artifact, builds it, and validates outputs.
function main() {
  console.log('[smoke:packed] Preparing temp workspace...');
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });

  console.log('[smoke:packed] Packing create-portfoliable...');
  // Resolves packed tarball path for installer smoke run.
  const tarballPath = resolveTarballPath();
  // Builds file: dependency string consumed by npm exec package override.
  const runtimeDep = `file:${tarballPath}`;
  // Builds expected default runtime dependency for no-override scaffolding.
  const expectedDefaultRuntimeDep = `^${readLocalPackageVersion()}`;
  // Resolves dedicated output path for default-no-override validation.
  const generatedDefaultAppDir = path.join(tempRoot, 'my-portfolio-default');

  try {
    console.log('[smoke:packed] Verifying generated default runtime dependency (no override)...');
    runOrFail(
      'npm',
      ['exec', '--yes', `--package=${runtimeDep}`, 'create', generatedDefaultAppDir, '--', '--no-install', '--no-preview'],
      tempRoot
    );

    // Ensures packed initializer default dependency tracks packaged version.
    const generatedDefaultDep = readGeneratedRuntimeDependency(generatedDefaultAppDir);
    if (generatedDefaultDep !== expectedDefaultRuntimeDep) {
      fail(
        `Unexpected default runtime dependency: expected ${expectedDefaultRuntimeDep}, got ${String(generatedDefaultDep)}`
      );
    }

    console.log('[smoke:packed] Generating app from packed artifact...');
    runOrFail(
      'npm',
      ['exec', '--yes', `--package=${runtimeDep}`, 'create', generatedAppDir, '--', '--no-preview'],
      tempRoot,
      { PORTFOLIABLE_RUNTIME_DEP: runtimeDep }
    );

    console.log('[smoke:packed] Building generated app...');
    runOrFail('npm', ['run', 'portfoliable-build'], generatedAppDir);

    // Resolves generated dist assets directory.
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

    // Loads generated main bundle text for assertions.
    const bundleText = fs.readFileSync(path.join(distAssetsDir, mainBundle), 'utf8');
    ensureContains(bundleText, 'Making Portfoliable', 'starter case title');
    ensureContains(bundleText, 'Apple MacBook Air M5', 'starter model mapping');

    console.log('[smoke:packed] Packed-artifact smoke checks passed.');
  } finally {
    fs.rmSync(tarballPath, { force: true });
  }
}

main();
