// File: create-portfoliable/scripts/smoke-homeview.mjs
// Purpose: Smoke-test build output to confirm HomeView, sample content, and device assets are emitted.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// === PATH CONSTANTS ===
// Resolves the script absolute filename for deterministic project-root path computation.
const __filename = fileURLToPath(import.meta.url);
// Resolves the directory containing this script.
const __dirname = path.dirname(__filename);
// Resolves the package root used as the working directory for smoke commands.
const projectRoot = path.resolve(__dirname, '..');
// Resolves the build output directory validated by this smoke test.
const distDir = path.join(projectRoot, 'dist');

// === ERROR HANDLING ===
// Terminates the smoke test with a consistent prefixed error message.
function fail(message) {
  console.error(`[smoke] ${message}`);
  process.exit(1);
}

// === BUILD STEP ===
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

// === BUNDLE DISCOVERY ===
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

// === ASSERTION HELPER ===
// Verifies a marker string exists in the tested output and aborts with a clear reason if missing.
function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    fail(message);
  }
}

// === SMOKE ORCHESTRATION ===
// Runs build, inspects emitted bundle/assets, and validates key HomeView/gallery expectations.
function main() {
  runBuild();

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    fail('dist/index.html not found.');
  }

  // Loads emitted main bundle text for marker assertions.
  const bundleText = readMainBundle();

  // HomeView template is mounted through ds-home-view.
  assertIncludes(bundleText, 'ds-home-view', 'HomeView marker not found in bundle.');

  // Template gallery data should include the sample case titles.
  assertIncludes(bundleText, 'Template Product Launch', 'Template case title not found in bundle.');
  assertIncludes(bundleText, 'Template Mobile Redesign', 'Second template case title not found in bundle.');

  // Thumbnail frame fallback asset should be part of build outputs.
  const hasDeviceFrameAsset = fs
    .readdirSync(path.join(distDir, 'assets'))
    .some((file) => file.startsWith('iphone-12-black-') && file.endsWith('.avif'));

  if (!hasDeviceFrameAsset) {
    fail('Expected thumbnail device frame asset was not generated.');
  }

  console.log('[smoke] HomeView and gallery smoke checks passed.');
}

main();
