#!/usr/bin/env node
// File: scripts/scaffold-case.mjs
// Purpose: Generate a starter markdown case for a Portfoliable consumer app.
// Author: Lio Schimanko

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OUTPUT = 'src/content/cases/my-case.md';
const DEFAULT_NAME = 'My Case';

// Convert user input into a URL-safe slug.
function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-case';
}

  // Normalize a freeform case name into title case.
function toTitle(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!cleaned) return DEFAULT_NAME;

  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

  // Read CLI flags from the current process argv.
function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    outFile: DEFAULT_OUTPUT,
    name: DEFAULT_NAME,
    force: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--out' && args[i + 1]) {
      options.outFile = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

// Build the markdown scaffold body used for new cases.
function buildTemplate({ name, slug }) {
  const title = toTitle(name);
  const cleanSlug = toSlug(slug || name);

  return `---
id: ${cleanSlug}
slug: ${cleanSlug}
title.en: ${title}
title.pt: ${title}
shortDesc.en: Write a short summary for this case.
shortDesc.pt: Escreva um resumo curto para este case.
readTime.en: 3 min
readTime.pt: 3 min
year.en: 2026 - Personal Project
year.pt: 2026 - Projeto Pessoal
thumbSrc.en: https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop
thumbSrc.pt: https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop
thumbCategory: mobile
thumbBrand: apple
thumbModel: Apple iPhone 17
thumbColor: Black
---
<!-- lang:en -->
## Problem
Describe the problem in English.

## Solution
Describe the solution in English.

<!-- lang:pt -->
## Problema
Descreva o problema em portugues.

## Solucao
Descreva a solucao em portugues.
`;
}

// Create the scaffold case file unless the destination already exists.
export function runCaseScaffold(options = {}) {
  const cwd = options.cwd || process.cwd();
  const outFile = options.outFile || DEFAULT_OUTPUT;
  const name = options.name || DEFAULT_NAME;
  const force = Boolean(options.force);
  const outputPath = path.resolve(cwd, outFile);

  if (fs.existsSync(outputPath) && !force) {
    console.error(`[scaffold-case] Refusing to overwrite existing file: ${outputPath}`);
    console.error('[scaffold-case] Use --force to overwrite.');
    return 1;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildTemplate({ name, slug: path.basename(outFile, '.md') }), 'utf8');
  console.log(`[scaffold-case] Created starter case file: ${outputPath}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv);
  const exitCode = runCaseScaffold(options);
  process.exit(exitCode);
}
