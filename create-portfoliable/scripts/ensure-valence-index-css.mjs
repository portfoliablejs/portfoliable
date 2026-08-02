import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function uniquePaths(paths) {
  return [...new Set(paths.map((entry) => path.normalize(entry)))];
}

function resolveValenceRoot() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(scriptDir, '..');

  const candidates = uniquePaths([
    path.resolve(process.cwd(), 'node_modules', '@portfoliablejs', 'valence'),
    path.resolve(packageRoot, 'node_modules', '@portfoliablejs', 'valence'),
    path.resolve(packageRoot, '..', '@portfoliablejs', 'valence')
  ]);

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) || null;
}

function ensureValenceIndexCss(valenceRoot) {
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

function ensureMockupsSymlink(valenceRoot) {
  const sourceMockups = path.resolve(valenceRoot, 'src', 'stories', 'assets', 'mockups');
  if (!fs.existsSync(sourceMockups) || !fs.statSync(sourceMockups).isDirectory()) {
    return { created: false, reason: 'missing-source' };
  }

  const targetMockups = path.resolve(process.cwd(), 'src', 'stories', 'assets', 'mockups');
  fs.mkdirSync(path.dirname(targetMockups), { recursive: true });

  const resolvedSource = path.resolve(sourceMockups);

  function isLinkedToSource(targetPath) {
    try {
      const stat = fs.lstatSync(targetPath);
      if (!stat.isSymbolicLink()) return false;
      const linked = fs.readlinkSync(targetPath);
      const resolvedLink = path.resolve(path.dirname(targetPath), linked);
      return resolvedLink === resolvedSource;
    } catch {
      return false;
    }
  }

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
    const stat = fs.lstatSync(targetMockups);

    if (stat.isSymbolicLink()) {
      if (isLinkedToSource(targetMockups)) {
        return { created: false, reason: 'already-linked' };
      }

      fs.unlinkSync(targetMockups);
      const created = createSymlinkSafely(targetMockups);
      return { created, reason: created ? 'relinked' : 'already-linked' };
    }

    // If a real file or directory is present, replace it so repeated runs stay idempotent.
    fs.rmSync(targetMockups, { recursive: true, force: true });
    const created = createSymlinkSafely(targetMockups);
    return { created, reason: created ? 'replaced' : 'already-linked' };
  }

  const created = createSymlinkSafely(targetMockups);
  return { created, reason: created ? 'linked' : 'already-linked' };
}

export function ensureValenceCompatibility() {
  const valenceRoot = resolveValenceRoot();
  if (!valenceRoot) {
    console.warn('Could not locate @portfoliablejs/valence to apply compatibility patches.');
    return;
  }

  const indexCreated = ensureValenceIndexCss(valenceRoot);
  if (indexCreated) {
    console.log('Patched valence compatibility: created src/stories/sub-atomic/index.css');
  }

  const mockupLinkStatus = ensureMockupsSymlink(valenceRoot);
  if (mockupLinkStatus.created) {
    console.log('Patched valence compatibility: linked src/stories/assets/mockups to valence catalog.');
  } else if (mockupLinkStatus.reason === 'missing-source') {
    console.warn('Valence mockup sync skipped: no mockup source found in @portfoliablejs/valence.');
  }
}

function isDirectExecution() {
  const entrypoint = process.argv[1];
  if (!entrypoint) return false;

  const currentFileUrl = import.meta.url;
  const entrypointUrl = pathToFileURL(path.resolve(entrypoint)).href;
  return currentFileUrl === entrypointUrl;
}

if (isDirectExecution()) {
  try {
    ensureValenceCompatibility();
  } catch (error) {
    console.warn('Could not patch valence compatibility:', error?.message || error);
  }
}
