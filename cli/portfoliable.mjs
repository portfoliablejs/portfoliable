#!/usr/bin/env node

import { createServer, build as viteBuild, preview as vitePreview } from 'vite';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { runValidation } from '../scripts/validate-content.mjs';
import { runScaffold } from '../scripts/scaffold-consumer.mjs';
import { runCaseScaffold } from '../scripts/scaffold-case.mjs';

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
    const response = await fetch('https://registry.npmjs.org/@portfoliablejs/portfoliable/latest');
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
      name: null
    }
  };

  const commandCandidate = argv[2];
  const knownCommands = new Set(['dev', 'build', 'preview', 'validate', 'scaffold', 'scaffold-case']);
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

    if (!arg.startsWith('--') && parsed.flags.port === null) {
      const asNumber = Number(arg);
      if (Number.isFinite(asNumber)) {
        parsed.flags.port = asNumber;
      }
    }
  }

  return parsed;
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
    console.log(line(`Upgrade now: ${green}npm update @portfoliablejs/portfoliable${reset}`));
  }

  console.log('╰' + '─'.repeat(width - 2) + '╯');
  console.log(`${dim}│  Press Ctrl+C to stop the server${reset}\n`);
}

async function runDevServer(flags) {
  const port = Number.isFinite(flags.port) ? flags.port : 5173;

  const server = await createServer({
    server: {
      host: flags.host,
      port
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
    await runDevServer(flags);
    return;
  }

  if (command === 'build') {
    await runBuild();
    return;
  }

  if (command === 'preview') {
    await runPreview(flags);
    return;
  }

  if (command === 'validate') {
    const exitCode = runValidation();
    process.exit(exitCode);
    return;
  }

  if (command === 'scaffold') {
    const exitCode = runScaffold({ outFile: flags.out || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  if (command === 'scaffold-case') {
    const exitCode = runCaseScaffold({ outFile: flags.out || undefined, name: flags.name || undefined, force: flags.force });
    process.exit(exitCode);
    return;
  }

  console.error(`${red}${bold}Unknown command:${reset} ${command}`);
  console.log('Use one of: dev, build, preview, validate, scaffold, scaffold-case');
  process.exit(1);
}

main().catch((error) => {
  console.error(`${bold}${red}✕ Failed to run Portfoliable:${reset}`, error);
  process.exit(1);
});
