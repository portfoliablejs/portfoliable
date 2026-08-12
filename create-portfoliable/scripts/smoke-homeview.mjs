// File: create-portfoliable/scripts/smoke-homeview.mjs
// Purpose: Smoke-test build output to confirm HomeView, sample content, and device assets are emitted.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// MARK: PATH CONSTANTS
// Resolves the script absolute filename for deterministic project-root path computation.
const __filename = fileURLToPath(import.meta.url);
// Resolves the directory containing this script.
const __dirname = path.dirname(__filename);
// Resolves the package root used as the working directory for smoke commands.
const projectRoot = path.resolve(__dirname, '..');
// Resolves the build output directory validated by this smoke test.
const distDir = path.join(projectRoot, 'dist');

// MARK: ERROR HANDLING
// Terminates the smoke test with a consistent prefixed error message.
function fail(message) {
  console.error(`[smoke] ${message}`);
  process.exit(1);
}

// MARK: BUILD STEP
// Executes a production build before assertions so smoke checks inspect fresh artifacts.
function runBuild() {
  console.log('[smoke] Running build...');
  // Runs the package build command and forwards process output directly to the terminal.
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (build.status !== 0) {
    fail('Build failed.');
  }
}

// MARK: BUNDLE DISCOVERY
// Locates the newest index bundle produced by Vite and returns its source text for assertions.
function readMainBundle() {
  // Resolves the generated assets directory that contains hashed JS bundles.
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fail('Missing dist/assets after build.');
  }

  // Reads all generated asset filenames.
  const files = fs.readdirSync(assetsDir);
  // Filters for the main app bundle naming convention emitted by Vite.
  const jsBundles = files.filter((file) => file.startsWith('index-') && file.endsWith('.js'));

  if (jsBundles.length === 0) {
    fail('Could not find main JS bundle in dist/assets.');
  }

  // Selects the most recently modified main bundle in case multiple artifacts are present.
  const newestBundle = jsBundles
    .map((file) => ({
      file,
      mtimeMs: fs.statSync(path.join(assetsDir, file)).mtimeMs
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0].file;

  // Loads bundle text so feature markers can be validated with string assertions.
  const bundlePath = path.join(assetsDir, newestBundle);
  return fs.readFileSync(bundlePath, 'utf8');
}

// MARK: ASSERTION HELPER
// Verifies a marker string exists in the tested output and aborts with a clear reason if missing.
function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    fail(message);
  }
}

// MARK: SMOKE ORCHESTRATION
// Runs build, inspects emitted bundle/assets, and validates HomeView/CaseView route expectations.
function main() {
  runBuild();

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    fail('dist/index.html not found.');
  }

  // Loads emitted main bundle text for marker assertions.
  const bundleText = readMainBundle();

  // HomeView template is mounted through ds-home-view.
  assertIncludes(bundleText, 'ds-home-view', 'HomeView marker not found in bundle.');

  // CaseView template must exist for in-app Home -> Case transitions.
  assertIncludes(bundleText, 'ds-case-view', 'CaseView marker not found in bundle.');

  // Route transition helpers should be present in the runtime shell bundle.
  assertIncludes(bundleText, '_transitionToView', 'Route transition helper not found in bundle.');
  assertIncludes(bundleText, 'data-route-direction', 'Route direction marker not found in bundle.');
  assertIncludes(bundleText, '_isNativeMorphPreferredPair', 'Native morph policy helper not found in bundle.');
  assertIncludes(bundleText, 'native-running', 'Native transition debug marker not found in bundle.');
  assertIncludes(bundleText, 'manual-fallback', 'Manual fallback debug marker not found in bundle.');
  assertIncludes(bundleText, 'home->player', 'Direct Home -> Player transition marker not found in bundle.');
  assertIncludes(bundleText, 'player->home', 'Direct Player -> Home transition marker not found in bundle.');

  // Template case metadata markers should survive bundling regardless of sample title wording.
  assertIncludes(bundleText, 'thumbCategory', 'Template case metadata marker not found in bundle.');
  assertIncludes(bundleText, 'thumbBrand', 'Template case metadata brand marker not found in bundle.');

  // Thumbnail frame fallback asset should be part of build outputs.
  const hasDeviceFrameAsset = fs
    .readdirSync(path.join(distDir, 'assets'))
    .some((file) => {
      if (!file.endsWith('.avif')) return false;
      const normalized = file.toLowerCase();
      return (
        normalized.startsWith('iphone-12-black-') ||
        (normalized.includes('iphone') && normalized.includes('12') && normalized.includes('black'))
      );
    });

  if (!hasDeviceFrameAsset) {
    fail('Expected thumbnail device frame asset was not generated.');
  }

  console.log('[smoke] HomeView and gallery smoke checks passed.');
}

main();
