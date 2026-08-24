// File: scripts/consumer-runtime-aliases.mjs
// Purpose: Resolve consumer-local runtime aliases that override template defaults when files exist.

import fs from 'node:fs';
import path from 'node:path';

const TEMPLATE_TO_CONSUMER_TARGETS = [
  ['../templates/src/cases/index.js', 'src/cases/index.js'],
  ['../templates/src/content/about/ABOUTME.md', 'src/content/about/ABOUTME.md'],
  ['../templates/configs/portfoliable.design.config.js', 'configs/portfoliable.design.config.js'],
  ['../templates/configs/portfoliable.a11y.config.js', 'configs/portfoliable.a11y.config.js'],
  ['../templates/configs/i18n/i18n.config.js', 'configs/i18n/i18n.config.js'],
  ['../templates/configs/i18n/i18n.labels.js', 'configs/i18n/i18n.labels.js']
];

// Builds Vite resolve.alias entries for consumer files that are present in the current project.
export function resolveConsumerRuntimeAliases(projectRoot = process.cwd()) {
  const aliases = [];

  for (const [templateSpecifier, consumerRelativePath] of TEMPLATE_TO_CONSUMER_TARGETS) {
    const consumerAbsolutePath = path.resolve(projectRoot, consumerRelativePath);
    if (!fs.existsSync(consumerAbsolutePath)) {
      continue;
    }

    aliases.push({
      find: templateSpecifier,
      replacement: consumerAbsolutePath
    });
  }

  return aliases;
}
