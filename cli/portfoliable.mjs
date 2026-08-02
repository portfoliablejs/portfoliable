#!/usr/bin/env node
// Thin compatibility wrapper: forward root CLI calls to canonical create-portfoliable CLI.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(here, '..', 'create-portfoliable', 'cli', 'portfoliable.mjs');
const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

process.exit(result.status ?? 1);
