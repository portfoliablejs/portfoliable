import { defineConfig } from 'vite';

function getManualChunk(id) {
  if (!id.includes('/node_modules/')) {
    return undefined;
  }

  if (id.includes('/node_modules/mermaid/')) {
    return 'vendor-mermaid';
  }

  if (id.includes('/node_modules/katex/')) {
    return 'vendor-katex';
  }

  if (id.includes('/node_modules/cytoscape/')) {
    return 'vendor-cytoscape';
  }

  if (id.includes('/node_modules/dagre/') || id.includes('/node_modules/graphlib/')) {
    return 'vendor-graph';
  }

  if (id.includes('/node_modules/d3-')) {
    return 'vendor-d3';
  }

  if (id.includes('/node_modules/roughjs/')) {
    return 'vendor-roughjs';
  }

  return undefined;
}

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
