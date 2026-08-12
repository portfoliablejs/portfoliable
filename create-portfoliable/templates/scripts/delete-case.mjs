#!/usr/bin/env node
// File: scripts/delete-case.mjs
// Purpose: Remove a generated case from src/content/cases by id or explicit file path.
// Author: Lio Schimanko

// MARK: IMPORTS
import fs from 'node:fs';
import path from 'node:path';

// MARK: CASE ROOTS
const DEFAULT_CASES_ROOTS = ['src/content/cases', 'templates/src/content/cases'];

// MARK: ARGUMENT PARSING
// Parses CLI flags for case id, explicit output path, and force deletion mode.
function parseArgs(argv) {
  const parsed = {
    id: '',
    outFile: '',
    force: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--id') {
      parsed.id = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }

    if (token === '--out') {
      parsed.outFile = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }

    if (token === '--force') {
      parsed.force = true;
    }
  }

  return parsed;
}

// Normalizes case identifiers into kebab-case slugs.
function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// MARK: CASE DISCOVERY HELPERS
// Recursively lists files under a root directory.
function walkFilesRecursive(rootDir) {
  const files = [];

  // Traverses nested directories and appends discovered files.
  const visit = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      files.push(absolutePath);
    }
  };

  visit(rootDir);
  return files;
}

// Deduplicates candidate file paths using absolute path normalization.
function uniquePaths(paths) {
  return [...new Set(paths.map((candidate) => path.resolve(candidate)))];
}

// Resolves existing case roots in both consumer and template layouts.
function resolveCasesRoots(cwd) {
  return DEFAULT_CASES_ROOTS
    .map((relativeRoot) => path.resolve(cwd, relativeRoot))
    .filter((absoluteRoot) => fs.existsSync(absoluteRoot) && fs.statSync(absoluteRoot).isDirectory());
}

// Generates direct candidate markdown paths for a case identifier.
function resolveIdCandidates(cwd, caseId) {
  const roots = resolveCasesRoots(cwd);
  const directCandidates = [];

  for (const casesRoot of roots) {
    directCandidates.push(path.resolve(casesRoot, caseId, 'case.md'));
    directCandidates.push(path.resolve(casesRoot, `${caseId}.md`));
    directCandidates.push(path.resolve(casesRoot, 'summary', caseId, 'case.md'));
    directCandidates.push(path.resolve(casesRoot, 'summary', `${caseId}.md`));
    directCandidates.push(path.resolve(casesRoot, 'reader', caseId, 'case.md'));
    directCandidates.push(path.resolve(casesRoot, 'reader', `${caseId}.md`));
  }

  return uniquePaths(directCandidates);
}

// Searches case roots for matching case filenames and nested case.md folders.
function searchCaseMatches(cwd, caseId) {
  const roots = resolveCasesRoots(cwd);
  const expectedMarkdownName = `${caseId}.md`;
  const matches = [];

  for (const casesRoot of roots) {
    const files = walkFilesRecursive(casesRoot).filter((candidate) => candidate.endsWith('.md'));
    for (const filePath of files) {
      if (path.basename(filePath) === expectedMarkdownName) {
        matches.push(filePath);
        continue;
      }

      if (path.basename(filePath) === 'case.md' && path.basename(path.dirname(filePath)) === caseId) {
        matches.push(filePath);
      }
    }
  }

  return uniquePaths(matches);
}

// Collects known case ids to suggest alternatives when a delete target is missing.
function collectKnownCaseIds(cwd) {
  const roots = resolveCasesRoots(cwd);
  const ids = new Set();

  for (const casesRoot of roots) {
    const files = walkFilesRecursive(casesRoot).filter((candidate) => candidate.endsWith('.md'));
    for (const filePath of files) {
      const baseName = path.basename(filePath);
      if (baseName === 'case.md') {
        ids.add(path.basename(path.dirname(filePath)));
        continue;
      }

      ids.add(path.basename(filePath, '.md'));
    }
  }

  return [...ids].sort((a, b) => a.localeCompare(b));
}

// Suggests nearby case ids using contains/token overlap matching.
function suggestCaseIds(knownIds, missingId) {
  const needle = String(missingId || '').trim().toLowerCase();
  if (!needle) return [];

  const tokens = needle.split('-').filter(Boolean);
  const matches = knownIds.filter((candidate) => {
    const lower = candidate.toLowerCase();
    if (lower.includes(needle) || needle.includes(lower)) {
      return true;
    }

    const hitCount = tokens.filter((token) => lower.includes(token)).length;
    return hitCount >= Math.max(1, Math.min(2, tokens.length));
  });

  return matches.slice(0, 8);
}

