// File: configs/portfoliable.a11y.config.js
// Purpose: Define keyboard shortcuts and a11y-related shortcut actions.
// Author: Lio Schimanko

// MARK: MATCH ORDER
// Ensures keyboard event matching checks modifiers in a stable order.
const MODIFIER_ORDER = ['metaKey', 'ctrlKey', 'altKey', 'shiftKey'];

// MARK: SHORTCUT CATALOG
// Declares all keyboard shortcuts consumed by the runtime shell.
export const keyboardShortcuts = [
  {
    id: 'about',
    action: 'toggleAboutView',
    code: 'KeyI',
    altKey: true,
    labels: {
      mac: '⌥ I',
      windows: 'Alt I',
      linux: 'Alt I'
    }
  },
  {
    id: 'language',
    action: 'toggleLanguageModal',
    code: 'KeyL',
    altKey: true,
    labels: {
      mac: '⌥ L',
      windows: 'Alt L',
      linux: 'Alt L'
    }
  },
  {
    id: 'accessibility',
    action: 'toggleA11yModal',
    code: 'KeyA',
    altKey: true,
    labels: {
      mac: '⌥ A',
      windows: 'Alt A',
      linux: 'Alt A'
    }
  },
  {
    id: 'text-size',
    action: 'toggleA11yState',
    stateKey: 'largeText',
    code: 'KeyT',
    altKey: true,
    labels: {
      mac: '⌥ T',
      windows: 'Alt T',
      linux: 'Alt T'
    }
  },
  {
    id: 'dark-mode',
    action: 'toggleA11yState',
    stateKey: 'darkMode',
    code: 'KeyD',
    altKey: true,
    labels: {
      mac: '⌥ D',
      windows: 'Alt D',
      linux: 'Alt D'
    }
  },
  {
    id: 'high-contrast',
    action: 'toggleA11yState',
    stateKey: 'highContrast',
    code: 'KeyC',
    altKey: true,
    labels: {
      mac: '⌥ C',
      windows: 'Alt C',
      linux: 'Alt C'
    }
  },
  {
    id: 'reduce-motion',
    action: 'toggleA11yState',
    stateKey: 'reduceMotion',
    code: 'KeyM',
    altKey: true,
    labels: {
      mac: '⌥ M',
      windows: 'Alt M',
      linux: 'Alt M'
    }
  },
  {
    id: 'tab-navigation',
    action: 'toggleA11yState',
    stateKey: 'tabNav',
    code: 'KeyF',
    altKey: true,
    labels: {
      mac: '⌥ F',
      windows: 'Alt F',
      linux: 'Alt F'
    }
  },
  {
    id: 'dyslexia-font',
    action: 'toggleA11yState',
    stateKey: 'dyslexiaFont',
    code: 'KeyY',
    altKey: true,
    labels: {
      mac: '⌥ Y',
      windows: 'Alt Y',
      linux: 'Alt Y'
    }
  },
  {
    id: 'case-search-open',
    action: 'openCaseSearch',
    code: 'KeyS',
    ctrlKey: true,
    labels: {
      mac: '⌃ S',
      windows: 'Ctrl S',
      linux: 'Ctrl S'
    }
  },
  {
    id: 'case-search-close',
    action: 'closeCaseSearch',
    code: 'KeyX',
    ctrlKey: true,
    labels: {
      mac: '⌃ X',
      windows: 'Ctrl X',
      linux: 'Ctrl X'
    }
  },
  {
    id: 'open-player',
    action: 'openPlayer',
    code: 'Enter',
    labels: {
      mac: 'Return',
      windows: 'Enter',
      linux: 'Enter'
    }
  },
  {
    id: 'navigate-back',
    action: 'navigateBack',
    code: 'Backspace',
    labels: {
      mac: 'Delete',
      windows: 'Backspace',
      linux: 'Backspace'
    }
  }
];

// MARK: I18N SHORTCUT LABEL BINDINGS
// Maps translation keys to shortcut IDs used for runtime kbd markup.
export const shortcutLabelBindings = {
  btn_return: { shortcutId: 'navigate-back' },
  a11y_size: { shortcutId: 'text-size', kbdClass: 'a11y-kbd' },
  a11y_dark: { shortcutId: 'dark-mode', kbdClass: 'a11y-kbd' },
  a11y_contrast: { shortcutId: 'high-contrast', kbdClass: 'a11y-kbd' },
  a11y_motion: { shortcutId: 'reduce-motion', kbdClass: 'a11y-kbd' },
  a11y_tab: { shortcutId: 'tab-navigation', kbdClass: 'a11y-kbd' },
  a11y_dyslexia: { shortcutId: 'dyslexia-font', kbdClass: 'a11y-kbd' }
};

