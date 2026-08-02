// File: src/main.js
// Purpose: Boot the Portfoliable application shell in the browser.
// Author: Lio Schimanko

// === MODULE IMPORTS ===
import './i18n.js';
import './App.js';
import './style.css';

// === APP MOUNT ===
// Mount the custom element that renders the runtime shell.
document.getElementById('app').innerHTML = `<app-shell></app-shell>`;