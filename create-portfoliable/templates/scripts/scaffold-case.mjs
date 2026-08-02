#!/usr/bin/env node

// File: create-portfoliable/templates/scripts/scaffold-case.mjs
// Purpose: Generate starter markdown case files inside template-generated consumer projects.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';

// === DEFAULTS ===
// Defines the default output path used when callers do not provide --out.
const DEFAULT_OUTPUT = 'src/content/cases/my-case.md';
// Defines fallback title text used when callers do not provide --name.
const DEFAULT_NAME = 'My Case';

// === STRING NORMALIZATION HELPERS ===
// Converts arbitrary text into a markdown-safe slug used for id and slug fields.
function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-case';
}

// Converts arbitrary text into a user-friendly title case string.
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

// === CLI ARGUMENT PARSING ===
// Reads CLI flags and produces normalized scaffold options.
function parseArgs(argv) {
  // Slices process arguments to skip node executable and script path.
  const args = argv.slice(2);
  // Initializes parser output with defaults so missing flags still produce valid output.
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

// === TEMPLATE CONSTRUCTION ===
// Produces localized starter markdown content for a new case study.
function buildTemplate({ name, slug }) {
  // Derives a normalized visible title from provided input.
  const title = toTitle(name);
  // Derives a safe slug fallback from either explicit slug or case name.
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

// === SCAFFOLD EXECUTION ===
// Creates a new case markdown file, respecting overwrite safety rules.
export function runCaseScaffold(options = {}) {
  // Resolves working directory so script can be invoked from any location.
  const cwd = options.cwd || process.cwd();
  // Reads desired output file path from options or uses default path.
  const outFile = options.outFile || DEFAULT_OUTPUT;
  // Reads desired case display name from options or uses default title.
  const name = options.name || DEFAULT_NAME;
  // Converts force option to explicit boolean for overwrite checks.
  const force = Boolean(options.force);
  // Resolves absolute output path to avoid relative path ambiguity.
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
// Executes argument parsing and scaffold generation when script is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parses CLI options from process arguments.
  const options = parseArgs(process.argv);
  // Executes scaffold flow and captures exit code.
  const exitCode = runCaseScaffold(options);
  process.exit(exitCode);
}
