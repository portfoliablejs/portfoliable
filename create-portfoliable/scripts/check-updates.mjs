// scripts/check-updates.mjs
import { execSync } from 'node:child_process';

async function checkValenceUpdates() {
  try {
    console.log('🔍 Checking @portfoliablejs/valence for updates...');
    const res = await fetch('https://api.github.com/repos/portfoliablejs/valence/commits/main');
    if (!res.ok) return;

    const data = await res.json();
    const latestSha = data.sha.substring(0, 7);
    console.log(`✨ Connected to valence commit: ${latestSha}`);
  } catch (e) {
    // Silently continue so offline development works without errors
  }
}

checkValenceUpdates();