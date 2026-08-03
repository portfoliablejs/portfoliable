#!/usr/bin/env node
// File: cli/portfoliable.mjs
// Purpose: Forward root-level CLI calls to the canonical create-portfoliable runtime CLI.
// Author: Lio Schimanko

// === IMPORTS ===
// Thin repository entrypoint: forward root CLI calls to canonical create-portfoliable CLI.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// === PATH RESOLUTION ===
// Resolves the directory containing this wrapper script.
const here = path.dirname(fileURLToPath(import.meta.url));
// Resolves the canonical CLI entrypoint inside create-portfoliable.
const target = path.resolve(here, '..', 'create-portfoliable', 'cli', 'portfoliable.mjs');
// Spawns a Node subprocess that forwards all CLI arguments to the canonical runtime CLI.
const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

// === EXIT CODE FORWARDING ===
// Exits this wrapper process using the underlying CLI status code.
process.exit(result.status ?? 1);
