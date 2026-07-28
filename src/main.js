// File: src/main.js
// Purpose: Boot the Portfoliable application shell in the browser.
// Author: Lio Schimanko

import './i18n.js';
import './App.js';
import './style.css';

// Mount the custom element that renders the runtime shell.
document.getElementById('app').innerHTML = `<app-shell></app-shell>`;