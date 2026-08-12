#!/usr/bin/env node
// File: scripts/validate-protection.mjs
// Purpose: Validate PHP protection contract before dev/build/preview/smoke runs.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';
import { parseCaseMarkdownWithDiagnostics } from '../src/parser/markdown.js';
import { readLocaleConfigFromI18nConfig, resolveI18nConfigPath } from './i18n-config-utils.mjs';

// MARK: PATH RESOLUTION
// Resolves project paths for template-repo mode and generated-app mode.
function resolveProjectLayout(cwd = process.cwd()) {
  const templateRoot = path.join(cwd, 'templates');
  const hasTemplateCases = fs.existsSync(path.join(templateRoot, 'src', 'content', 'cases'));

  if (hasTemplateCases) {
    return {
      mode: 'template',
      root: cwd,
      casesDir: path.join(templateRoot, 'src', 'content', 'cases'),
      designConfigPath: path.join(templateRoot, 'configs', 'portfoliable.design.config.js'),
      phpEndpointPath: path.join(templateRoot, 'public', 'api', 'unlock-case.php'),
      passwordConfigPath: path.join(templateRoot, 'public', 'api', 'password.config.json'),
      passwordExamplePath: path.join(templateRoot, 'public', 'api', 'password.config.example.json')
    };
  }

  return {
    mode: 'consumer',
    root: cwd,
    casesDir: path.join(cwd, 'src', 'content', 'cases'),
    designConfigPath: path.join(cwd, 'configs', 'portfoliable.design.config.js'),
    phpEndpointPath: path.join(cwd, 'public', 'api', 'unlock-case.php'),
    passwordConfigPath: path.join(cwd, 'public', 'api', 'password.config.json'),
    passwordExamplePath: path.join(cwd, 'public', 'api', 'password.config.example.json')
  };
}

// MARK: VALIDATION HELPERS
// Collects markdown files recursively from a directory tree.
function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const files = [];

  // Walks nested directories to discover all markdown case files.
  const walk = (currentDir) => {
    fs.readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
        return;
      }
      if (entry.name.endsWith('.md')) {
        files.push(nextPath);
      }
    });
  };

  walk(dirPath);
  return files;
}

// Reads JSON content from disk for password config checks.
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Converts absolute paths to repository-relative labels for diagnostics.
function toRel(filePath, rootDir) {
  return path.relative(rootDir, filePath);
}

// Extracts configured unlock endpoint from design config source text.
function parseUnlockEndpoint(configText) {
  const match = configText.match(/unlockEndpoint\s*:\s*['\"]([^'\"]+)['\"]/);
  return match ? String(match[1]).trim() : '';
}

// Validates supported password hash formats and rejects template placeholders.
function isRecognizedPasswordHash(value) {
  const hash = String(value || '');
  if (!hash) return false;
  if (hash.includes('replace') || hash.includes('generated-hash')) return false;
  return hash.startsWith('$argon2id$') || hash.startsWith('$argon2i$') || hash.startsWith('$2y$') || hash.startsWith('$2b$');
}

// MARK: VALIDATION ENTRYPOINT
// Validates unlock endpoint and password hash records for protected cases.
export function runProtectionValidation(options = {}) {
  const cwd = options.cwd || process.cwd();
  const layout = resolveProjectLayout(cwd);
  const i18nConfigPath = resolveI18nConfigPath(cwd);
  const localeConfig = readLocaleConfigFromI18nConfig(i18nConfigPath);
  const supportedLocales = localeConfig.supportedLocales;
  const defaultLocale = localeConfig.defaultLocale;

  const errors = [];

  const caseFiles = listMarkdownFiles(layout.casesDir);
  const protectedCaseIds = [];

  caseFiles.forEach((filePath) => {
    const relPath = toRel(filePath, layout.root);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { caseData, errors: parseErrors } = parseCaseMarkdownWithDiagnostics(raw, {
      filePath: relPath,
      locales: supportedLocales,
      defaultLocale: defaultLocale
    });

    if (parseErrors.length > 0 || !caseData) {
      return;
    }

    if (caseData.isProtected === true) {
      protectedCaseIds.push(caseData.id);
    }
  });

  if (protectedCaseIds.length === 0) {
    console.log('[validate-protection] OK: no protected cases enabled.');
    return 0;
  }

  if (!fs.existsSync(layout.designConfigPath)) {
    errors.push(`${toRel(layout.designConfigPath, layout.root)} is missing.`);
  } else {
    const configText = fs.readFileSync(layout.designConfigPath, 'utf8');
    const unlockEndpoint = parseUnlockEndpoint(configText);
    if (!unlockEndpoint) {
      errors.push(`${toRel(layout.designConfigPath, layout.root)} must define protection.unlockEndpoint.`);
    } else if (!unlockEndpoint.includes('/api/unlock-case.php')) {
      errors.push(`${toRel(layout.designConfigPath, layout.root)} unlockEndpoint must point to /api/unlock-case.php for PHP self-host parity.`);
    }
  }

  if (!fs.existsSync(layout.phpEndpointPath)) {
    errors.push(`${toRel(layout.phpEndpointPath, layout.root)} is missing.`);
  }

  if (!fs.existsSync(layout.passwordConfigPath)) {
    errors.push(`${toRel(layout.passwordConfigPath, layout.root)} is missing. Copy ${toRel(layout.passwordExamplePath, layout.root)} and add hashes for protected cases.`);
  } else {
    let config = null;
    try {
      config = readJson(layout.passwordConfigPath);
    } catch {
      errors.push(`${toRel(layout.passwordConfigPath, layout.root)} is not valid JSON.`);
    }

    if (config) {
      const cases = config?.cases && typeof config.cases === 'object' ? config.cases : null;
      if (!cases) {
        errors.push(`${toRel(layout.passwordConfigPath, layout.root)} must contain a cases object.`);
      } else {
        protectedCaseIds.forEach((caseId) => {
          const record = cases[caseId];
          const hash = record?.hash;
          if (!record || typeof record !== 'object') {
            errors.push(`${toRel(layout.passwordConfigPath, layout.root)} is missing cases.${caseId}.hash`);
            return;
          }
          if (!isRecognizedPasswordHash(hash)) {
            errors.push(`${toRel(layout.passwordConfigPath, layout.root)} has invalid hash format for cases.${caseId}.hash`);
          }
        });
      }
    }
  }

  if (errors.length > 0) {
    console.error('[validate-protection] ERROR:');
    errors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }

  console.log(`[validate-protection] OK: PHP unlock protection is configured for ${protectedCaseIds.length} protected case(s).`);
  return 0;
}

// MARK: SCRIPT ENTRYPOINT
// CLI entrypoint for protection validation checks.
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runProtectionValidation());
}
