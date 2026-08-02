#!/usr/bin/env node
// File: cli/portfoliable.mjs
// Purpose: Main Portfoliable CLI for development, build, preview, validation, and scaffolding.
// Author: Lio Schimanko

// === IMPORTS ===
import { createServer, build as viteBuild, preview as vitePreview } from 'vite';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { runValidation } from '../scripts/validate-content.mjs';
import { runCaseScaffold } from '../scripts/scaffold-case.mjs';
import { ensureValenceCompatibility } from '../scripts/ensure-valence-index-css.mjs';

// === TERMINAL STYLES ===
// ANSI color code used for success-status text.
const green = '\x1b[32m';
// ANSI color code used for warnings and update notices.
const yellow = '\x1b[33m';
// ANSI color code used for neutral informational output.
const cyan = '\x1b[36m';
// ANSI color code used for bold text emphasis.
const bold = '\x1b[1m';
// ANSI color code used for dimmed hint text.
const dim = '\x1b[2m';
// ANSI color code used for errors and failures.
const red = '\x1b[31m';
// ANSI code that resets terminal formatting.
const reset = '\x1b[0m';

// === VERSION AND NETWORK HELPERS ===
// Resolves the current package version from package.json.
function resolvePackageVersion() {
  // Resolves this file path for package.json lookup.
  const currentFile = fileURLToPath(import.meta.url);
  // Resolves package.json path relative to CLI location.
  const packagePath = path.resolve(path.dirname(currentFile), '..', 'package.json');
  // Reads and parses package metadata.
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return packageJson.version || '0.0.0';
}

