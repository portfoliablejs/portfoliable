#!/usr/bin/env node
// File: scripts/generate-password-hash.mjs
// Purpose: Convenience wrapper to run the template password generator from repository root.
// Author: Lio Schimanko

// MARK: IMPORTS
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// MARK: PATH RESOLUTION
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetScript = path.resolve(__dirname, '../templates/scripts/generate-password-hash.mjs');

// MARK: SCRIPT EXECUTION
const result = spawnSync(process.execPath, [targetScript, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

if (result.error) {
  console.error(`[password-hash] Failed to run generator: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
