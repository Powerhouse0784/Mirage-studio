import { beforeEach, describe, expect, it } from 'vitest';
import { checkOrigin, limited } from '@/lib/api';

describe('API request protections', () => {
  it('allows safe methods without requiring an Origin header', () => {
    expect(checkOrigin(new Request('https://mirage.test/api/investigations'))).toBe(true);
  });

  it('rejects cross-origin writes and malformed Origin values', () => {
    expect(checkOrigin(new Request('https://mirage.test/api/investigations', {
      method: 'POST', headers: { origin: 'https://attacker.test', host: 'mirage.test' },
    }))).toBe(false);
    expect(checkOrigin(new Request('https://mirage.test/api/investigations', {
      method: 'POST', headers: { origin: 'not a url', host: 'mirage.test' },
    }))).toBe(false);
  });

  it('permits same-origin writes and blocks explicit cross-site fetches', () => {
    expect(checkOrigin(new Request('https://mirage.test/api/investigations', {
      method: 'POST', headers: { origin: 'https://mirage.test', host: 'mirage.test' },
    }))).toBe(true);
    expect(checkOrigin(new Request('https://mirage.test/api/investigations', {
      method: 'POST', headers: { 'sec-fetch-site': 'cross-site' },
    }))).toBe(false);
  });

  it('limits requests after the configured threshold', () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    expect(limited(key, 2, 60_000)).toBe(false);
    expect(limited(key, 2, 60_000)).toBe(false);
    expect(limited(key, 2, 60_000)).toBe(true);
  });
});
