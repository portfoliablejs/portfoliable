import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const portfoliableRoot = path.resolve(__dirname, '..');
const portfolioRoot = path.resolve(portfoliableRoot, '..', '..', 'portfolio');

function runStep(label, command, args, cwd) {
  console.log(`\n[verify] ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`Step failed: ${label}`);
  }
}

function hasPortfolioConsumer() {
  const packageJsonPath = path.join(portfolioRoot, 'package.json');
  return fs.existsSync(packageJsonPath);
}

function main() {
  const args = new Set(process.argv.slice(2));
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

try {
  main();
} catch (error) {
  console.error(`\n[verify] ${error.message}`);
  process.exit(1);
}
