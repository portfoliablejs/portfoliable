#!/usr/bin/env node
// File: cli/portfoliable.mjs
// Purpose: Main Portfoliable CLI for development, build, preview, validation, and scaffolding.
// Author: Lio Schimanko

import { createServer, build as viteBuild, preview as vitePreview } from 'vite';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { runValidation } from '../scripts/validate-content.mjs';
import { runCaseScaffold } from '../scripts/scaffold-case.mjs';
import { ensureValenceCompatibility } from '../scripts/ensure-valence-index-css.mjs';

const green = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

function resolvePackageVersion() {
  const currentFile = fileURLToPath(import.meta.url);
  const packagePath = path.resolve(path.dirname(currentFile), '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return packageJson.version || '0.0.0';
}

function firstNetworkAddress() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

async function fetchLatestVersion() {
  try {
    const response = await fetch('https://registry.npmjs.org/create-portfoliable/latest');
    if (!response.ok) return null;

    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

function parseCliArgs(argv) {
  const parsed = {
    command: 'dev',
    flags: {
      host: true,
      port: null,
      out: null,
      force: false,
      name: null,
      open: false,
      json: false,
      full: false
    }
  };

  const commandCandidate = argv[2];
  const knownCommands = new Set([
    'dev',
    'build',
    'preview',
    'validate',
    'scaffold-case',
    'create-case',
    'thumbnail-options'
  ]);
  const startIndex = knownCommands.has(commandCandidate) ? 3 : 2;

  if (knownCommands.has(commandCandidate)) {
    parsed.command = commandCandidate;
  }

  for (let i = startIndex; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--host') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        parsed.flags.host = next;
        i += 1;
      } else {
        parsed.flags.host = true;
      }
      continue;
    }

    if (arg === '--port') {
      const next = argv[i + 1];
      if (next) {
        const asNumber = Number(next);
        if (Number.isFinite(asNumber)) {
          parsed.flags.port = asNumber;
          i += 1;
        }
      }
      continue;
    }

    if (arg === '--out') {
      const next = argv[i + 1];
      if (next) {
        parsed.flags.out = next;
        i += 1;
      }
      continue;
    }

    if (arg === '--force') {
      parsed.flags.force = true;
      continue;
    }

    if (arg === '--name') {
      const next = argv[i + 1];
      if (next) {
        parsed.flags.name = next;
        i += 1;
      }
      continue;
    }

    if (arg === '--open') {
      parsed.flags.open = true;
      continue;
    }

    if (arg === '--json') {
      parsed.flags.json = true;
      continue;
    }

    if (arg === '--full') {
      parsed.flags.full = true;
      continue;
    }

    if (!arg.startsWith('--') && parsed.flags.port === null) {
      const asNumber = Number(arg);
      if (Number.isFinite(asNumber)) {
        parsed.flags.port = asNumber;
      }
    }
  }

  return parsed;
}

function walkFilesRecursive(rootDir) {
  const files = [];

  const visit = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      files.push(absolutePath);
    }
  };

  visit(rootDir);
  return files;
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deriveColorName(fileNameNoExt, modelName) {
  const normalizedModel = modelName.trim();
  if (!normalizedModel) return fileNameNoExt;

  const modelPattern = new RegExp(`^${escapeRegex(normalizedModel)}[\\s_\-—–]*`, 'i');
  const stripped = fileNameNoExt.replace(modelPattern, '').trim();
  return stripped || 'Default';
}

function buildThumbnailCatalog(mockupsRoot) {
  const catalog = {};
  const genericDirPattern = /^(device|device with pencil|device without pencil|device with shadow|device open|device closed|with bands|without bands|open|closed)$/i;
  const files = walkFilesRecursive(mockupsRoot).filter((filePath) => filePath.toLowerCase().endsWith('.avif'));

  for (const filePath of files) {
    const relativePath = path.relative(mockupsRoot, filePath);
    const parts = relativePath.split(path.sep);
    if (parts.length < 3) continue;

    const category = parts[0];
    const brand = parts[1];
    const fileNameNoExt = path.basename(parts[parts.length - 1], '.avif');
    const middleDirs = parts.slice(2, parts.length - 1);
    const modelParts = middleDirs.filter((segment) => !genericDirPattern.test(segment));
    const modelName = modelParts.length > 0 ? modelParts.join(' - ') : (middleDirs[0] || fileNameNoExt);
    const colorName = deriveColorName(fileNameNoExt, modelName);

    if (!catalog[category]) catalog[category] = {};
    if (!catalog[category][brand]) catalog[category][brand] = {};
    if (!catalog[category][brand][modelName]) {
      catalog[category][brand][modelName] = new Set();
    }

    catalog[category][brand][modelName].add(colorName);
  }

  return catalog;
}

