import { describe, expect, it } from 'vitest';

import './prism-runtime.js';

describe('Prism runtime', () => {
    it('initializes Prism without requiring a default ESM export', () => {
        expect(globalThis.Prism).toBeDefined();
        expect(typeof globalThis.Prism.highlight).toBe('function');
    });
});
