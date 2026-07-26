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
