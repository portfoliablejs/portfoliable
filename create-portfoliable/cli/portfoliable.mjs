#!/usr/bin/env node
// File: cli/portfoliable.mjs
// Purpose: Main Portfoliable CLI for development, build, preview, validation, and scaffolding.
// Author: Lio Schimanko

// MARK: IMPORTS
import { createServer, build as viteBuild, preview as vitePreview } from 'vite';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { runValidation } from '../templates/scripts/validate-content.mjs';
import { runCaseScaffold } from '../templates/scripts/scaffold-case.mjs';
import { runDeleteCase } from '../templates/scripts/delete-case.mjs';
import { ensureValenceCompatibility } from '../scripts/ensure-valence-index-css.mjs';
import { runLocaleSync, watchLocaleSync } from '../templates/scripts/sync-locales.mjs';
import { runAddLanguage } from '../templates/scripts/add-language.mjs';
import { runDeleteLanguage } from '../templates/scripts/delete-language.mjs';
import {
  ui,
  printRailSegment,
  printRailAttachedBox,
  printRailSpacer,
  promptYesNoDots,
  isInteractiveTerminal,
  readProjectUiPreferences
} from '../scripts/terminal-ui.mjs';
import { resolveConsumerRuntimeAliases } from '../scripts/consumer-runtime-aliases.mjs';

// MARK: TERMINAL STYLES
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

// MARK: VERSION AND NETWORK HELPERS
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
    const response = await fetch('https://registry.npmjs.org/create-portfoliable/latest');
    if (!response.ok) return null;

    // Parses registry response payload.
    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

