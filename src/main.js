// src/main.js

// Import application-specific logic first
import './i18n.js';

// Import the main App Shell component
import './App.js';

// Import global styles
import './style.css';

// Mount the application
document.getElementById('app').innerHTML = `<app-shell></app-shell>`;