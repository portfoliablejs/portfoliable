import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

function fail(message) {
  console.error(`[smoke] ${message}`);
  process.exit(1);
}

function runBuild() {
  console.log('[smoke] Running build...');
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (build.status !== 0) {
    fail('Build failed.');
  }
}

function readMainBundle() {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fail('Missing dist/assets after build.');
  }

  const files = fs.readdirSync(assetsDir);
  const jsBundles = files.filter((file) => file.startsWith('index-') && file.endsWith('.js'));

  if (jsBundles.length === 0) {
    fail('Could not find main JS bundle in dist/assets.');
  }

  const newestBundle = jsBundles
    .map((file) => ({
      file,
      mtimeMs: fs.statSync(path.join(assetsDir, file)).mtimeMs
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0].file;

  const bundlePath = path.join(assetsDir, newestBundle);
  return fs.readFileSync(bundlePath, 'utf8');
}

function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    fail(message);
  }
}

function main() {
  runBuild();

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    fail('dist/index.html not found.');
  }

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