// Finds first non-internal IPv4 address for network URL display.
function firstNetworkAddress() {
  // Reads system network interfaces.
  const interfaces = os.networkInterfaces();

  // Iterates interface groups.
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    // Iterates individual addresses in each interface group.
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

// Fetches latest published create-portfoliable version from npm registry.
async function fetchLatestVersion() {
  try {
    // Calls npm metadata endpoint for latest dist-tag payload.
    const response = await fetch('https://registry.npmjs.org/@portfoliablejs%2fcreate-portfoliable/latest');
    if (!response.ok) return null;

    // Parses registry response payload.
    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

// === CLI ARGUMENT PARSING ===
// Parses command and flags from argv into normalized runtime options.
function parseCliArgs(argv) {
  // Initializes parser defaults for command and supported flags.
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

  // Reads possible command token from argv position 2.
  const commandCandidate = argv[2];
  // Defines supported CLI commands.
  const knownCommands = new Set([
    'dev',
    'build',
    'preview',
    'validate',
    'scaffold-case',
    'create-case',
    'thumbnail-options'
  ]);
  // Chooses argument start index based on whether explicit command was provided.
  const startIndex = knownCommands.has(commandCandidate) ? 3 : 2;

  if (knownCommands.has(commandCandidate)) {
    parsed.command = commandCandidate;
  }

  // Parses all trailing argv tokens for supported flags.
  for (let i = startIndex; i < argv.length; i += 1) {
    // Reads current token under evaluation.
    const arg = argv[i];
    if (arg === '--host') {
      // Reads optional host value token.
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
      // Reads optional port value token.
      const next = argv[i + 1];
      if (next) {
        // Converts port token to number for validation.
        const asNumber = Number(next);
        if (Number.isFinite(asNumber)) {
          parsed.flags.port = asNumber;
          i += 1;
        }
      }
      continue;
    }

    if (arg === '--out') {
      // Reads output-file value used by scaffold commands.
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
      // Reads case name value used by scaffold commands.
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
      // Supports positional numeric port shorthand.
      const asNumber = Number(arg);
      if (Number.isFinite(asNumber)) {
        parsed.flags.port = asNumber;
      }
    }
  }

  return parsed;
}

// === FILESYSTEM HELPERS ===
// Recursively walks a directory and returns absolute file paths.
function walkFilesRecursive(rootDir) {
  // Accumulates discovered files.
  const files = [];

  // Recursively visits one directory path.
  const visit = (currentDir) => {
    // Reads directory entries with file-type metadata.
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    // Iterates each entry for recursion or file collection.
    for (const entry of entries) {
      // Resolves entry absolute path.
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

// Escapes regex metacharacters in freeform strings.
function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Derives display color value from filename by stripping known model prefix.
function deriveColorName(fileNameNoExt, modelName) {
  // Normalizes model text before regex construction.
  const normalizedModel = modelName.trim();
  if (!normalizedModel) return fileNameNoExt;

  // Builds model-prefix stripping regex for color extraction.
  const modelPattern = new RegExp(`^${escapeRegex(normalizedModel)}[\\s_\-—–]*`, 'i');
  // Removes model prefix and trims resulting color suffix.
  const stripped = fileNameNoExt.replace(modelPattern, '').trim();
  return stripped || 'Default';
}

// Builds nested thumbnail catalog from valence mockup asset tree.
function buildThumbnailCatalog(mockupsRoot) {
  // Initializes catalog object in category->brand->model->colors shape.
  const catalog = {};
  // Matches generic folder names that should be ignored as model names.
  const genericDirPattern = /^(device|device with pencil|device without pencil|device with shadow|device open|device closed|with bands|without bands|open|closed)$/i;
  // Loads all .avif assets from mockup tree.
  const files = walkFilesRecursive(mockupsRoot).filter((filePath) => filePath.toLowerCase().endsWith('.avif'));

  // Iterates each mockup asset and classifies metadata from path shape.
  for (const filePath of files) {
    // Resolves file path relative to mockup root.
    const relativePath = path.relative(mockupsRoot, filePath);
    // Splits relative path segments for category/brand/model extraction.
    const parts = relativePath.split(path.sep);
    if (parts.length < 3) continue;

    // Extracts category segment.
    const category = parts[0];
    // Extracts brand segment.
    const brand = parts[1];
    // Extracts filename stem as fallback metadata source.
    const fileNameNoExt = path.basename(parts[parts.length - 1], '.avif');
    // Captures middle folders that may represent model name.
    const middleDirs = parts.slice(2, parts.length - 1);
    // Filters non-generic folder names to construct explicit model name.
    const modelParts = middleDirs.filter((segment) => !genericDirPattern.test(segment));
    // Chooses best-effort model name from folder data or filename fallback.
    const modelName = modelParts.length > 0 ? modelParts.join(' - ') : (middleDirs[0] || fileNameNoExt);
    // Derives color name from filename suffix.
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

// Resolves available local mockup catalog directory.
function resolveMockupsRoot() {
  // Defines candidate catalog paths in app source and installed dependency locations.
  const candidates = [
    path.resolve(process.cwd(), 'src', 'stories', 'assets', 'mockups'),
    path.resolve(process.cwd(), 'node_modules', '@portfoliablejs', 'valence', 'src', 'stories', 'assets', 'mockups')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) || null;
}

// Prints thumbnail catalog in human-readable or JSON format.
function printThumbnailCatalog(catalog, flags, mockupsRoot) {
  // Computes sorted category list for deterministic output.
  const categoryNames = Object.keys(catalog).sort((a, b) => a.localeCompare(b));
  // Counts total brand nodes for summary metadata.
  const brandCount = categoryNames.reduce((acc, category) => acc + Object.keys(catalog[category]).length, 0);
  // Counts total model nodes for summary metadata.
  const modelCount = categoryNames.reduce((acc, category) => {
    return acc + Object.values(catalog[category]).reduce((modelAcc, modelsByBrand) => modelAcc + Object.keys(modelsByBrand).length, 0);
  }, 0);

  if (flags.json) {
    // Builds fully sorted serializable catalog object.
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

  // Defines max number of printed colors unless full output is requested.
  const colorLimit = flags.full ? Number.POSITIVE_INFINITY : 12;

  // Prints tree-style category->brand->model->colors catalog output.
  categoryNames.forEach((category) => {
    // Resolves sorted brand names for this category.
    const brands = Object.keys(catalog[category]).sort((a, b) => a.localeCompare(b));
    console.log(`\n${bold}${category}${reset}`);

    brands.forEach((brand) => {
      // Resolves sorted model names for this brand.
      const models = Object.keys(catalog[category][brand]).sort((a, b) => a.localeCompare(b));
      console.log(`  ${brand}`);

      models.forEach((model) => {
        // Resolves sorted list of available model colors.
        const colors = [...catalog[category][brand][model]].sort((a, b) => a.localeCompare(b));
        // Limits visible colors for concise default output.
        const visibleColors = colors.slice(0, colorLimit);
        // Computes hidden color count when not using --full.
        const hiddenCount = Math.max(0, colors.length - visibleColors.length);
        // Appends hint suffix when additional colors are omitted.
        const moreSuffix = hiddenCount > 0 ? ` (+${hiddenCount} more, run with --full)` : '';
        console.log(`    - ${model}: ${visibleColors.join(', ')}${moreSuffix}`);
      });
    });
  });
}

// Executes thumbnail-options command flow.
function runThumbnailOptions(flags) {
  // Ensures valence compatibility assets are ready before catalog discovery.
  ensureValenceCompatibility();
  // Resolves available mockup root path.
  const mockupsRoot = resolveMockupsRoot();

  if (!mockupsRoot) {
    console.error(`${red}${bold}Could not locate Valence mockup catalog.${reset}`);
    console.error('Expected either src/stories/assets/mockups or node_modules/@portfoliablejs/valence/src/stories/assets/mockups');
    return 1;
  }

  // Builds device catalog from resolved mockup tree.
  const catalog = buildThumbnailCatalog(mockupsRoot);
  if (Object.keys(catalog).length === 0) {
    console.error(`${red}${bold}No mockup assets were found in catalog.${reset}`);
    return 1;
  }

  printThumbnailCatalog(catalog, flags, mockupsRoot);
  return 0;
}

// Prints startup summary box for dev server sessions.
function printStartupBox({ localUrl, networkUrl, localVersion, latestVersion }) {
  // Sets fixed box width for visual consistency.
  const width = 72;
  // Returns one formatted bordered line.
  const line = (text = '') => `│ ${text.padEnd(width - 4)} │`;
  // Returns an empty spacer line.
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
    console.log(line(`Upgrade now: ${green}npm update @portfoliablejs/create-portfoliable${reset}`));
  }

  console.log('╰' + '─'.repeat(width - 2) + '╯');
  console.log(`${dim}│  Press Ctrl+C to stop the server${reset}\n`);
}

// Starts Vite dev server and prints startup context.
async function runDevServer(flags) {
  // Resolves requested port or uses default dev port.
  const port = Number.isFinite(flags.port) ? flags.port : 5173;

  // Creates Vite development server instance.
  const server = await createServer({
    server: {
      host: flags.host,
      port,
      open: Boolean(flags.open)
    }
  });

  await server.listen();

  // Uses HTTP protocol for displayed URLs.
  const protocol = 'http';
  // Resolves actual bound port from Vite config fallback.
  const resolvedPort = server.config.server.port || port;
  // Builds localhost URL for quick open.
  const localUrl = `${protocol}://localhost:${resolvedPort}/`;
  // Resolves first non-local network address.
  const networkAddress = firstNetworkAddress();
  // Builds network URL for external device testing.
  const networkUrl = networkAddress ? `${protocol}://${networkAddress}:${resolvedPort}/` : 'Not available';

  // Resolves currently running CLI package version.
  const localVersion = resolvePackageVersion();
  // Fetches latest published package version.
  const latestVersion = await fetchLatestVersion();

  printStartupBox({ localUrl, networkUrl, localVersion, latestVersion });

  // Handles Ctrl+C for graceful server shutdown.
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

// Runs Vite production build and logs concise status output.
async function runBuild() {
  console.log(`${cyan}${bold}Building Portfoliable...${reset}`);
  await viteBuild();
  console.log(`${green}Build complete.${reset}`);
}

// Starts Vite preview server for production build verification.
async function runPreview(flags) {
  // Resolves requested preview port or uses default.
  const previewPort = Number.isFinite(flags.port) ? flags.port : 4173;
  // Starts preview server bound to requested host/port.
  const previewServer = await vitePreview({ preview: { host: flags.host, port: previewPort } });
  // Uses HTTP protocol for displayed URLs.
  const protocol = 'http';
  // Builds localhost preview URL.
  const localUrl = `${protocol}://localhost:${previewPort}/`;
  // Resolves first non-local network address.
  const networkAddress = firstNetworkAddress();
  // Builds network preview URL for external devices.
  const networkUrl = networkAddress ? `${protocol}://${networkAddress}:${previewPort}/` : 'Not available';

  // Sets fixed box width for preview startup output.
  const width = 72;
  // Builds bordered line helper for preview startup box.
  const line = (text = '') => `│ ${text.padEnd(width - 4)} │`;
  console.log('╭' + '─'.repeat(width - 2) + '╮');
  console.log(line(`${cyan}${bold}Portfoliable preview ready${reset}`));
  console.log(line(`${dim}Serving the production build locally.${reset}`));
  console.log(line());
  console.log(line(`${bold}Local:${reset} ${localUrl}`));
  console.log(line(`${bold}On your network:${reset} ${networkUrl}`));
  console.log('╰' + '─'.repeat(width - 2) + '╯');
  console.log(`${dim}│  Press Ctrl+C to stop the server${reset}\n`);

  // Handles Ctrl+C for graceful preview server shutdown.
  process.on('SIGINT', async () => {
    await previewServer.httpServer.close();
    process.exit(0);
  });
}

// === COMMAND DISPATCH ===
// Routes parsed command to matching execution path.
async function main() {
  // Parses command and flags from process arguments.
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
    // Runs markdown content validation command.
    const exitCode = runValidation();
    process.exit(exitCode);
    return;
  }

  if (command === 'scaffold-case') {
    // Runs case scaffolder for scaffold-case alias.
    const exitCode = runCaseScaffold({ outFile: flags.out || undefined, name: flags.name || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  if (command === 'create-case') {
    // Runs case scaffolder for create-case alias.
    const exitCode = runCaseScaffold({ outFile: flags.out || undefined, name: flags.name || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  if (command === 'thumbnail-options') {
    // Runs thumbnail catalog inspection command.
    const exitCode = runThumbnailOptions(flags);
    process.exit(exitCode);
    return;
  }

  console.error(`${red}${bold}Unknown command:${reset} ${command}`);
  console.log('Use one of: dev, build, preview, validate, create-case, scaffold-case, thumbnail-options');
  process.exit(1);
}

// Executes command dispatcher and converts uncaught failures into non-zero exit.
main().catch((error) => {
  console.error(`${bold}${red}✕ Failed to run Portfoliable:${reset}`, error);
  process.exit(1);
});
