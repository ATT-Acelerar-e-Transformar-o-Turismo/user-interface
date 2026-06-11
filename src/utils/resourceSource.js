// Source-type classification for resources / indicators.
//
// Both API-backed and uploaded resources have a `wrapper_id`, so wrapper
// presence does NOT distinguish them. The real signal is the wrapper's
// `source_type`: 'API' for live API sources, 'CSV' / 'XLSX' for uploaded
// files. The backend now denormalises that onto each resource as
// `source_type`. We still accept `type` as a fallback because some older
// payloads / places in the code pass the raw source string under `type`.

export const SOURCE_API = 'api';
export const SOURCE_UPLOAD = 'upload';

const SOURCE_TYPE_VALUES = new Set(['API', 'CSV', 'XLSX']);

/** Map a raw source-type string ('API' | 'CSV' | 'XLSX' | ...) to our label. */
export function sourceFromType(sourceType) {
  if (!sourceType) return null;
  const upper = String(sourceType).toUpperCase();
  // Only classify when we actually got a known source string. Anything
  // else (e.g. "sustainability_indicator", which is the resource category)
  // means the caller didn't pass a source — return null so the UI can
  // surface "unknown" instead of silently bucketing it as upload.
  if (!SOURCE_TYPE_VALUES.has(upper)) return null;
  return upper === 'API' ? SOURCE_API : SOURCE_UPLOAD;
}

/**
 * Classify a single resource as 'api' or 'upload'. Prefers the wrapper's
 * `source_type` (denormalised onto the resource by the backend); falls
 * back to a legacy `type` field when it carries a recognised source value.
 */
export function resourceSource(resource) {
  if (!resource) return null;
  return sourceFromType(resource.source_type) ?? sourceFromType(resource.type);
}

/**
 * Classify an indicator from its attached resources. Returns 'api' when any
 * resource is an API source, 'upload' when there are resources but none are
 * API, or null when the indicator has no (typed) resources.
 */
export function indicatorSource(resources) {
  if (!Array.isArray(resources) || resources.length === 0) return null;
  const sources = resources.map(resourceSource).filter(Boolean);
  if (sources.length === 0) return null;
  return sources.some(s => s === SOURCE_API) ? SOURCE_API : SOURCE_UPLOAD;
}

/** Count a flat list of resources into { api, upload } totals. */
export function countSources(resources) {
  const counts = { [SOURCE_API]: 0, [SOURCE_UPLOAD]: 0 };
  (resources || []).forEach(r => {
    const s = resourceSource(r);
    if (s) counts[s] += 1;
  });
  return counts;
}
