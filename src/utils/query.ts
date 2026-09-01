/**
 * Utility to construct clean, sanitized query strings without undefined, null, or empty values.
 * Prevents URLSearchParams from serializing undefined values into literal "undefined" query params.
 *
 * @example
 * buildQueryString({ page: 1, limit: 20, status: undefined }) // "?page=1&limit=20"
 * buildQueryString({ status: undefined }) // ""
 * buildQueryString({ tags: ['motion', 'door'] }) // "?tags=motion&tags=door"
 * buildQueryString() // ""
 */
export const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';

  const entries = Object.entries(params).filter(([_, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (entries.length === 0) return '';

  const searchParams = new URLSearchParams();
  entries.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && (typeof item !== 'string' || item.trim() !== '')) {
          searchParams.append(key, String(item));
        }
      });
    } else {
      searchParams.append(key, typeof value === 'string' ? value.trim() : String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

