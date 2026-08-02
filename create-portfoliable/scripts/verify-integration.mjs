// File: create-portfoliable/scripts/verify-integration.mjs
// Purpose: Verify local runtime and optional consumer integration build workflows.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// === PATH CONSTANTS ===
// Resolves the current script filename for deterministic root-path calculation.
const __filename = fileURLToPath(import.meta.url);
// Resolves the directory containing this script.
const __dirname = path.dirname(__filename);
// Resolves canonical runtime package root.
const portfoliableRoot = path.resolve(__dirname, '..');
// Resolves a local sibling consumer repository path used for optional integration checks.
const portfolioRoot = path.resolve(portfoliableRoot, '..', '..', 'portfolio');

// === COMMAND EXECUTOR ===
// Executes one labeled integration step and throws on non-zero status.
function runStep(label, command, args, cwd) {
  console.log(`\n[verify] ${label}`);
  // Executes verification command step.
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`Step failed: ${label}`);
  }
}

// === ENVIRONMENT DETECTION ===
// Detects whether a local portfolio consumer repository is available for cross-repo checks.
function hasPortfolioConsumer() {
  // Points to package manifest used as existence marker for the consumer repo.
  const packageJsonPath = path.join(portfolioRoot, 'package.json');
  return fs.existsSync(packageJsonPath);
}

// === VERIFICATION ORCHESTRATION ===
// Runs validation/build checks for runtime package and optionally for local consumer project.
function main() {
  // Parses optional CLI flags used to control consumer verification behavior.
  const args = new Set(process.argv.slice(2));
  // Enables skipping local consumer build when flag is provided.
  const skipConsumer = args.has('--skip-consumer');

  runStep('Validate markdown content', 'npm', ['run', 'validate:content'], portfoliableRoot);
  runStep('Build portfoliable', 'npm', ['run', 'build'], portfoliableRoot);

  if (!skipConsumer && hasPortfolioConsumer()) {
    runStep('Build portfolio consumer', 'npm', ['run', 'build'], portfolioRoot);
  } else if (!skipConsumer) {
    console.log('[verify] portfolio consumer not found. Skipping consumer build.');
  }

  console.log('\n[verify] Integration verification passed.');
}

// === SCRIPT ENTRYPOINT ===
// Executes integration verification and converts thrown errors to exit code 1.
try {
  main();
} catch (error) {
  console.error(`\n[verify] ${error.message}`);
  process.exit(1);
}
