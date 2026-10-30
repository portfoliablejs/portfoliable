// File: src/tooltip.contract.test.js
// Purpose: Keep primary action shortcut tooltip parts free of duplicated key labels.

import { describe, expect, it } from 'vitest';

import { getShortcutTooltipParts } from '../templates/configs/portfoliable.a11y.config.js';

describe('primary action tooltip contract', () => {
  it('uses the Enter key as the key-only label for the open-player shortcut', () => {
    const tooltipParts = getShortcutTooltipParts('open-player');

    expect(tooltipParts).toMatchObject({
      kbdLabel: '',
      showPlus: false
    });
    expect(['Enter', 'Return']).toContain(tooltipParts.kbdKey);
  });
});
