import { normalizeBaseUrl } from './game.engine';

describe('normalizeBaseUrl (host:join-url)', () => {
  it('keeps scheme, host and port only', () => {
    expect(normalizeBaseUrl('http://192.168.1.103:15173')).toBe('http://192.168.1.103:15173');
    expect(normalizeBaseUrl('https://quiz.example.org/')).toBe('https://quiz.example.org');
    expect(normalizeBaseUrl('https://quiz.example.org/some/path?x=1#y')).toBe('');
    expect(normalizeBaseUrl('  192.168.1.5:18081  ')).toBe('http://192.168.1.5:18081');
    expect(normalizeBaseUrl('quiz.local')).toBe('http://quiz.local');
  });

  it('refuses junk and credentials, and maps empty to empty', () => {
    expect(normalizeBaseUrl('')).toBe('');
    expect(normalizeBaseUrl('not a url')).toBe('');
    expect(normalizeBaseUrl('http://user:pw@host')).toBe('');
  });
});
