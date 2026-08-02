#!/usr/bin/env node
// File: scripts/scaffold-consumer.mjs
// Purpose: Generate a starter consumer cases file for Portfoliable projects.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';

// === DEFAULTS ===
// Defines default output filename for scaffolded consumer cases module.
const DEFAULT_OUTPUT = 'portfolio-cases.template.js';

// Defines full starter template content for scaffolded consumer cases module.
const TEMPLATE_CONTENT = `export const portfolioCases = [
  {
    id: 'my-first-case',
    slug: 'my-first-case',
    title: { en: 'My First Case', pt: 'Meu Primeiro Case' },
    shortDesc: {
      en: 'Describe the project in one sentence.',
      pt: 'Descreva o projeto em uma frase.'
    },
    readTime: { en: '3 min', pt: '3 min' },
    year: { en: '2026 - Personal Project', pt: '2026 - Projeto Pessoal' },
    thumbSrc: {
      en: 'assets/thumbs/en/my-first-case.avif',
      pt: 'assets/thumbs/pt/my-first-case.avif'
    },
    repositoryUrl: 'https://github.com/your-user/your-repo',
    liveUrl: 'https://example.com',
    videoSrc: {
      en: 'assets/videos/en/my-first-case.mp4',
      pt: 'assets/videos/pt/my-first-case.mp4'
    },
    vttSrc: {
      en: 'assets/subtitles/en/my-first-case.vtt',
      pt: 'assets/subtitles/pt/my-first-case.vtt'
    },
    desc: {
      en: '<p class="p1">Write your story here in English.</p>',
      pt: '<p class="p1">Escreva sua historia aqui em portugues.</p>'
    },
    descRecruiter: {
      en: '<p class="p1">Add your technical recruiter summary here.</p>',
      pt: '<p class="p1">Adicione seu resumo tecnico para recrutadores aqui.</p>'
    }
  }
];
`;

// Write the scaffold file, refusing to overwrite unless explicitly requested.
export function runScaffold(options = {}) {
  // Resolves working directory for output path resolution.
  const cwd = options.cwd || process.cwd();
  // Resolves output filename from options or default fallback.
  const outFile = options.outFile || DEFAULT_OUTPUT;
  // Coerces overwrite flag to explicit boolean.
  const force = Boolean(options.force);
  // Resolves absolute output file path.
  const outputPath = path.resolve(cwd, outFile);

  if (fs.existsSync(outputPath) && !force) {
    console.error(`[scaffold] Refusing to overwrite existing file: ${outputPath}`);
    console.error('[scaffold] Use --force to overwrite.');
    return 1;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, TEMPLATE_CONTENT, 'utf8');
  console.log(`[scaffold] Created starter cases file: ${outputPath}`);
  return 0;
}

// === SCRIPT ENTRYPOINT ===
// Executes scaffold flow when script is invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  // Resolves index of --out option token in argv.
  const outIndex = process.argv.findIndex((arg) => arg === '--out');
  // Resolves force flag from argv.
  const force = process.argv.includes('--force');
  // Resolves outFile argument value with default fallback.
  const outFile = outIndex >= 0 ? process.argv[outIndex + 1] : DEFAULT_OUTPUT;
  // Executes scaffold and captures resulting exit code.
  const exitCode = runScaffold({ outFile, force });
  process.exit(exitCode);
}
