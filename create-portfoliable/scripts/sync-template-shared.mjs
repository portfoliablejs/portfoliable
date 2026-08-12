#!/usr/bin/env node
// File: scripts/sync-template-shared.mjs
// Purpose: Keep selected initializer template files synchronized with canonical root sources.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// MARK: PATH CONSTANTS
// Resolves this script directory path.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolves package root used to resolve mapped source/target files.
const repoRoot = path.resolve(__dirname, '..');

// MARK: TEMPLATE HEADER
// Defines template parser header injected into synchronized parser target file.
const TEMPLATE_PARSER_HEADER = [
  '// File: create-portfoliable/templates/src/parser/markdown.js',
  '// Purpose: Parse template markdown cases into normalized case data.',
  '// Author: Lio Schimanko',
  '// Note: Auto-synced from src/parser/markdown.js. Edit the canonical source only.',
  ''
].join('\n');

// MARK: SYNC MAPPINGS
// Lists source/target mapping definitions and optional transform functions.
const mappings = [
  {
    source: 'src/parser/markdown.js',
    target: 'templates/src/parser/markdown.js',
    // Removes source header and injects template-specific header contract.
    transform: (sourceText) => {
      // Splits source into lines for header detection.
      const lines = sourceText.split('\n');
      // Tracks start index for parser body after optional 3-line header.
      let bodyStart = 0;

      if (
        lines[0]?.startsWith('// File:')
        && lines[1]?.startsWith('// Purpose:')
        && lines[2]?.startsWith('// Author:')
      ) {
        bodyStart = lines[3] === '' ? 4 : 3;
      }

      // Extracts parser body and strips leading blank lines.
      const body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '');
      return `${TEMPLATE_PARSER_HEADER}${body}`;
    }
  }
];

// Resolves repository-relative path to absolute path.
function resolveRepoPath(relPath) {
  return path.resolve(repoRoot, relPath);
}

// Reads UTF-8 file content.
function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Writes UTF-8 file content, creating parent directories when needed.
function writeUtf8(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

// Normalizes EOL format to LF for reliable cross-platform comparisons.
function normalizeEol(text) {
  return text.replace(/\r\n/g, '\n');
}

// Executes one mapping sync action in check or write mode.
function syncOne(mapping, mode) {
  // Resolves mapped source path.
  const sourcePath = resolveRepoPath(mapping.source);
  // Resolves mapped target path.
  const targetPath = resolveRepoPath(mapping.target);
  // Reads source file text.
  const sourceText = readUtf8(sourcePath);
  // Applies optional transform to source text.
  const expectedText = mapping.transform ? mapping.transform(sourceText) : sourceText;
  // Normalizes expected text for comparison.
  const expectedNormalized = normalizeEol(expectedText);

  // Reads current target file text when present.
  const currentText = fs.existsSync(targetPath) ? readUtf8(targetPath) : '';
  // Normalizes current target text for comparison.
  const currentNormalized = normalizeEol(currentText);
  // Determines whether target file already matches expected content.
  const isSynced = expectedNormalized === currentNormalized;

  if (mode === 'check') {
    if (!isSynced) {
      console.error(`[sync:templates] Drift detected: ${mapping.target}`);
      console.error(`[sync:templates] Canonical source: ${mapping.source}`);
      return false;
    }
    console.log(`[sync:templates] OK: ${mapping.target}`);
    return true;
  }

  if (!isSynced) {
    writeUtf8(targetPath, expectedText.endsWith('\n') ? expectedText : `${expectedText}\n`);
    console.log(`[sync:templates] Updated: ${mapping.target}`);
  } else {
    console.log(`[sync:templates] Unchanged: ${mapping.target}`);
  }

  return true;
}

// MARK: SCRIPT ENTRYPOINT
// Runs all mappings in check or write mode and exits non-zero on drift.
function main() {
  // Parses CLI args used to switch between check and write mode.
  const args = new Set(process.argv.slice(2));
  // Resolves operating mode from CLI flags.
  const mode = args.has('--check') ? 'check' : 'write';

  // Runs sync/check for each configured mapping.
  const results = mappings.map((mapping) => syncOne(mapping, mode));
  // Aggregates overall success result.
  const ok = results.every(Boolean);

  if (!ok) {
    console.error('[sync:templates] Template files are out of sync. Run: npm run sync:templates');
    process.exit(1);
  }
}

// Executes sync script main function.
main();