// MARK: PLATFORM DETECTION
// Normalizes the host platform so shortcut labels can use mac/windows/linux variants.
export function detectPlatform(platformHint) {
  if (platformHint) {
    const rawHint = String(platformHint).toLowerCase();
    if (rawHint.includes('mac')) return 'mac';
    if (rawHint.includes('win')) return 'windows';
    return 'linux';
  }

  const navigator = globalThis?.navigator;
  const userAgent = String(navigator?.userAgent || '').toLowerCase();
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'windows';

  const userAgentDataPlatform = String(navigator?.userAgentData?.platform || '').toLowerCase();
  if (userAgentDataPlatform.includes('mac')) return 'mac';
  if (userAgentDataPlatform.includes('win')) return 'windows';

  const platform = String(navigator?.platform || '').toLowerCase();
  if (platform.includes('mac')) return 'mac';
  if (platform.includes('win')) return 'windows';
  return 'linux';
}

// Normalizes key aliases for presentation without changing the KeyboardEvent code used for matching.
export function normalizeShortcutKeyLabel(keyLabel, platformHint) {
  const platform = detectPlatform(platformHint);
  const normalized = String(keyLabel || '').trim();
  if (!normalized) return '';

  const aliases = {
    enter: platform === 'mac' ? 'Return' : 'Enter',
    return: platform === 'mac' ? 'Return' : 'Enter',
    backspace: platform === 'mac' ? 'Delete' : 'Backspace',
    delete: platform === 'mac' ? 'Delete' : 'Backspace',
    esc: 'Escape',
    escape: 'Escape',
    space: 'Space',
    tab: 'Tab'
  };
  const alias = aliases[normalized.toLowerCase()];
  if (alias) return alias;

  if (/^key[a-z]$/i.test(normalized)) return normalized.slice(-1).toUpperCase();
  if (/^digit\d$/i.test(normalized)) return normalized.slice(-1);
  if (/^[a-z]+$/i.test(normalized)) {
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1).toLowerCase()}`;
  }

  return normalized;
}

function normalizeShortcutDisplay(displayLabel, platformHint) {
  return String(displayLabel || '').replace(/[A-Za-z]+/g, (part) => (
    normalizeShortcutKeyLabel(part, platformHint)
  ));
}

// MARK: PUBLIC SHORTCUT LOOKUPS
// Resolves a shortcut object by its ID.
export function getShortcutById(shortcutId) {
  return keyboardShortcuts.find((shortcut) => shortcut.id === shortcutId) || null;
}

// Returns a display-friendly shortcut string for the current platform.
export function getShortcutDisplay(shortcutId, platformHint) {
  const shortcut = getShortcutById(shortcutId);
  if (!shortcut) return '';

  const platform = detectPlatform(platformHint);
  return normalizeShortcutDisplay(
    shortcut.labels?.[platform] || shortcut.labels?.linux || '',
    platform
  );
}

// Returns contextual tooltip parts split into modifier label and key label.
export function getShortcutTooltipParts(shortcutId, platformHint) {
  const shortcut = getShortcutById(shortcutId);
  if (!shortcut) {
    return {
      kbdLabel: '',
      kbdKey: '',
      showPlus: false
    };
  }

  const platform = detectPlatform(platformHint);

  const KEY_LABEL_BY_CODE = {
    Enter: {
      mac: 'Return',
      windows: 'Enter',
      linux: 'Enter'
    },
    Backspace: {
      mac: 'Delete',
      windows: 'Backspace',
      linux: 'Backspace'
    }
  };

  const explicitKeyLabel = KEY_LABEL_BY_CODE[shortcut.code]?.[platform];

  const keyLabel = normalizeShortcutKeyLabel(
    String(explicitKeyLabel || shortcut.code || '')
      .replace(/^Key/i, '')
      .replace(/^Digit/i, ''),
    platform
  );

  const modifierLabels = [];
  if (shortcut.ctrlKey) modifierLabels.push(platform === 'mac' ? '⌃' : 'Ctrl');
  if (shortcut.altKey) modifierLabels.push(platform === 'mac' ? '⌥' : 'Alt');
  if (shortcut.shiftKey) modifierLabels.push('Shift');
  if (shortcut.metaKey) modifierLabels.push('Cmd');

  return {
    kbdLabel: modifierLabels.join(' + '),
    kbdKey: keyLabel,
    showPlus: modifierLabels.length > 0
  };
}

// MARK: EVENT MATCHING
// Returns true only when code and all modifier expectations match.
function doesShortcutMatchEvent(shortcut, event) {
  if (!shortcut || !event) return false;
  if (event.code !== shortcut.code) return false;

  return MODIFIER_ORDER.every((modifierName) => {
    const expected = Boolean(shortcut[modifierName]);
    const actual = Boolean(event[modifierName]);
    return expected === actual;
  });
}

// Finds the first configured shortcut matching a KeyboardEvent.
export function matchShortcutEvent(event) {
  if (!event) return null;
  return keyboardShortcuts.find((shortcut) => doesShortcutMatchEvent(shortcut, event)) || null;
}
