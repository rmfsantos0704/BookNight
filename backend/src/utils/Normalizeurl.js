// Query params that don't change the actual content of a page - stripped
// before comparing URLs so tracking-param variants of the same link are
// still recognized as duplicates.
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'ref',
  'igshid',
]);

/**
 * Normalizes a URL for duplicate comparison: lowercases the host, strips
 * "www.", drops tracking params, removes a trailing slash and the hash
 * fragment, and always represents the scheme as https (http/https variants
 * of the same domain are treated as the same page).
 *
 * Returns null for unparseable input or non-HTTP protocols rather than throwing, 
 * so callers can decide how to handle it.
 */
function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    // Filter out non-web schemas (like mailto:, ftp:, ws:)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    // Use .host instead of .hostname to preserve port numbers (e.g., :8080)
    const host = url.host.toLowerCase().replace(/^www\./, '');

    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const params = new URLSearchParams(url.search);
    for (const key of [...params.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) params.delete(key);
    }
    
    // Sort remaining params so ?b=2&a=1 and ?a=1&b=2 normalize identically.
    params.sort();
    const query = params.toString();

    return `https://${host}${pathname}${query ? `?${query}` : ''}`;
  } catch {
    return null;
  }
}

module.exports = { normalizeUrl };