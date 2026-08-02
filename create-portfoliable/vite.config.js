// File: create-portfoliable/vite.config.js
// Purpose: Configure Vite build behavior and deterministic chunk splitting rules.
// Author: Lio Schimanko

// === IMPORTS ===
import { defineConfig } from 'vite';

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
export default defineConfig({
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
});
