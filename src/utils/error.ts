/**
 * Utility to extract clean, user-friendly error messages from API responses.
 * Formats backend validation errors, custom messages, and network errors.
 */
export const getApiErrorMessage = (
  error: any,
  defaultMessage: string = 'An unexpected error occurred.'
): string => {
  if (!error) return defaultMessage;

  const data = error.response?.data;
  if (data) {
    // 1. Structured validation errors: { message: "Validation failed", errors: [{ field: "description", message: "..." }] }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((e: any) => e.message || (e.field ? `${e.field}: invalid value` : null))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    // 2. Direct message in response
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }

    // 3. Fallback error string
    if (typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error;
    }
  }

  // 4. Axios error message or standard Error message
  if (error.message && typeof error.message === 'string') {
    if (error.message === 'Network Error') {
      return 'Network error: Please check your connection and try again.';
    }
    return error.message;
  }

  return defaultMessage;
};
