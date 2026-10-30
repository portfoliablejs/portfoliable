// File: src/tooltip.contract.test.js
// Purpose: Keep primary action shortcut tooltip parts free of duplicated key labels.

import { describe, expect, it } from 'vitest';

import {
  detectPlatform,
  getShortcutDisplay,
  getShortcutTooltipParts,
  matchShortcutEvent,
  normalizeShortcutKeyLabel
} from '../templates/configs/portfoliable.a11y.config.js';

describe('primary action tooltip contract', () => {
  it('uses the Enter key as the key-only label for the open-player shortcut', () => {
    const tooltipParts = getShortcutTooltipParts('open-player', 'Win32');

    expect(tooltipParts).toMatchObject({
      kbdLabel: '',
      showPlus: false
    });
    expect(tooltipParts.kbdKey).toBe('Enter');
  });

  it.each([
    ['return', 'Win32', 'Enter'],
    ['ENTER', 'Linux x86_64', 'Enter'],
    ['eNTER', 'MacIntel', 'Return'],
    ['backspace', 'MacIntel', 'Delete'],
    ['DELETE', 'Win32', 'Backspace']
  ])('normalizes %s for %s as %s', (keyLabel, platform, expected) => {
    expect(normalizeShortcutKeyLabel(keyLabel, platform)).toBe(expected);
  });

  it('normalizes display labels without changing shortcut matching', () => {
    expect(getShortcutDisplay('open-player', 'MacIntel')).toBe('Return');
    expect(getShortcutDisplay('navigate-back', 'Win32')).toBe('Backspace');
    expect(matchShortcutEvent({
      code: 'Enter',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false
    })?.id).toBe('open-player');
  });

  it('prefers a Windows user agent when navigator.platform is still macOS', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userAgentData: { platform: 'macOS' }
      }
    });

    expect(detectPlatform()).toBe('windows');
    expect(getShortcutTooltipParts('open-player').kbdKey).toBe('Enter');

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  });
});
