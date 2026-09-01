import { buildQueryString } from '../src/utils/query';

describe('buildQueryString Utility', () => {
  it('returns empty string when params is undefined or null', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString(null as any)).toBe('');
    expect(buildQueryString({})).toBe('');
  });

  it('strips undefined, null, and empty string values', () => {
    const params = {
      page: 1,
      limit: 20,
      status: undefined,
      priority: null,
      search: '',
    };

    expect(buildQueryString(params)).toBe('?page=1&limit=20');
  });

  it('preserves boolean false and number 0', () => {
    const params = {
      isRead: false,
      offset: 0,
      filter: undefined,
    };

    expect(buildQueryString(params)).toBe('?isRead=false&offset=0');
  });

  it('encodes special characters correctly', () => {
    const params = {
      name: 'Camera Front & Back',
      query: 'test=1+2',
    };

    expect(buildQueryString(params)).toBe('?name=Camera+Front+%26+Back&query=test%3D1%2B2');
  });

  it('returns empty string when all keys are undefined or null', () => {
    const params = {
      status: undefined,
      severity: null,
      type: '',
      whitespace: '   ',
      emptyArr: [],
    };

    expect(buildQueryString(params)).toBe('');
  });

  it('handles array parameters correctly', () => {
    const params = {
      tags: ['motion', 'door'],
      page: 1,
    };

    expect(buildQueryString(params)).toBe('?tags=motion&tags=door&page=1');
  });

  it('filters empty values inside array parameters', () => {
    const params = {
      tags: ['motion', '', null, undefined, 'door'],
    };

    expect(buildQueryString(params)).toBe('?tags=motion&tags=door');
  });
});