function resolveMockupsRoot() {
  const candidates = [
    path.resolve(process.cwd(), 'src', 'stories', 'assets', 'mockups'),
    path.resolve(process.cwd(), 'node_modules', '@portfoliablejs', 'valence', 'src', 'stories', 'assets', 'mockups')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) || null;
}

function printThumbnailCatalog(catalog, flags, mockupsRoot) {
  const categoryNames = Object.keys(catalog).sort((a, b) => a.localeCompare(b));
  const brandCount = categoryNames.reduce((acc, category) => acc + Object.keys(catalog[category]).length, 0);
  const modelCount = categoryNames.reduce((acc, category) => {
    return acc + Object.values(catalog[category]).reduce((modelAcc, modelsByBrand) => modelAcc + Object.keys(modelsByBrand).length, 0);
  }, 0);

  if (flags.json) {
    const serialized = {};
    categoryNames.forEach((category) => {
      serialized[category] = {};
      Object.keys(catalog[category]).sort((a, b) => a.localeCompare(b)).forEach((brand) => {
        serialized[category][brand] = {};
        Object.keys(catalog[category][brand]).sort((a, b) => a.localeCompare(b)).forEach((model) => {
          serialized[category][brand][model] = [...catalog[category][brand][model]].sort((a, b) => a.localeCompare(b));
        });
      });
    });

    console.log(JSON.stringify({
      source: mockupsRoot,
      categories: serialized
    }, null, 2));
    return;
  }

  console.log(`${bold}${cyan}Thumbnail Options Catalog${reset}`);
  console.log(`${dim}Source: ${mockupsRoot}${reset}`);
  console.log(`${dim}Categories: ${categoryNames.length} | Brands: ${brandCount} | Models: ${modelCount}${reset}`);

  const colorLimit = flags.full ? Number.POSITIVE_INFINITY : 12;

  categoryNames.forEach((category) => {
    const brands = Object.keys(catalog[category]).sort((a, b) => a.localeCompare(b));
    console.log(`\n${bold}${category}${reset}`);

    brands.forEach((brand) => {
      const models = Object.keys(catalog[category][brand]).sort((a, b) => a.localeCompare(b));
      console.log(`  ${brand}`);

      models.forEach((model) => {
        const colors = [...catalog[category][brand][model]].sort((a, b) => a.localeCompare(b));
        const visibleColors = colors.slice(0, colorLimit);
        const hiddenCount = Math.max(0, colors.length - visibleColors.length);
        const moreSuffix = hiddenCount > 0 ? ` (+${hiddenCount} more, run with --full)` : '';
        console.log(`    - ${model}: ${visibleColors.join(', ')}${moreSuffix}`);
      });
    });
  });
}

function runThumbnailOptions(flags) {
  ensureValenceCompatibility();
  const mockupsRoot = resolveMockupsRoot();

  if (!mockupsRoot) {
    console.error(`${red}${bold}Could not locate Valence mockup catalog.${reset}`);
    console.error('Expected either src/stories/assets/mockups or node_modules/@portfoliablejs/valence/src/stories/assets/mockups');
    return 1;
  }

  const catalog = buildThumbnailCatalog(mockupsRoot);
  if (Object.keys(catalog).length === 0) {
    console.error(`${red}${bold}No mockup assets were found in catalog.${reset}`);
    return 1;
  }

  printThumbnailCatalog(catalog, flags, mockupsRoot);
  return 0;
}

