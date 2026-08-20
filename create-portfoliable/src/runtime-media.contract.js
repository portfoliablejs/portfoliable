// File: src/runtime-media.contract.js
// Purpose: Confirm that a runtime media candidate URL points at real media before it is bound.
// Author: Lio Schimanko

// MARK: RESPONSE CLASSIFICATION
// Dev servers answer unknown paths with an HTML SPA fallback at status 200, so HTML must never count as media.
export function isRuntimeMediaResponse(response) {
    if (!response || !response.ok) return false;

    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    if (!contentType) return true;

    return !(contentType.startsWith('text/html') || contentType.startsWith('application/xhtml'));
}

// MARK: CANDIDATE PROBING
// Returns '' when no candidate is confirmed so callers keep the already bound source.
export async function pickReachableRuntimeMediaUrl(candidates = [], fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') return '';

    for (const candidate of candidates) {
        if (!candidate) continue;
        if (/^(?:https?:|data:|blob:)/i.test(candidate)) {
            return candidate;
        }

        let headResponse = null;
        try {
            headResponse = await fetchImpl(candidate, {
                method: 'HEAD',
                cache: 'no-store'
            });
        } catch {
            headResponse = null;
        }

        if (isRuntimeMediaResponse(headResponse)) {
            return candidate;
        }

        const headUnsupported = !headResponse || headResponse.status === 405 || headResponse.status === 501;
        if (!headUnsupported) continue;

        try {
            // Single-byte range confirms the resource without downloading the media payload.
            const rangedResponse = await fetchImpl(candidate, {
                method: 'GET',
                cache: 'no-store',
                headers: { Range: 'bytes=0-0' }
            });

            if (isRuntimeMediaResponse(rangedResponse)) {
                return candidate;
            }
        } catch {
            // Try next candidate when ranged probing is unavailable.
        }
    }

    return '';
}
