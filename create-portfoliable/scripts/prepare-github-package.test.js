import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  GITHUB_PACKAGE_NAME,
  GITHUB_PACKAGES_REGISTRY,
  prepareGithubPackage,
} from './prepare-github-package.mjs';

const temporaryDirectories = [];

function createPackageDirectory(packageJson) {
  const packageDirectory = mkdtempSync(join(tmpdir(), 'portfoliable-github-package-'));
  temporaryDirectories.push(packageDirectory);
  writeFileSync(
    join(packageDirectory, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
  return packageDirectory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('GitHub Packages manifest preparation', () => {
  it('rewrites only the staged package identity and registry', () => {
    const sourcePackageJson = {
      name: 'create-portfoliable',
      version: '1.2.10',
      bin: {
        create: 'bin/create-portfoliable.mjs',
        'create-portfoliable': 'bin/create-portfoliable.mjs',
      },
      files: ['bin', 'templates'],
      repository: {
        type: 'git',
        url: 'git+https://github.com/portfoliablejs/portfoliable.git',
        directory: 'create-portfoliable',
      },
      publishConfig: {
        registry: 'https://registry.npmjs.org/',
        access: 'public',
        provenance: true,
      },
    };
    const sourceDirectory = createPackageDirectory(sourcePackageJson);
    const stagedDirectory = createPackageDirectory(sourcePackageJson);

    const preparedPackageJson = prepareGithubPackage(stagedDirectory);
    const persistedPackageJson = JSON.parse(
      readFileSync(join(stagedDirectory, 'package.json'), 'utf8')
    );
    const unchangedSourcePackageJson = JSON.parse(
      readFileSync(join(sourceDirectory, 'package.json'), 'utf8')
    );

    expect(preparedPackageJson).toEqual(persistedPackageJson);
    expect(persistedPackageJson.name).toBe(GITHUB_PACKAGE_NAME);
    expect(persistedPackageJson.version).toBe(sourcePackageJson.version);
    expect(persistedPackageJson.bin).toEqual(sourcePackageJson.bin);
    expect(persistedPackageJson.files).toEqual(sourcePackageJson.files);
    expect(persistedPackageJson.repository).toEqual(sourcePackageJson.repository);
    expect(persistedPackageJson.publishConfig).toEqual({
      registry: GITHUB_PACKAGES_REGISTRY,
      access: 'public',
      provenance: true,
    });
    expect(unchangedSourcePackageJson).toEqual(sourcePackageJson);
  });

  it('rejects an unexpected source package identity', () => {
    const stagedDirectory = createPackageDirectory({
      name: '@portfoliablejs/create-portfoliable',
      version: '1.2.10',
    });

    expect(() => prepareGithubPackage(stagedDirectory)).toThrow(
      'Expected staged package name create-portfoliable'
    );
  });
});