// MARK: CLI ARGUMENT PARSING
// Parses command and flags from argv into normalized runtime options.
function parseCliArgs(argv) {
  // Initializes parser defaults for command and supported flags.
  const parsed = {
    command: 'dev',
    flags: {
      host: '0.0.0.0',
      port: null,
      out: null,
      force: false,
      name: null,
      id: null,
      code: null,
      htmlLang: null,
      direction: null,
      open: true,
      json: false,
      full: false,
      watch: false,
      deleteForce: false,
      showCommands: null
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
    'sync-locales',
    'add-language',
    'delete-language',
    'delete-case',
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
        parsed.flags.host = '0.0.0.0';
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
      parsed.flags.deleteForce = true;
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

    if (arg === '--id') {
      const next = argv[i + 1];
      if (next) {
        parsed.flags.id = next;
        i += 1;
      }
      continue;
    }

    if (arg === '--code') {
      const next = argv[i + 1];
      if (next) {
        parsed.flags.code = next;
        i += 1;
      }
      continue;
    }

    if (arg === '--html-lang' || arg === '--htmlLang') {
      const next = argv[i + 1];
      if (next) {
        parsed.flags.htmlLang = next;
        i += 1;
      }
      continue;
    }

    if (arg === '--direction') {
      const next = argv[i + 1];
      if (next) {
        parsed.flags.direction = next;
        i += 1;
      }
      continue;
    }

    if (arg === '--rtl') {
      parsed.flags.direction = 'rtl';
      continue;
    }

    if (arg === '--ltr') {
      parsed.flags.direction = 'ltr';
      continue;
    }

    if (arg === '--open') {
      parsed.flags.open = true;
      continue;
    }

    if (arg === '--no-open') {
      parsed.flags.open = false;
      continue;
    }

    if (arg === '--commands') {
      parsed.flags.showCommands = true;
      continue;
    }

    if (arg === '--no-commands') {
      parsed.flags.showCommands = false;
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

    if (arg === '--watch') {
      parsed.flags.watch = true;
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

// MARK: FILESYSTEM HELPERS
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
  const modelPattern = new RegExp(`^${escapeRegex(normalizedModel)}[\s_\-—–]*`, 'i');
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
    path.resolve(process.cwd(), 'node_modules', '@portfoliable', 'valence', 'src', 'stories', 'assets', 'mockups')
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
  // Counts total variant rows for summary metadata.
  const variantCount = categoryNames.reduce((acc, category) => {
    return acc + Object.values(catalog[category]).reduce((brandAcc, modelsByBrand) => {
      return brandAcc + Object.values(modelsByBrand).reduce((modelAcc, colors) => modelAcc + colors.size, 0);
    }, 0);
  }, 0);

  const outputPath = writeThumbnailOptionsCatalog(catalog, mockupsRoot);
  console.log(`${green}Wrote thumbnail options catalog${reset}: ${outputPath}`);
  console.log(`${dim}Categories: ${categoryNames.length} | Brands: ${brandCount} | Models: ${modelCount} | Variants: ${variantCount}${reset}`);
}

// Writes a generated thumbnail options file inside the template source tree.
function writeThumbnailOptionsCatalog(catalog, mockupsRoot) {
  const outputPath = path.resolve(process.cwd(), 'templates', 'src', 'content', 'thumbnail-options.generated.json');
  const items = [];

  Object.keys(catalog).sort((a, b) => a.localeCompare(b)).forEach((category) => {
    Object.keys(catalog[category]).sort((a, b) => a.localeCompare(b)).forEach((brand) => {
      Object.keys(catalog[category][brand]).sort((a, b) => a.localeCompare(b)).forEach((model) => {
        [...catalog[category][brand][model]].sort((a, b) => a.localeCompare(b)).forEach((color) => {
          items.push({
            thumbCategory: category,
            thumbBrand: brand,
            thumbModel: model,
            thumbColor: color
          });
        });
      });
    });
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ source: mockupsRoot, generatedAt: new Date().toISOString(), items }, null, 2)}\n`, 'utf8');
  return outputPath;
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
  const lines = [
    `${green}${bold}Portfoliable ready!${reset}`,
    `${dim}Dev server is live and ready for editing.${reset}`,
    '',
    `${bold}Local:${reset} ${localUrl}`,
    `${bold}On your network:${reset} ${networkUrl}`,
    '',
    `${bold}Next:${reset} open the local URL in your browser.`
  ];

  if (latestVersion && latestVersion !== localVersion && !latestVersion.includes('alpha')) {
    lines.push('');
    lines.push(`${yellow}A new version (${latestVersion}) is available!${reset}`);
    lines.push(`Upgrade now: ${green}npm update create-portfoliable${reset}`);
    lines.push(`If it still persists, run: ${green}npm install create-portfoliable@latest${reset}`);
    lines.push('Read changelog:');
    lines.push(`${dim}https://github.com/portfoliablejs/portfoliable/blob/main/CHANGELOG.md${reset}`);
  }

  printRailAttachedBox({ width: 96, lines });
  console.log(`${dim}│${reset}`);
  console.log(`${dim}│${reset} ${dim}Press Ctrl+C to stop the server${reset}\n`);
}

// Prints a categorized command guide for runtime features.
function printCommandGuide({ fancyDots }) {
  const marker = fancyDots ? `${ui.blue}●${ui.reset}` : '-';
  const lines = [
    `${ui.bold}Portfoliable command guide${ui.reset}`,
    `${ui.dim}Everything is grouped so you can move faster.${ui.reset}`,
    '',
    `${marker} ${ui.bold}Case management${ui.reset}`,
    '  npm run portfoliable-create-case -- --name "Checkout Revamp"',
    '  npm run portfoliable-delete-case -- --id checkout-revamp',
    '',
    `${marker} ${ui.bold}Language management${ui.reset}`,
    '  npx portfoliable add-language --code es --name "Spanish" --html-lang es',
    '  npx portfoliable delete-language --code es --force',
    '  npm run portfoliable-sync-locales',
    '',
    `${marker} ${ui.bold}Thumbnail options${ui.reset}`,
    '  npm run portfoliable-thumbnail-options',
    '  writes templates/src/content/thumbnail-options.generated.json',
    '  each item includes thumbCategory, thumbBrand, thumbModel, thumbColor',
    '',
    `${marker} ${ui.bold}Quality checks${ui.reset}`,
    '  npx portfoliable validate',
    '',
    `${marker} ${ui.bold}Build and preview${ui.reset}`,
    '  npm run portfoliable-build',
    '  npm run portfoliable-preview'
  ];

  printRailAttachedBox({ width: 96, lines });
}

// MARK: LOCAL PROTECTION API HELPERS
function resolvePhpDocRoot(cwd) {
  const candidates = [
    path.resolve(cwd, 'public'),
    path.resolve(cwd, 'templates', 'public')
  ];

  return candidates.find((candidate) => {
    const endpointPath = path.resolve(candidate, 'api', 'unlock-case.php');
    return fs.existsSync(endpointPath);
  }) || null;
}

function startLocalPhpApiServer(cwd) {
  const phpDocRoot = resolvePhpDocRoot(cwd);
  if (!phpDocRoot) {
    return { processRef: null, proxyTarget: '' };
  }

  const phpPort = Number(process.env.PORTFOLIABLE_PHP_API_PORT || 8787);
  const processRef = spawn('php', ['-S', `127.0.0.1:${phpPort}`, '-t', phpDocRoot], {
    stdio: 'ignore'
  });

  if (processRef?.on) {
    processRef.on('error', (error) => {
      console.warn(`${yellow}[protection]${reset} Could not start PHP API server (${error.message}).`);
      console.warn(`${yellow}[protection]${reset} Protected-case unlock will fail until /api/unlock-case.php is reachable.`);
    });
  }

  return {
    processRef,
    proxyTarget: `http://127.0.0.1:${phpPort}`
  };
}

// Starts Vite dev server and prints startup context.
async function runDevServer(flags, options = {}) {
  const onShutdown = typeof options.onShutdown === 'function' ? options.onShutdown : () => {};
  const fancyDots = options.fancyDots !== false;
  // Resolves requested port or uses default dev port.
  const port = Number.isFinite(flags.port) ? flags.port : 5173;

  const phpRuntime = startLocalPhpApiServer(process.cwd());
  if (phpRuntime.proxyTarget) {
    process.env.PORTFOLIABLE_PHP_API_PROXY = phpRuntime.proxyTarget;
  }

  const runtimeAliases = resolveConsumerRuntimeAliases(process.cwd());

  // Creates Vite development server instance.
  const server = await createServer({
    resolve: runtimeAliases.length > 0
      ? { alias: runtimeAliases }
      : undefined,
    optimizeDeps: {
      exclude: ['create-portfoliable']
    },
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

  if (fancyDots) {
    printRailSegment({ dot: true, label: `${cyan}${bold}Starting...${reset}` });
    printRailSpacer();
  }

  printStartupBox({ localUrl, networkUrl, localVersion, latestVersion });

  if (isInteractiveTerminal() && flags.open !== false) {
    let showCommands = false;
    if (flags.showCommands === true) {
      showCommands = true;
    } else if (flags.showCommands === false) {
      showCommands = false;
    } else {
      printRailSegment({ dot: true, label: `${cyan}${bold}Quick setup${reset}` });
      showCommands = await promptYesNoDots({
        question: 'Do you want to see all available commands now?',
        yesLabel: 'Yes, show command categories',
        noLabel: 'No, keep startup minimal',
        defaultValue: true,
        width: 96,
        attachedToRail: true
      });
    }

    if (showCommands) {
      printRailSegment({ dot: true, label: `${green}${bold}Opening command guide${reset}` });
      printRailSpacer();
      printCommandGuide({ fancyDots });
      printRailSpacer();
      printRailSegment({ dot: true, label: `${green}${bold}Guide ready${reset}` });
    }
  }

  // Handles Ctrl+C for graceful server shutdown.
  process.on('SIGINT', async () => {
    if (phpRuntime.processRef) {
      phpRuntime.processRef.kill('SIGTERM');
    }
    onShutdown();
    await server.close();
    process.exit(0);
  });
}

// Runs Vite production build and logs concise status output.
async function runBuild() {
  printRailSegment();
  printRailSegment({ dot: true, label: `${cyan}${bold}Starting build...${reset}` });
  console.log(`${cyan}${bold}Building Portfoliable...${reset}`);
  const runtimeAliases = resolveConsumerRuntimeAliases(process.cwd());
  await viteBuild(runtimeAliases.length > 0
    ? { resolve: { alias: runtimeAliases } }
    : undefined);
  console.log(`${green}Build complete.${reset}`);
  printRailSegment({ dot: true, label: `${green}${bold}Build complete.${reset}` });
}

// Starts Vite preview server for production build verification.
async function runPreview(flags, options = {}) {
  const fancyDots = options.fancyDots !== false;
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

  if (fancyDots) {
    printRailSegment();
    printRailSegment({ dot: true, label: `${cyan}${bold}Starting preview...${reset}` });
  }

  printRailAttachedBox({
    width: 72,
    lines: [
      `${cyan}${bold}Portfoliable preview ready${reset}`,
      `${dim}Serving the production build locally.${reset}`,
      '',
      `${bold}Local:${reset} ${localUrl}`,
      `${bold}On your network:${reset} ${networkUrl}`
    ]
  });
  console.log(`${dim}│${reset}`);
  console.log(`${dim}│${reset} ${dim}Press Ctrl+C to stop the server${reset}\n`);

  // Handles Ctrl+C for graceful preview server shutdown.
  process.on('SIGINT', async () => {
    await previewServer.httpServer.close();
    process.exit(0);
  });
}

// MARK: COMMAND DISPATCH
// Routes parsed command to matching execution path.
async function main() {
  // Parses command and flags from process arguments.
  const { command, flags } = parseCliArgs(process.argv);
  const projectPreferences = readProjectUiPreferences(process.cwd());
  const fancyDots = projectPreferences?.fancyDots ?? true;

  if (command === 'dev') {
    ensureValenceCompatibility();
    const stopLocaleWatcher = watchLocaleSync({ cwd: process.cwd(), logger: console });
    await runDevServer(flags, {
      onShutdown: stopLocaleWatcher,
      fancyDots
    });
    return;
  }

  if (command === 'build') {
    ensureValenceCompatibility();
    await runBuild();
    return;
  }

  if (command === 'preview') {
    ensureValenceCompatibility();
    await runPreview(flags, { fancyDots });
    return;
  }

  if (command === 'validate') {
    // Runs markdown content validation command.
    const exitCode = runValidation();
    process.exit(exitCode);
    return;
  }

  if (command === 'sync-locales') {
    if (flags.watch) {
      const dispose = watchLocaleSync({ cwd: process.cwd(), logger: console });
      process.on('SIGINT', () => {
        dispose();
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        dispose();
        process.exit(0);
      });
      return;
    }

    const result = await runLocaleSync({ cwd: process.cwd() });
    console.log(`${green}[sync-locales]${reset} Synced ${result.updatedFiles} file(s) for locales: ${result.localeCodes.join(', ')}`);
    return;
  }

  if (command === 'add-language') {
    const result = await runAddLanguage({
      cwd: process.cwd(),
      code: flags.code || '',
      name: flags.name || '',
      htmlLang: flags.htmlLang || '',
      direction: flags.direction || ''
    });

    if (result.unchanged) {
      console.log(`${yellow}[add-language]${reset} Nothing to change. ${result.localeCode} is already configured as ${result.displayName} (htmlLang=${result.htmlLang}).`);
      console.log(`${green}[add-language]${reset} Locales: ${result.localeCodes.join(', ')}`);
      return;
    }

    const operation = result.existed ? 'Updated' : 'Added';
    console.log(`${green}[add-language]${reset} ${operation} ${result.localeCode} (${result.displayName}) htmlLang=${result.htmlLang}`);
    console.log(`${green}[add-language]${reset} Locales: ${result.localeCodes.join(', ')}`);
    console.log(`${green}[add-language]${reset} Synced ${result.syncResult.updatedFiles} file(s).`);
    return;
  }

  if (command === 'delete-language') {
    const result = await runDeleteLanguage({
      cwd: process.cwd(),
      code: flags.code || '',
      force: flags.deleteForce === true
    });

    if (result.alreadyMissing) {
      console.log(`${yellow}[delete-language]${reset} Nothing to delete. Locale ${result.removedLocale} is already missing.`);
      console.log(`${green}[delete-language]${reset} Locales: ${result.localeCodes.join(', ')}`);
      return;
    }

    console.log(`${green}[delete-language]${reset} Removed ${result.removedLocale}.`);
    console.log(`${green}[delete-language]${reset} Default locale: ${result.defaultLocaleBefore} -> ${result.defaultLocaleAfter}`);
    console.log(`${green}[delete-language]${reset} Locales: ${result.localeCodes.join(', ')}`);
    console.log(`${green}[delete-language]${reset} Synced ${result.syncResult.updatedFiles} file(s).`);
    return;
  }

  if (command === 'create-case') {
    // Runs case scaffolder for create-case alias.
    const exitCode = runCaseScaffold({ outFile: flags.out || undefined, name: flags.name || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  if (command === 'delete-case') {
    const result = runDeleteCase({
      cwd: process.cwd(),
      caseId: flags.id || undefined,
      outFile: flags.out || undefined,
      force: flags.force
    });

    if (result.alreadyMissing) {
      console.log(`${yellow}[delete-case]${reset} Nothing to delete. Case is already missing.`);
      if (result.suggestedIds?.length > 0) {
        console.log(`${green}[delete-case]${reset} Similar existing case ids: ${result.suggestedIds.join(', ')}`);
      }
      return;
    }

    console.log(`${green}[delete-case]${reset} Removed ${result.removedPath}.`);
    if (result.removedDirectory) {
      console.log(`${green}[delete-case]${reset} Removed case directory ${result.removedDirectoryPath}.`);
    }
    return;
  }

  if (command === 'thumbnail-options') {
    // Runs thumbnail catalog inspection command.
    const exitCode = runThumbnailOptions(flags);
    process.exit(exitCode);
    return;
  }

  console.error(`${red}${bold}Unknown command:${reset} ${command}`);
  console.log('Use one of: dev, build, preview, validate, sync-locales, add-language, delete-language, create-case, delete-case, thumbnail-options');
  process.exit(1);
}

// MARK: SCRIPT ENTRYPOINT
// Executes command dispatcher and converts uncaught failures into non-zero exit.
main().catch((error) => {
  console.error(`${bold}${red}✕ Failed to run Portfoliable:${reset}`, error);
  process.exit(1);
});
