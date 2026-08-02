#!/usr/bin/env node
// File: scripts/scaffold-consumer.mjs
// Purpose: Generate a starter consumer cases file for Portfoliable projects.
// Author: Lio Schimanko

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OUTPUT = 'portfolio-cases.template.js';

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
  const cwd = options.cwd || process.cwd();
  const outFile = options.outFile || DEFAULT_OUTPUT;
  const force = Boolean(options.force);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const outIndex = process.argv.findIndex((arg) => arg === '--out');
  const force = process.argv.includes('--force');
  const outFile = outIndex >= 0 ? process.argv[outIndex + 1] : DEFAULT_OUTPUT;
  const exitCode = runScaffold({ outFile, force });
  process.exit(exitCode);
}
