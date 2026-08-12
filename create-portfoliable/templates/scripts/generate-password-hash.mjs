#!/usr/bin/env node
// File: templates/scripts/generate-password-hash.mjs
// Purpose: Generate PHP password_hash records for protected case passwords.
// Author: Lio Schimanko

import { execFileSync } from 'node:child_process';

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    caseId: '',
    password: '',
    algorithm: 'argon2id'
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === '--case-id' && args[i + 1]) {
      options.caseId = String(args[i + 1]).trim();
      i += 1;
      continue;
    }

    if (token === '--password' && args[i + 1]) {
      options.password = String(args[i + 1]);
      i += 1;
      continue;
    }

    if (token === '--algorithm' && args[i + 1]) {
      options.algorithm = String(args[i + 1]).trim().toLowerCase();
      i += 1;
    }
  }

  return options;
}

function toKebab(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildHash(password, algorithm = 'argon2id') {
  const normalizedAlgorithm = algorithm === 'bcrypt' ? 'bcrypt' : 'argon2id';
  const phpCode = [
    '$password = $argv[1] ?? "";',
    '$algorithm = strtolower((string)($argv[2] ?? "argon2id"));',
    '$algoConst = $algorithm === "bcrypt" ? PASSWORD_BCRYPT : PASSWORD_ARGON2ID;',
    '$hash = password_hash($password, $algoConst);',
    'if ($hash === false) { fwrite(STDERR, "password-hash-failed\\n"); exit(1); }',
    'echo $hash;'
  ].join(' ');

  let hash = '';
  try {
    hash = execFileSync('php', ['-r', phpCode, String(password || ''), normalizedAlgorithm], {
      encoding: 'utf8'
    }).trim();
  } catch {
    throw new Error('PHP CLI is required to generate production-compatible password hashes.');
  }

  return {
    hash,
    algorithm: normalizedAlgorithm
  };
}

function main() {
  const options = parseArgs(process.argv);
  const caseId = toKebab(options.caseId);
  const password = options.password;

  if (!caseId) {
    console.error('[password-hash] Missing --case-id <id>.');
    process.exit(1);
  }

  if (!password) {
    console.error('[password-hash] Missing --password <value>.');
    process.exit(1);
  }

  const record = buildHash(password, options.algorithm);
  const payload = {
    caseId,
    hash: record.hash
  };

  console.log(JSON.stringify(payload, null, 2));
  console.error('[password-hash] Paste this hash into public/api/password.config.json under cases.<caseId>.hash');
}

main();
