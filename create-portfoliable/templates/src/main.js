// File: create-portfoliable/templates/src/main.js
// Purpose: Boot the generated consumer app shell from the starter template.
// Author: Lio Schimanko

// === IMPORTS ===
import '@portfoliable/create';
import { portfolioCases } from './cases/index.js';

// === APP MOUNT ===
// Resolves app container where the custom shell element is mounted.
const appContainer = document.getElementById('app');
appContainer.innerHTML = '<app-shell></app-shell>';

// === RUNTIME DATA BINDING ===
// Waits for custom element definition before assigning portfolio case data.
customElements.whenDefined('app-shell').then(() => {
  // Resolves mounted shell instance.
  const shell = document.querySelector('app-shell');
  // Injects normalized portfolio case data into shell when available.
  if (shell) {
    shell.portfolioCases = portfolioCases;
  }
});
