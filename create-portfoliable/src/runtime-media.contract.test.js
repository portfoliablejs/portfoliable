// File: src/runtime-media.contract.test.js
// Purpose: Validate that media candidate probing rejects SPA fallbacks and never guesses a source.
// Author: Lio Schimanko

// MARK: IMPORTS
import { describe, expect, it, vi } from 'vitest';

import {
  isRuntimeMediaResponse,
  pickReachableRuntimeMediaUrl,
} from './runtime-media.contract.js';

// MARK: TEST HELPERS
// Builds a minimal fetch Response stand-in with the headers the probe inspects.
function makeResponse({ status = 200, contentType = '' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
  };
}

const CANONICAL = '/src/content/cases/template-case/template-video.mp4';
const TEMPLATE = '/templates/src/content/cases/template-case/template-video.mp4';

// MARK: RESPONSE CLASSIFICATION TESTS
describe('isRuntimeMediaResponse', () => {
  // Vite answers unknown dev paths with index.html at status 200.
  it('rejects HTML responses served as a dev-server SPA fallback', () => {
    expect(isRuntimeMediaResponse(makeResponse({ contentType: 'text/html; charset=utf-8' }))).toBe(false);
    expect(isRuntimeMediaResponse(makeResponse({ contentType: 'application/xhtml+xml' }))).toBe(false);
  });

  // Real media and untyped static responses must stay acceptable.
  it('accepts media and content-type-less responses', () => {
    expect(isRuntimeMediaResponse(makeResponse({ contentType: 'video/mp4' }))).toBe(true);
    expect(isRuntimeMediaResponse(makeResponse({ contentType: 'application/octet-stream' }))).toBe(true);
    expect(isRuntimeMediaResponse(makeResponse({ contentType: '' }))).toBe(true);
  });

  // Non-success statuses and missing responses are never media.
  it('rejects failed and absent responses', () => {
    expect(isRuntimeMediaResponse(makeResponse({ status: 404, contentType: 'video/mp4' }))).toBe(false);
    expect(isRuntimeMediaResponse(null)).toBe(false);
  });
});

// MARK: CANDIDATE PROBING TESTS
describe('pickReachableRuntimeMediaUrl', () => {
  // Regression: the SPA fallback used to win and overwrite the working source.
  it('skips a candidate answered by the SPA fallback and keeps probing', async () => {
    const fetchImpl = vi.fn(async (url) =>
      url === CANONICAL
        ? makeResponse({ contentType: 'video/mp4' })
        : makeResponse({ contentType: 'text/html' }));

    await expect(pickReachableRuntimeMediaUrl([TEMPLATE, CANONICAL], fetchImpl)).resolves.toBe(CANONICAL);
  });

  // Absolute URLs are trusted without a network round-trip.
  it('returns absolute URLs without probing', async () => {
    const fetchImpl = vi.fn();

    await expect(pickReachableRuntimeMediaUrl(['https://cdn.test/video.mp4'], fetchImpl))
      .resolves.toBe('https://cdn.test/video.mp4');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  // Some static hosts answer HEAD with 405, so a single-byte range confirms the file instead.
  it('falls back to a ranged GET when HEAD is unsupported', async () => {
    const fetchImpl = vi.fn(async (_url, options) =>
      options.method === 'HEAD'
        ? makeResponse({ status: 405 })
        : makeResponse({ status: 206, contentType: 'video/mp4' }));

    await expect(pickReachableRuntimeMediaUrl([CANONICAL], fetchImpl)).resolves.toBe(CANONICAL);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].headers).toEqual({ Range: 'bytes=0-0' });
  });

  // Returning '' is what stops the caller from replacing an already bound source.
  it('returns an empty string when no candidate is confirmed', async () => {
    const fetchImpl = vi.fn(async () => makeResponse({ contentType: 'text/html' }));

    await expect(pickReachableRuntimeMediaUrl([TEMPLATE, CANONICAL], fetchImpl)).resolves.toBe('');
  });

  // Network failures must not promote an unverified candidate either.
  it('returns an empty string when probing throws', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });

    await expect(pickReachableRuntimeMediaUrl([TEMPLATE, CANONICAL], fetchImpl)).resolves.toBe('');
  });
});
