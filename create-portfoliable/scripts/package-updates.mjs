const PACKAGE_REGISTRY_URL = 'https://registry.npmjs.org';

function parseVersion(version) {
  const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function isNewerVersion(latestVersion, currentVersion) {
  const latest = parseVersion(latestVersion);
  const current = parseVersion(currentVersion);
  if (!latest || !current) return false;

  for (let index = 0; index < latest.length; index += 1) {
    if (latest[index] !== current[index]) return latest[index] > current[index];
  }

  return false;
}

export async function fetchLatestPackageVersion(packageName) {
  try {
    const response = await fetch(`${PACKAGE_REGISTRY_URL}/${encodeURIComponent(packageName)}/latest`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

export async function findPackageUpdates(packages) {
  const updates = await Promise.all(packages.map(async ({ name, currentVersion }) => {
    const latestVersion = await fetchLatestPackageVersion(name);
    if (!latestVersion || !isNewerVersion(latestVersion, currentVersion)) return null;

    return { name, currentVersion, latestVersion };
  }));

  return updates.filter(Boolean);
}