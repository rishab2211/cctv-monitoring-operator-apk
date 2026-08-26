import { getApiErrorMessage } from '../src/utils/error';

describe('getApiErrorMessage', () => {
  it('returns default message if error is null/undefined', () => {
    expect(getApiErrorMessage(null)).toBe('An unexpected error occurred.');
    expect(getApiErrorMessage(undefined, 'Fallback error')).toBe('Fallback error');
  });

  it('formats backend validation errors array', () => {
    const error = {
      response: {
        data: {
          success: false,
          statusCode: 400,
          message: 'Validation failed',
          errors: [
            { field: 'description', message: 'Description must be at least 10 characters' },
            { field: 'title', message: 'Title must be at least 3 characters' },
          ],
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe(
      'Description must be at least 10 characters\nTitle must be at least 3 characters'
    );
  });

  it('returns direct message if no errors array is present', () => {
    const error = {
      response: {
        data: {
          success: false,
          message: 'Camera not found',
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe('Camera not found');
  });

  it('handles network errors cleanly', () => {
    const error = new Error('Network Error');
    expect(getApiErrorMessage(error)).toBe('Network error: Please check your connection and try again.');
  });

  it('falls back to Error message or default', () => {
    const error = new Error('Custom JS error');
    expect(getApiErrorMessage(error)).toBe('Custom JS error');
  });
});
