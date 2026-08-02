// File: create-portfoliable/scripts/check-updates.mjs
// Purpose: Check the latest valence repository commit to surface upstream update visibility.
// Author: Lio Schimanko

// === IMPORTS ===
import { execSync } from 'node:child_process';

void execSync;

// === UPDATE CHECK ROUTINE ===
// Fetches the latest commit SHA from the valence main branch for quick maintainer awareness.
async function checkValenceUpdates() {
  try {
    console.log('🔍 Checking @portfoliablejs/valence for updates...');
    // Calls the GitHub commits API to retrieve the current main-branch head.
    const res = await fetch('https://api.github.com/repos/portfoliablejs/valence/commits/main');
    if (!res.ok) return;

    // Reads the response payload and prints a short SHA for concise terminal output.
    const data = await res.json();
    // Extracts short SHA for concise maintainer output.
    const latestSha = data.sha.substring(0, 7);
    console.log(`✨ Connected to valence commit: ${latestSha}`);
  } catch (e) {
    // Silently continue so offline development works without errors
    void e;
  }
}

// === SCRIPT ENTRYPOINT ===
checkValenceUpdates();