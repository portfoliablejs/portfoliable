import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);

function assertExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

function assertContains(relativePath, expectedText) {
  const absolutePath = path.join(root, relativePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  if (!content.includes(expectedText)) {
    throw new Error(`Expected text not found in ${relativePath}: ${expectedText}`);
  }
}

assertExists('index.md');
assertExists('docs/index.md');
assertExists('docs/getting-started/install.md');
assertExists('docs/getting-started/quickstart.md');
assertExists('docs/guides/deploy.md');
assertExists('docs/releases/changelog.md');
assertExists('docs/releases/versioning.md');
assertExists('docs/case-decorators/overview.md');
assertExists('docs/case-decorators/adding.md');
assertExists('docs/case-decorators/editing.md');
assertExists('docs/case-decorators/audio-summaries.md');
assertExists('docs/case-decorators/thumbnails.md');
assertExists('docs/accessibility/overview.md');
assertExists('docs/accessibility/checklist.md');
assertExists('.vitepress/config.mjs');

assertContains('index.md', 'Portfoliable');
assertContains('docs/getting-started/install.md', 'npm create portfoliable@latest');
assertContains('docs/guides/deploy.md', 'web/.vitepress/dist');

console.log('web smoke checks passed');
