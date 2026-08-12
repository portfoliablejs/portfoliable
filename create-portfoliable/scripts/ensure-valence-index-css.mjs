// File: create-portfoliable/scripts/ensure-valence-index-css.mjs
// Purpose: Ensure valence compatibility assets exist locally before runtime build and preview commands.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// MARK: PATH UTILITIES
// Deduplicates and normalizes candidate paths used while locating the valence package root.
function uniquePaths(paths) {
  return [...new Set(paths.map((entry) => path.normalize(entry)))];
}

// Resolves the local filesystem root for @portfoliablejs/valence from common installation layouts.
function resolveValenceRoot() {
  // Resolves this script directory so candidate paths can be built relative to package root.
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  // Resolves the current package root (create-portfoliable).
  const packageRoot = path.resolve(scriptDir, '..');

  // Defines installation candidates across consumer and package-local node_modules layouts.
  const candidates = uniquePaths([
    path.resolve(process.cwd(), 'node_modules', '@portfoliablejs', 'valence'),
    path.resolve(packageRoot, 'node_modules', '@portfoliablejs', 'valence'),
    path.resolve(packageRoot, '..', '@portfoliablejs', 'valence')
  ]);

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) || null;
}

// MARK: COMPATIBILITY PATCHES
// Ensures the valence sub-atomic index.css file exists for backward-compatible imports.
function ensureValenceIndexCss(valenceRoot) {
  // Resolves expected valence CSS entrypoint path.
  const indexCssPath = path.resolve(
    valenceRoot,
    'src',
    'stories',
    'sub-atomic',
    'index.css'
  );

  if (fs.existsSync(indexCssPath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(indexCssPath), { recursive: true });
  fs.writeFileSync(indexCssPath, "@import '../../style.css';\n", 'utf8');
  return true;
}

// Ensures consumer mockup assets are linked to valence catalog assets used by thumbnail devices.
function ensureMockupsSymlink(valenceRoot) {
  // Resolves source mockup directory within valence package.
  const sourceMockups = path.resolve(valenceRoot, 'src', 'stories', 'assets', 'mockups');
  if (!fs.existsSync(sourceMockups) || !fs.statSync(sourceMockups).isDirectory()) {
    return { created: false, reason: 'missing-source' };
  }

  // Resolves target mockup path in current working tree.
  const targetMockups = path.resolve(process.cwd(), 'src', 'stories', 'assets', 'mockups');
  fs.mkdirSync(path.dirname(targetMockups), { recursive: true });

  // Resolves canonical source path for robust symlink target comparisons.
  const resolvedSource = path.resolve(sourceMockups);

  // Detects whether target path is already a symlink to the expected source directory.
  function isLinkedToSource(targetPath) {
    try {
      // Reads stat metadata to confirm whether target path is a symlink.
      const stat = fs.lstatSync(targetPath);
      if (!stat.isSymbolicLink()) return false;
      // Reads raw symlink destination value.
      const linked = fs.readlinkSync(targetPath);
      // Resolves linked target to absolute path for stable comparison.
      const resolvedLink = path.resolve(path.dirname(targetPath), linked);
      return resolvedLink === resolvedSource;
    } catch {
      return false;
    }
  }

  // Creates or repairs a symlink while safely handling race conditions across parallel executions.
  function createSymlinkSafely(targetPath) {
    try {
      fs.symlinkSync(sourceMockups, targetPath, 'junction');
      return true;
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }

      // Another process may have created the link after our existence check.
      if (isLinkedToSource(targetPath)) {
        return false;
      }

      try {
        // Reads current target metadata before replacement.
        const stat = fs.lstatSync(targetPath);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
      } catch {
        // If target vanished during a concurrent write, retry create below.
      }

      try {
        fs.symlinkSync(sourceMockups, targetPath, 'junction');
        return true;
      } catch (retryError) {
        if (retryError?.code === 'EEXIST' && isLinkedToSource(targetPath)) {
          return false;
        }
        throw retryError;
      }
    }
  }

  if (fs.existsSync(targetMockups)) {
    // Reads existing target metadata to decide relink/replace behavior.
    const stat = fs.lstatSync(targetMockups);

    if (stat.isSymbolicLink()) {
      if (isLinkedToSource(targetMockups)) {
        return { created: false, reason: 'already-linked' };
      }

      fs.unlinkSync(targetMockups);
      // Attempts safe relink after removing stale symlink.
      const created = createSymlinkSafely(targetMockups);
      return { created, reason: created ? 'relinked' : 'already-linked' };
    }

    // If a real file or directory is present, replace it so repeated runs stay idempotent.
    fs.rmSync(targetMockups, { recursive: true, force: true });
    // Attempts safe symlink creation after replacement.
    const created = createSymlinkSafely(targetMockups);
    return { created, reason: created ? 'replaced' : 'already-linked' };
  }

  // Attempts initial symlink creation when no target exists.
  const created = createSymlinkSafely(targetMockups);
  return { created, reason: created ? 'linked' : 'already-linked' };
}

