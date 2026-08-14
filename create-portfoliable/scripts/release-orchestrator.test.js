import { describe, expect, it } from 'vitest';
import {
  isVersionPublished,
  parsePublishedVersionList,
  resolveNextUniqueVersion,
} from './release-orchestrator.mjs';

describe('release orchestrator version guard', () => {
  it('detects versions already published to npm', () => {
    expect(parsePublishedVersionList('[]')).toEqual([]);
    expect(parsePublishedVersionList('["1.2.2","1.2.3"]')).toEqual(['1.2.2', '1.2.3']);
    expect(isVersionPublished(['1.2.2', '1.2.3'], '1.2.3')).toBe(true);
    expect(isVersionPublished(['1.2.2', '1.2.3'], '1.2.4')).toBe(false);
  });

  it('bumps until it finds an unpublished version', () => {
    expect(resolveNextUniqueVersion('1.2.4', 'patch', ['1.2.4', '1.2.5'])).toBe('1.2.6');
    expect(resolveNextUniqueVersion('1.2.3', 'patch', ['1.2.3', '1.2.4'])).toBe('1.2.5');
  });
});
