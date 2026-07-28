#!/usr/bin/env node
// File: scripts/sync-template-shared.mjs
// Purpose: Keep selected initializer template files synchronized with canonical root sources.
// Author: Lio Schimanko

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const TEMPLATE_PARSER_HEADER = [
  '// File: create-portfoliable/templates/src/parser/markdown.js',
  '// Purpose: Parse template markdown cases into normalized case data.',
  '// Author: Lio Schimanko',
  '// Note: Auto-synced from src/parser/markdown.js. Edit the canonical source only.',
  ''
].join('\n');

const mappings = [
  {
    source: 'src/parser/markdown.js',
    target: 'create-portfoliable/templates/src/parser/markdown.js',
    transform: (sourceText) => {
      const lines = sourceText.split('\n');
      let bodyStart = 0;

      if (
        lines[0]?.startsWith('// File:')
        && lines[1]?.startsWith('// Purpose:')
        && lines[2]?.startsWith('// Author:')
      ) {
        bodyStart = lines[3] === '' ? 4 : 3;
      }

      const body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '');
      return `${TEMPLATE_PARSER_HEADER}${body}`;
    }
  }
];

function resolveRepoPath(relPath) {
  return path.resolve(repoRoot, relPath);
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeUtf8(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function normalizeEol(text) {
  return text.replace(/\r\n/g, '\n');
}

function syncOne(mapping, mode) {
  const sourcePath = resolveRepoPath(mapping.source);
  const targetPath = resolveRepoPath(mapping.target);
  const sourceText = readUtf8(sourcePath);
  const expectedText = mapping.transform ? mapping.transform(sourceText) : sourceText;
  const expectedNormalized = normalizeEol(expectedText);

  const currentText = fs.existsSync(targetPath) ? readUtf8(targetPath) : '';
  const currentNormalized = normalizeEol(currentText);
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

function main() {
  const args = new Set(process.argv.slice(2));
  const mode = args.has('--check') ? 'check' : 'write';

  const results = mappings.map((mapping) => syncOne(mapping, mode));
  const ok = results.every(Boolean);

  if (!ok) {
    console.error('[sync:templates] Template files are out of sync. Run: npm run sync:templates');
    process.exit(1);
  }
}

main();
