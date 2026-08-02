import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tempRoot = path.join(os.tmpdir(), 'portfoliable-packed-smoke');
const generatedAppDir = path.join(tempRoot, 'my-portfolio');

function fail(message) {
  console.error(`[smoke:packed] ${message}`);
  process.exit(1);
}

function runOrFail(command, args, cwd, env = undefined) {
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

function runCaptureOrFail(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    fail(`Command failed: ${command} ${args.join(' ')}${stderr ? `\n${stderr}` : ''}`);
  }

  return (result.stdout || '').trim();
}

function ensureContains(text, needle, description) {
  if (!text.includes(needle)) {
    fail(`Missing expected marker (${description}): ${needle}`);
  }
}

function resolveTarballPath() {
  const packOutput = runCaptureOrFail('npm', ['pack', '--json'], projectRoot);
  let parsed;

  try {
    parsed = JSON.parse(packOutput);
  } catch {
    fail(`Could not parse npm pack --json output: ${packOutput}`);
  }

  const filename = parsed?.[0]?.filename;
  if (!filename) {
    fail('npm pack did not return a tarball filename.');
  }

  const tarballPath = path.join(projectRoot, filename);
  if (!fs.existsSync(tarballPath)) {
    fail(`Packed tarball not found: ${tarballPath}`);
  }

  return tarballPath;
}

function main() {
  console.log('[smoke:packed] Preparing temp workspace...');
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });

  console.log('[smoke:packed] Packing create-portfoliable...');
  const tarballPath = resolveTarballPath();
  const runtimeDep = `file:${tarballPath}`;

  try {
    console.log('[smoke:packed] Generating app from packed artifact...');
    runOrFail(
      'npm',
      ['exec', '--yes', `--package=${runtimeDep}`, 'create-portfoliable', generatedAppDir, '--', '--no-preview'],
      tempRoot,
      { PORTFOLIABLE_RUNTIME_DEP: runtimeDep }
    );

    console.log('[smoke:packed] Building generated app...');
    runOrFail('npm', ['run', 'portfoliable-build'], generatedAppDir);

    const distAssetsDir = path.join(generatedAppDir, 'dist', 'assets');
    if (!fs.existsSync(distAssetsDir)) {
      fail('dist/assets not found in generated app build output.');
    }

    const assets = fs.readdirSync(distAssetsDir);
    if (!assets.some((file) => file.endsWith('.avif'))) {
      fail('Expected at least one AVIF asset in generated app build output.');
    }

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

    console.log('[smoke:packed] Packed-artifact smoke checks passed.');
  } finally {
    fs.rmSync(tarballPath, { force: true });
  }
}

main();
