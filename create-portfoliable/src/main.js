// File: src/main.js
// Purpose: Boot the Portfoliable application shell in the browser.
// Author: Lio Schimanko

// MARK: RUNTIME ENTRY IMPORTS
import '../templates/configs/i18n/i18n.config.js';
import '@portfoliablejs/valence/styles.css';
import './App.js';
import './style.css';

// MARK: APP MOUNT
// Mount the custom element that renders the runtime shell.
document.getElementById('app').innerHTML = `<app-shell></app-shell>`;