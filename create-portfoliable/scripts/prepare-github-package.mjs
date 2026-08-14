import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const NPM_PACKAGE_NAME = 'create-portfoliable';
export const GITHUB_PACKAGE_NAME = '@portfoliablejs/create-portfoliable';
export const GITHUB_PACKAGES_REGISTRY = 'https://npm.pkg.github.com';

export function prepareGithubPackage(packageDirectory) {
  const packageJsonPath = resolve(packageDirectory, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  if (packageJson.name !== NPM_PACKAGE_NAME) {
    throw new Error(
      `Expected staged package name ${NPM_PACKAGE_NAME} but found ${packageJson.name || '<missing>'}`
    );
  }

  const githubPackageJson = {
    ...packageJson,
    name: GITHUB_PACKAGE_NAME,
    publishConfig: {
      ...packageJson.publishConfig,
      registry: GITHUB_PACKAGES_REGISTRY,
      access: 'public',
    },
  };

  writeFileSync(packageJsonPath, `${JSON.stringify(githubPackageJson, null, 2)}\n`);
  return githubPackageJson;
}

const isMainModule =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const packageDirectory = process.argv[2];

  if (!packageDirectory) {
    console.error('Usage: node prepare-github-package.mjs <staged-package-directory>');
    process.exit(1);
  }

  const packageJson = prepareGithubPackage(packageDirectory);
  console.log(`Prepared ${packageJson.name}@${packageJson.version} for GitHub Packages.`);
}