import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tempRoot = path.join(os.tmpdir(), 'portfoliable-initializer-smoke');
const generatedAppDir = path.join(tempRoot, 'my-portfolio');

function fail(message) {
  console.error(`[smoke:init] ${message}`);
  process.exit(1);
}

function runOrFail(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function ensureContains(text, needle, description) {
  if (!text.includes(needle)) {
    fail(`Missing expected marker (${description}): ${needle}`);
  }
}

function main() {
  console.log('[smoke:init] Preparing temp workspace...');
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });

  console.log('[smoke:init] Generating app from local initializer...');
  runOrFail('node', ['./create-portfoliable/bin/create-portfoliable.mjs', generatedAppDir, '--no-preview'], projectRoot);

  console.log('[smoke:init] Building generated app...');
  runOrFail('npm', ['run', 'portfoliable-build'], generatedAppDir);

  const distAssetsDir = path.join(generatedAppDir, 'dist', 'assets');
  if (!fs.existsSync(distAssetsDir)) {
    fail('dist/assets not found in generated app build output.');
  }

  const assets = fs.readdirSync(distAssetsDir);
  const expectedAssetPrefixes = [
    'iphone-12-black-',
    'ipad-pro-11-silver-landscape-',
    'macbook-pro-13-space-grey-',
    'apple-watch-44mm-silver-aluminum-'
  ];

  expectedAssetPrefixes.forEach((prefix) => {
    if (!assets.some((file) => file.startsWith(prefix) && file.endsWith('.avif'))) {
      fail(`Expected starter frame asset not found: ${prefix}*.avif`);
    }
  });

  const mainBundle = assets.find((file) => file.startsWith('index-') && file.endsWith('.js'));
  if (!mainBundle) {
    fail('Could not find generated app main bundle (index-*.js).');
  }

  const bundleText = fs.readFileSync(path.join(distAssetsDir, mainBundle), 'utf8');
  ensureContains(bundleText, 'Mobile Product Launch', 'starter case title');
  ensureContains(bundleText, 'Mobile Checkout Flow', 'starter case title');
  ensureContains(bundleText, 'Compact Research Archive', 'starter case title');
  ensureContains(bundleText, 'Wearable Companion', 'starter case title');

  ensureContains(bundleText, 'Apple iPhone 12', 'starter model mapping');
  ensureContains(bundleText, 'Apple iPad Pro 11', 'starter model mapping');
  ensureContains(bundleText, 'Apple Macbook Pro 13', 'starter model mapping');
  ensureContains(bundleText, 'Apple Watch 44mm', 'starter model mapping');

  console.log('[smoke:init] Initializer smoke checks passed.');
}

main();