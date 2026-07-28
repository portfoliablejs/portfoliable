// File: create-portfoliable/templates/src/main.js
// Purpose: Boot the generated consumer app shell from the starter template.
// Author: Lio Schimanko

import '@portfoliablejs/portfoliable';
import { portfolioCases } from './cases/index.js';

const appContainer = document.getElementById('app');
appContainer.innerHTML = '<app-shell></app-shell>';

customElements.whenDefined('app-shell').then(() => {
  const shell = document.querySelector('app-shell');
  if (shell) {
    shell.portfolioCases = portfolioCases;
  }
});
