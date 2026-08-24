// File: create-portfoliable/vite.config.js
// Purpose: Configure Vite build behavior and deterministic chunk splitting rules.
// Author: Lio Schimanko

// === IMPORTS ===
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { resolveConsumerRuntimeAliases } from './scripts/consumer-runtime-aliases.mjs';

// Detects when @portfoliablejs/valence is installed as a local symlink.
function isLocalLinkedValence() {
  const valencePath = path.resolve(process.cwd(), 'node_modules', '@portfoliable', 'valence');
  try {
    return fs.lstatSync(valencePath).isSymbolicLink();
  } catch {
    return false;
  }
}

// === CHUNK SPLITTING STRATEGY ===
// Maps dependency module IDs to manual chunk names for stable build output organization.
function getManualChunk(id) {
  // Returns undefined for application code so only vendor modules are manually chunked.
  if (!id.includes('/node_modules/')) {
    return undefined;
  }

  // Routes Mermaid code into a dedicated async vendor chunk.
  if (id.includes('/node_modules/mermaid/')) {
    return 'vendor-mermaid';
  }

  // Routes KaTeX rendering libraries into a dedicated vendor chunk.
  if (id.includes('/node_modules/katex/')) {
    return 'vendor-katex';
  }

  // Routes Cytoscape graph libraries into a dedicated vendor chunk.
  if (id.includes('/node_modules/cytoscape/')) {
    return 'vendor-cytoscape';
  }

  // Groups dagre and graphlib under one graph utility chunk.
  if (id.includes('/node_modules/dagre/') || id.includes('/node_modules/graphlib/')) {
    return 'vendor-graph';
  }

  // Groups D3 family modules into a dedicated analytics/visualization chunk.
  if (id.includes('/node_modules/d3-')) {
    return 'vendor-d3';
  }

  // Routes roughjs drawing utilities into a dedicated chunk.
  if (id.includes('/node_modules/roughjs/')) {
    return 'vendor-roughjs';
  }

  return undefined;
}

// === VITE CONFIG EXPORT ===
// Exports build settings used across dev/build/preview workflows.
export default defineConfig(({ command }) => {
  const usingLocalValence = isLocalLinkedValence();
  const phpApiProxy = String(process.env.PORTFOLIABLE_PHP_API_PROXY || '').trim();
  const runtimeAliases = resolveConsumerRuntimeAliases(process.cwd());

  const serverConfig = (command === 'serve' && usingLocalValence)
    ? {
        fs: {
          allow: [
            process.cwd(),
            path.resolve(process.cwd(), '..', '..', 'valence')
          ]
        },
        watch: {
          ignored: ['!**/node_modules/@portfoliablejs/valence/**']
        }
      }
    : {};

  if (phpApiProxy) {
    serverConfig.proxy = {
      '/api/unlock-case.php': {
        target: phpApiProxy,
        changeOrigin: true
      }
    };
  }

  return {
    resolve: runtimeAliases.length > 0
      ? { alias: runtimeAliases }
      : undefined,

    // In local-link mode, avoid prebundling Valence so edits in the linked package
    // are reflected immediately during development.
    optimizeDeps: (command === 'serve' && usingLocalValence)
      ? { exclude: ['@portfoliablejs/valence'] }
      : undefined,

    // Allow and watch linked workspace files so HMR sees local Valence changes.
    server: Object.keys(serverConfig).length > 0 ? serverConfig : undefined,

    build: {
      // Mermaid and diagram ecosystems are intentionally code-split and loaded on demand.
      // Keep warnings useful while avoiding noisy false alarms for optional async chunks.
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: getManualChunk
        }
      }
    }
  };
});