// Resolves deletion candidates from explicit output path or computed case id lookups.
function resolveCaseCandidates(cwd, options) {
  if (options.outFile) {
    return [path.resolve(cwd, options.outFile)];
  }

  const caseId = toSlug(options.caseId);
  if (!caseId) {
    throw new Error('Missing case target. Use --id <case-slug> or --out <path>.');
  }

  const directCandidates = resolveIdCandidates(cwd, caseId);
  const directExisting = directCandidates.filter((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (directExisting.length > 0) {
    return directExisting;
  }

  const searched = searchCaseMatches(cwd, caseId);
  if (searched.length > 0) {
    return searched;
  }

  return directCandidates;
}

// Returns the first candidate path that currently exists on disk.
function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

// Detects nested case folder format where file is case.md.
function isNestedCaseFile(filePath) {
  return path.basename(filePath) === 'case.md';
}

// Removes now-empty parent case directory when safe to do so.
function removeEmptyParentDirectory(filePath, rootPath) {
  const parentDir = path.dirname(filePath);
  if (path.resolve(parentDir) === path.resolve(rootPath)) {
    return;
  }

  const entries = fs.readdirSync(parentDir);
  if (entries.length === 0) {
    fs.rmdirSync(parentDir);
  }
}

// MARK: CASE DELETION WORKFLOW
// Deletes a case markdown file (or full case directory in force mode) with diagnostics.
export function runDeleteCase(options = {}) {
  const cwd = options.cwd || process.cwd();
  const force = options.force === true;
  const requestedCaseId = toSlug(options.caseId);
  const candidates = resolveCaseCandidates(cwd, options);
  const existingCandidates = candidates.filter((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());

  if (existingCandidates.length > 1 && !options.outFile) {
    throw new Error(`Multiple case matches found for --id ${String(options.caseId || '')}. Use --out with one of: ${existingCandidates.join(', ')}`);
  }

  const targetPath = firstExistingPath(candidates);

  if (!targetPath) {
    const knownIds = collectKnownCaseIds(cwd);
    const suggestedIds = suggestCaseIds(knownIds, requestedCaseId);
    return {
      removedPath: '',
      removedDirectory: false,
      removedDirectoryPath: '',
      alreadyMissing: true,
      checkedCandidates: candidates,
      requestedCaseId,
      suggestedIds
    };
  }

  const casesRoots = resolveCasesRoots(cwd);
  const absoluteCasesRoot = casesRoots.find((rootPath) => targetPath.startsWith(`${rootPath}${path.sep}`)) || path.dirname(targetPath);

  if (isNestedCaseFile(targetPath)) {
    const caseDir = path.dirname(targetPath);
    const siblingEntries = fs.readdirSync(caseDir).filter((entry) => entry !== 'case.md');

    if (siblingEntries.length > 0 && !force) {
      throw new Error(`Case directory ${caseDir} has additional files. Re-run with --force to remove the full case directory.`);
    }

    if (siblingEntries.length > 0 && force) {
      fs.rmSync(caseDir, { recursive: true, force: false });
      return {
        removedPath: targetPath,
        removedDirectory: true,
        removedDirectoryPath: caseDir,
        alreadyMissing: false,
        checkedCandidates: [],
        requestedCaseId,
        suggestedIds: []
      };
    }

    fs.rmSync(targetPath);
    removeEmptyParentDirectory(targetPath, absoluteCasesRoot);
    return {
      removedPath: targetPath,
      removedDirectory: false,
      removedDirectoryPath: '',
      alreadyMissing: false,
      checkedCandidates: [],
      requestedCaseId,
      suggestedIds: []
    };
  }

  fs.rmSync(targetPath);
  return {
    removedPath: targetPath,
    removedDirectory: false,
    removedDirectoryPath: '',
    alreadyMissing: false,
    checkedCandidates: [],
    requestedCaseId,
    suggestedIds: []
  };
}

// MARK: SCRIPT ENTRYPOINT
// CLI entrypoint for delete-case script usage.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = runDeleteCase({ caseId: args.id, outFile: args.outFile, force: args.force });
    if (result.alreadyMissing) {
      console.log('[delete-case] Nothing to delete. Target is already missing.');
      if (result.suggestedIds.length > 0) {
        console.log(`[delete-case] Similar existing case ids: ${result.suggestedIds.join(', ')}`);
      }
    } else {
      console.log(`[delete-case] Removed ${result.removedPath}.`);
      if (result.removedDirectory) {
        console.log(`[delete-case] Removed case directory ${result.removedDirectoryPath}.`);
      }
    }
  } catch (error) {
    console.error('[delete-case] Failed:', error.message || error);
    process.exit(1);
  }
}