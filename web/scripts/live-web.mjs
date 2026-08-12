#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(webRoot, 'docs');
const vitepressRoot = path.join(webRoot, '.vitepress');

function parseArgs(argv) {
  const parsed = {
    host: '127.0.0.1',
    port: '4173'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--host') {
      parsed.host = String(argv[index + 1] || parsed.host);
      index += 1;
      continue;
    }

    if (token === '--port') {
      parsed.port = String(argv[index + 1] || parsed.port);
      index += 1;
    }
  }

  return parsed;
}

const options = parseArgs(process.argv.slice(2));
let child = null;
let restarting = false;
let restartTimer = null;
let shuttingDown = false;

function startServer() {
  child = spawn(
    'npm',
    ['run', 'dev', '--', '--host', options.host, '--port', options.port],
    {
      cwd: webRoot,
      stdio: 'inherit',
      shell: false,
      env: process.env
    }
  );

  child.on('exit', () => {
    child = null;

    if (shuttingDown || !restarting) {
      return;
    }

    restarting = false;
    startServer();
  });
}

function restartServer(reason) {
  if (shuttingDown) return;

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;

    if (!child) {
      console.log(`[live-web] Restarting VitePress dev (${reason})`);
      startServer();
      return;
    }

    console.log(`[live-web] Restarting VitePress dev (${reason})`);
    restarting = true;
    child.kill('SIGTERM');
  }, 180);
}

function watchPath(targetPath, label) {
  if (!fs.existsSync(targetPath)) return null;

  return fs.watch(targetPath, { recursive: true }, (eventType, fileName) => {
    if (eventType !== 'rename' && eventType !== 'change') return;
    const normalizedName = String(fileName || '').trim();
    if (!normalizedName) return;

    const lowerName = normalizedName.toLowerCase();
    const isStructuralDocsChange = label === 'docs' && eventType === 'rename';
    const isConfigChange = label === '.vitepress' && /config\.mjs$|theme\//i.test(normalizedName);

    if (isStructuralDocsChange || isConfigChange) {
      restartServer(`${label}:${normalizedName}`);
    }
  });
}

function shutdown(exitCode = 0) {
  shuttingDown = true;
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  watchers.forEach((watcher) => watcher?.close());

  if (!child) {
    process.exit(exitCode);
    return;
  }

  child.once('exit', () => process.exit(exitCode));
  child.kill('SIGTERM');
}

const watchers = [
  watchPath(docsRoot, 'docs'),
  watchPath(vitepressRoot, '.vitepress')
].filter(Boolean);

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

startServer();