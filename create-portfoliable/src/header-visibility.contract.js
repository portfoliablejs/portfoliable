// File: src/header-visibility.contract.js
// Purpose: Provide shared visibility resolution helpers for header state contracts.
// Author: Lio Schimanko

// MARK: CONTRACT RESOLUTION HELPERS
// Shared visibility helpers used by AppShell and unit tests.

// Resolves a visibility attribute using contract-first precedence with fallback and default values.
export function resolveHeaderVisibilityAttributeValue(contractValue, fallbackValue, defaultValue = undefined) {
  if (contractValue !== null && typeof contractValue !== 'undefined') {
    return contractValue;
  }

  if (fallbackValue !== null && typeof fallbackValue !== 'undefined') {
    return fallbackValue;
  }

  return defaultValue;
}

// Enables required header controls for return-only mode and returns null for standard mode.
export function resolveReturnOnlyVisibilityOverrides(isReturnOnlyEnabled) {
  if (!isReturnOnlyEnabled) {
    return null;
  }

  return {
    showNavigationRegion: true,
    showLanguageMenu: true,
  };
}
