#!/usr/bin/env node
// File: scripts/scaffold-case.mjs
// Purpose: Generate a starter markdown case for a Portfoliable consumer app.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';

// === DEFAULTS ===
// Defines default output path used for new scaffolded case file.
const DEFAULT_OUTPUT = 'src/content/cases/my-case.md';
// Defines default case name used when no name is provided.
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
  // Cleans separators and duplicate whitespace in user-provided title text.
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

// === ARGUMENT PARSING ===
// Read CLI flags from the current process argv.
function parseArgs(argv) {
  // Extracts script args excluding node executable and script path.
  const args = argv.slice(2);
  // Initializes parser output with defaults.
  const options = {
    outFile: DEFAULT_OUTPUT,
    name: DEFAULT_NAME,
    force: false
  };

  for (let i = 0; i < args.length; i += 1) {
    // Reads current argument token under evaluation.
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
  // Derives normalized title for localized title fields.
  const title = toTitle(name);
  // Derives normalized slug for id/slug fields.
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
  // Resolves working directory used for output file path calculation.
  const cwd = options.cwd || process.cwd();
  // Resolves output filename using option or default fallback.
  const outFile = options.outFile || DEFAULT_OUTPUT;
  // Resolves case display name using option or default fallback.
  const name = options.name || DEFAULT_NAME;
  // Coerces force flag to explicit boolean.
  const force = Boolean(options.force);
  // Resolves absolute output path for scaffold file.
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

// === SCRIPT ENTRYPOINT ===
// Executes argument parsing and scaffold run when script is invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parses CLI options from current process arguments.
  const options = parseArgs(process.argv);
  // Runs scaffolder and captures process exit code.
  const exitCode = runCaseScaffold(options);
  process.exit(exitCode);
}
