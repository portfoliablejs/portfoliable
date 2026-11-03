// File: create-portfoliable/templates/src/main.js
// Purpose: Boot the generated consumer app shell from the starter template.
// Author: Lio Schimanko

// MARK: IMPORTS
import 'create-portfoliable';
import { portfolioCases } from './cases/index.js';

// MARK: APP MOUNT
// Resolves app container where the custom shell element is mounted.
const appContainer = document.getElementById('app');
const seoFallback = appContainer.querySelector('[data-portfoliable-seo-fallback]');
appContainer.insertAdjacentHTML('beforeend', '<app-shell></app-shell>');

function registerAgentTools() {
  const modelContext = globalThis.navigator?.modelContext;
  const registerTool = modelContext?.registerTool;
  if (typeof registerTool !== 'function') return;

  const customTools = globalThis.portfoliableAgentTools || [{
    name: 'get_portfolio_overview',
    description: 'Returns the public portfolio overview page.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => ({ content: [{ type: 'text', text: document.title }] })
  }];
  for (const tool of customTools) {
    try {
      registerTool.call(modelContext, tool);
    } catch (error) {
      console.warn('[portfoliable] Could not register WebMCP tool.', error);
    }
  }
}

registerAgentTools();

// MARK: RUNTIME DATA BINDING
// Waits for custom element definition before assigning portfolio case data.
customElements.whenDefined('app-shell').then(() => {
  // Resolves mounted shell instance.
  const shell = document.querySelector('app-shell');
  // Injects normalized portfolio case data into shell when available.
  if (shell) {
    shell.portfolioCases = portfolioCases;
  }
  seoFallback?.remove();
});