// Ensures runtime favicon assets exist so host app and default about image resolve without 404.
function ensureRuntimeFaviconAssets() {
  // Resolves package root from this script location.
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(scriptDir, '..');

  // Lists favicon assets that should be mirrored from template public assets into runtime public.
  const assets = ['favicon.png', 'favicon.ico'];
  const copied = [];
  const missingSources = [];

  // Ensures runtime public directory exists before mirroring assets.
  const runtimePublicDir = path.resolve(packageRoot, 'public');
  fs.mkdirSync(runtimePublicDir, { recursive: true });

  for (const assetName of assets) {
    // Resolves source asset from template files distributed to end users.
    const sourceAsset = path.resolve(packageRoot, 'templates', 'public', assetName);
    if (!fs.existsSync(sourceAsset)) {
      missingSources.push(assetName);
      continue;
    }

    // Resolves runtime mirror destination served at root URL path.
    const targetAsset = path.resolve(runtimePublicDir, assetName);
    if (fs.existsSync(targetAsset)) {
      continue;
    }

    fs.copyFileSync(sourceAsset, targetAsset);
    copied.push(assetName);
  }

  return {
    copied,
    missingSources
  };
}

// Applies all compatibility patches that are required before runtime commands execute.
export function ensureValenceCompatibility() {
  // Resolves valence package location from supported installation layouts.
  const valenceRoot = resolveValenceRoot();
  if (!valenceRoot) {
    console.warn('Could not locate @portfoliablejs/valence to apply compatibility patches.');
    return;
  }

  // Creates compatibility CSS entrypoint when missing.
  const indexCreated = ensureValenceIndexCss(valenceRoot);
  if (indexCreated) {
    console.log('Patched valence compatibility: created src/stories/sub-atomic/index.css');
  }

  // Creates or verifies mockup symlink used by thumbnail catalog.
  const mockupLinkStatus = ensureMockupsSymlink(valenceRoot);
  if (mockupLinkStatus.created) {
    console.log('Patched valence compatibility: linked src/stories/assets/mockups to valence catalog.');
  } else if (mockupLinkStatus.reason === 'missing-source') {
    console.warn('Valence mockup sync skipped: no mockup source found in @portfoliablejs/valence.');
  }

  // Ensures root-level runtime favicon assets exist for host document and default about image.
  const faviconAssetStatus = ensureRuntimeFaviconAssets();
  if (faviconAssetStatus.copied.length > 0) {
    console.log(`Patched runtime assets: restored ${faviconAssetStatus.copied.join(', ')} from templates/public.`);
  }
  if (faviconAssetStatus.missingSources.length > 0) {
    console.warn(`Runtime favicon sync skipped for missing source assets: ${faviconAssetStatus.missingSources.join(', ')}`);
  }
}

// MARK: ENTRYPOINT DETECTION
// Determines whether this module is being run directly versus imported.
function isDirectExecution() {
  // Reads the entrypoint argument from current process invocation.
  const entrypoint = process.argv[1];
  if (!entrypoint) return false;

  // Captures current module URL for direct-execution comparison.
  const currentFileUrl = import.meta.url;
  // Resolves process entrypoint path to URL for module-url equality check.
  const entrypointUrl = pathToFileURL(path.resolve(entrypoint)).href;
  return currentFileUrl === entrypointUrl;
}

// MARK: SCRIPT ENTRYPOINT
// Executes compatibility checks only when run as the main process entrypoint.
if (isDirectExecution()) {
  try {
    ensureValenceCompatibility();
  } catch (error) {
    console.warn('Could not patch valence compatibility:', error?.message || error);
  }
}
