import { describe, expect, it } from 'vitest';
import { isVersionPublished, parsePublishedVersionList } from './release-orchestrator.mjs';

describe('release orchestrator version guard', () => {
  it('detects versions already published to npm', () => {
    expect(parsePublishedVersionList('[]')).toEqual([]);
    expect(parsePublishedVersionList('["1.2.2","1.2.3"]')).toEqual(['1.2.2', '1.2.3']);
    expect(isVersionPublished(['1.2.2', '1.2.3'], '1.2.3')).toBe(true);
    expect(isVersionPublished(['1.2.2', '1.2.3'], '1.2.4')).toBe(false);
  });
});
