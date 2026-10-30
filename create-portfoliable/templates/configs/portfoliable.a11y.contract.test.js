import { describe, expect, it } from 'vitest';

import labelsByLocale from './i18n/i18n.labels.js';
import {
  getShortcutDisplay,
  getShortcutTooltipParts,
  keyboardShortcuts,
  matchShortcutEvent,
  shortcutLabelBindings
} from './portfoliable.a11y.config.js';

describe('keyboard shortcut catalog', () => {
  it('has unique, complete platform labels and matching handlers', () => {
    const ids = new Set();

    keyboardShortcuts.forEach((shortcut) => {
      expect(ids.has(shortcut.id)).toBe(false);
      ids.add(shortcut.id);
      expect(shortcut.action).toMatch(/^[a-z][A-Za-z0-9]*$/);
      expect(shortcut.code).toMatch(/^(Key[A-Z]|Digit[0-9]|Enter|Backspace)$/);

      ['mac', 'windows', 'linux'].forEach((platform) => {
        expect(shortcut.labels?.[platform]).toBeTruthy();
        expect(getShortcutDisplay(shortcut.id, platform)).toBeTruthy();
        const tooltip = getShortcutTooltipParts(shortcut.id, platform);
        expect(tooltip.kbdKey).toBeTruthy();
      });
    });
  });

  it('matches only the configured modifier combination for every shortcut', () => {
    keyboardShortcuts.forEach((shortcut) => {
      const event = {
        code: shortcut.code,
        altKey: Boolean(shortcut.altKey),
        ctrlKey: Boolean(shortcut.ctrlKey),
        metaKey: Boolean(shortcut.metaKey),
        shiftKey: Boolean(shortcut.shiftKey)
      };

      expect(matchShortcutEvent(event)?.id).toBe(shortcut.id);
      const wrongModifier = {
        ...event,
        shiftKey: !event.shiftKey
      };
      expect(matchShortcutEvent(wrongModifier)).toBeNull();
    });
  });
});

describe('localized shortcut bindings', () => {
  it('bind every shortcut label to an existing shortcut and localized label', () => {
    Object.entries(shortcutLabelBindings).forEach(([translationKey, binding]) => {
      expect(keyboardShortcuts.some((shortcut) => shortcut.id === binding.shortcutId)).toBe(true);

      Object.entries(labelsByLocale).forEach(([locale, labels]) => {
        expect(
          labels[translationKey] || labelsByLocale.en?.[translationKey],
          `${locale}.${translationKey}`
        ).toBeTruthy();
      });
    });
  });

  it('does not define empty localized values that would hide the default fallback', () => {
    Object.entries(labelsByLocale.en).forEach(([key, defaultValue]) => {
      if (!defaultValue) return;
      Object.entries(labelsByLocale).forEach(([locale, labels]) => {
        expect(
          labels[key] || defaultValue,
          `${locale}.${key}`
        ).toBeTruthy();
      });
    });
  });
});
