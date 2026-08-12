#!/usr/bin/env node
// File: templates/scripts/convert-video-to-mp4.mjs
// Purpose: Convert video files to MP4 and write outputs beside original files.
// Author: Lio Schimanko

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist']);
const VIDEO_EXTENSIONS = new Set([
  '.avi',
  '.flv',
  '.m2ts',
  '.m4v',
  '.mkv',
  '.mov',
  '.mpeg',
  '.mpg',
  '.mts',
  '.webm',
  '.wmv',
  '.3gp'
]);

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    dir: process.cwd(),
    force: false,
    help: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if ((token === '--dir' || token === '--input') && args[i + 1]) {
      options.dir = path.resolve(String(args[i + 1]));
      i += 1;
      continue;
    }

    if (token === '--force') {
      options.force = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log('Usage: npm run convert:video -- [--dir <path>] [--force]');
  console.log('');
  console.log('Options:');
  console.log('  --dir, --input  Root directory to scan recursively for video files');
  console.log('  --force         Overwrite existing .mp4 targets');
  console.log('  --help, -h      Show help');
}

function verifyFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    throw new Error('ffmpeg is required. Install it first (for macOS: brew install ffmpeg).');
  }
}

function collectVideoFiles(rootDir, output = []) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      collectVideoFiles(absolutePath, output);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (entry.isFile() && VIDEO_EXTENSIONS.has(extension)) {
      output.push(absolutePath);
    }
  }

  return output;
}

function convertOneFile(inputPath, force = false) {
  const directory = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(directory, `${baseName}.mp4`);

  if (fs.existsSync(outputPath) && !force) {
    return {
      status: 'skipped',
      inputPath,
      outputPath,
      reason: 'target exists'
    };
  }

  const ffmpegArgs = [
    '-hide_banner',
    '-loglevel',
    'error',
    force ? '-y' : '-n',
    '-i',
    inputPath,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath
  ];

  const result = spawnSync('ffmpeg', ffmpegArgs, {
    encoding: 'utf8'
  });

  if (result.error || result.status !== 0) {
    return {
      status: 'failed',
      inputPath,
      outputPath,
      reason: (result.stderr || result.error?.message || 'conversion failed').trim()
    };
  }

  return {
    status: 'converted',
    inputPath,
    outputPath
  };
}

function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!fs.existsSync(options.dir) || !fs.statSync(options.dir).isDirectory()) {
    console.error(`[convert:video] Invalid directory: ${options.dir}`);
    process.exit(1);
  }

  verifyFfmpeg();

  const videoFiles = collectVideoFiles(options.dir);
  if (videoFiles.length === 0) {
    console.log(`[convert:video] No video files found under ${options.dir}`);
    process.exit(0);
  }

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const inputPath of videoFiles) {
    const result = convertOneFile(inputPath, options.force);

    if (result.status === 'converted') {
      converted += 1;
      console.log(`[convert:video] Converted: ${result.outputPath}`);
      continue;
    }

    if (result.status === 'skipped') {
      skipped += 1;
      console.log(`[convert:video] Skipped: ${result.outputPath} (${result.reason})`);
      continue;
    }

    failed += 1;
    console.error(`[convert:video] Failed: ${result.inputPath}`);
    console.error(`[convert:video] Reason: ${result.reason}`);
  }

  console.log(`[convert:video] Done. converted=${converted} skipped=${skipped} failed=${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(`[convert:video] ${error?.message || String(error)}`);
  process.exit(1);
}
