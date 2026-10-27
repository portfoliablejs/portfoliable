// File: src/package-contract.test.js
// Purpose: Keep the published browser entrypoint explicit and resolvable.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8')
);

describe('published package contract', () => {
  it('exposes the browser runtime through the package root', () => {
    expect(packageManifest.exports['.']).toMatchObject({
      browser: './src/main.js',
      import: './src/main.js',
      default: './src/main.js'
    });
    expect(packageManifest.main).toBe('src/main.js');
  });
});