function printStartupBox({ localUrl, networkUrl, localVersion, latestVersion }) {
  const width = 72;
  const line = (text = '') => `│ ${text.padEnd(width - 4)} │`;
  const spacer = () => line();

  console.log('╭' + '─'.repeat(width - 2) + '╮');
  console.log(line(`${green}${bold}Portfoliable ready!${reset}`));
  console.log(line(`${dim}Dev server is live and ready for editing.${reset}`));
  console.log(spacer());
  console.log(line(`${bold}Local:${reset} ${localUrl}`));
  console.log(line(`${bold}On your network:${reset} ${networkUrl}`));
  console.log(spacer());
  console.log(line(`${bold}Next:${reset} open the local URL in your browser.`));

  if (latestVersion && latestVersion !== localVersion && !latestVersion.includes('alpha')) {
    console.log(spacer());
    console.log(line(`${yellow}A new version (${latestVersion}) is available!${reset}`));
    console.log(line(`Upgrade now: ${green}npm update create-portfoliable${reset}`));
  }

  console.log('╰' + '─'.repeat(width - 2) + '╯');
  console.log(`${dim}│  Press Ctrl+C to stop the server${reset}\n`);
}

async function runDevServer(flags) {
  const port = Number.isFinite(flags.port) ? flags.port : 5173;

  const server = await createServer({
    server: {
      host: flags.host,
      port,
      open: Boolean(flags.open)
    }
  });

  await server.listen();

  const protocol = 'http';
  const resolvedPort = server.config.server.port || port;
  const localUrl = `${protocol}://localhost:${resolvedPort}/`;
  const networkAddress = firstNetworkAddress();
  const networkUrl = networkAddress ? `${protocol}://${networkAddress}:${resolvedPort}/` : 'Not available';

  const localVersion = resolvePackageVersion();
  const latestVersion = await fetchLatestVersion();

  printStartupBox({ localUrl, networkUrl, localVersion, latestVersion });

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

async function runBuild() {
  console.log(`${cyan}${bold}Building Portfoliable...${reset}`);
  await viteBuild();
  console.log(`${green}Build complete.${reset}`);
}

async function runPreview(flags) {
  const previewPort = Number.isFinite(flags.port) ? flags.port : 4173;
  const previewServer = await vitePreview({ preview: { host: flags.host, port: previewPort } });
  const protocol = 'http';
  const localUrl = `${protocol}://localhost:${previewPort}/`;
  const networkAddress = firstNetworkAddress();
  const networkUrl = networkAddress ? `${protocol}://${networkAddress}:${previewPort}/` : 'Not available';

  const width = 72;
  const line = (text = '') => `│ ${text.padEnd(width - 4)} │`;
  console.log('╭' + '─'.repeat(width - 2) + '╮');
  console.log(line(`${cyan}${bold}Portfoliable preview ready${reset}`));
  console.log(line(`${dim}Serving the production build locally.${reset}`));
  console.log(line());
  console.log(line(`${bold}Local:${reset} ${localUrl}`));
  console.log(line(`${bold}On your network:${reset} ${networkUrl}`));
  console.log('╰' + '─'.repeat(width - 2) + '╯');
  console.log(`${dim}│  Press Ctrl+C to stop the server${reset}\n`);

  process.on('SIGINT', async () => {
    await previewServer.httpServer.close();
    process.exit(0);
  });
}

async function main() {
  const { command, flags } = parseCliArgs(process.argv);

  if (command === 'dev') {
    ensureValenceCompatibility();
    await runDevServer(flags);
    return;
  }

  if (command === 'build') {
    ensureValenceCompatibility();
    await runBuild();
    return;
  }

  if (command === 'preview') {
    ensureValenceCompatibility();
    await runPreview(flags);
    return;
  }

  if (command === 'validate') {
    const exitCode = runValidation();
    process.exit(exitCode);
    return;
  }

  if (command === 'scaffold-case') {
    const exitCode = runCaseScaffold({ outFile: flags.out || undefined, name: flags.name || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  if (command === 'create-case') {
    const exitCode = runCaseScaffold({ outFile: flags.out || undefined, name: flags.name || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  if (command === 'thumbnail-options') {
    const exitCode = runThumbnailOptions(flags);
    process.exit(exitCode);
    return;
  }

  console.error(`${red}${bold}Unknown command:${reset} ${command}`);
  console.log('Use one of: dev, build, preview, validate, create-case, scaffold-case, thumbnail-options');
  process.exit(1);
}

main().catch((error) => {
  console.error(`${bold}${red}✕ Failed to run Portfoliable:${reset}`, error);
  process.exit(1);
});
