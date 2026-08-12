// File: src/header-visibility.contract.test.js
// Purpose: Validate precedence and return-only semantics for header visibility helpers.
// Author: Lio Schimanko

// MARK: IMPORTS
import { describe, expect, it } from 'vitest';

import {
  resolveHeaderVisibilityAttributeValue,
  resolveReturnOnlyVisibilityOverrides,
} from './header-visibility.contract.js';

// MARK: CONTRACT TESTS
// Verifies precedence and override semantics for header visibility contract helpers.
describe('header visibility contract', () => {
  // Contract values should always win over fallback values.
  it('prefers explicit contract values over fallback values', () => {
    expect(resolveHeaderVisibilityAttributeValue('false', 'true')).toBe('false');
    expect(resolveHeaderVisibilityAttributeValue('true', 'false')).toBe('true');
  });

  // Fallback should be used when contract value is intentionally missing.
  it('uses fallback when contract is unset', () => {
    expect(resolveHeaderVisibilityAttributeValue(null, 'false')).toBe('false');
    expect(resolveHeaderVisibilityAttributeValue(undefined, 'true')).toBe('true');
  });

  // Defaults should only be consulted when both previous tiers are absent.
  it('uses default when both contract and fallback are unset', () => {
    expect(resolveHeaderVisibilityAttributeValue(undefined, undefined, 'true')).toBe('true');
  });

  // Return-only mode injects explicit overrides to keep required controls visible.
  it('only forces visibility overrides in return-only mode', () => {
    expect(resolveReturnOnlyVisibilityOverrides(false)).toBeNull();
    expect(resolveReturnOnlyVisibilityOverrides(true)).toEqual({
      showNavigationRegion: true,
      showLanguageMenu: true,
    });
  });
});
