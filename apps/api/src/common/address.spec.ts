import { normalizeAddress, InvalidAddressError } from './address';

describe('normalizeAddress', () => {
  describe('normalization', () => {
    it('trims whitespace', () => {
      expect(normalizeAddress('  home.zz  ')).toBe('home.zz');
    });

    it('lowercases the address', () => {
      expect(normalizeAddress('Home.ZZ')).toBe('home.zz');
    });

    it('removes one trailing dot', () => {
      expect(normalizeAddress('home.zz.')).toBe('home.zz');
    });

    it('accepts a valid multi-label .zz address', () => {
      expect(normalizeAddress('blog.alice.zz')).toBe('blog.alice.zz');
    });

    it('accepts hyphenated labels', () => {
      expect(normalizeAddress('my-site.zz')).toBe('my-site.zz');
    });
  });

  describe('rejection', () => {
    it('rejects non-string values', () => {
      expect(() => normalizeAddress(null)).toThrow(InvalidAddressError);
      expect(() => normalizeAddress(42)).toThrow('Address must be a string');
    });

    it('rejects empty input', () => {
      expect(() => normalizeAddress('')).toThrow('Address is required');
      expect(() => normalizeAddress('   ')).toThrow('Address is required');
      expect(() => normalizeAddress('.')).toThrow('Address is required');
    });

    it('rejects schemes', () => {
      expect(() => normalizeAddress('http://home.zz')).toThrow(
        'Address must not include a scheme',
      );
      expect(() => normalizeAddress('https://home.zz')).toThrow(
        'Address must not include a scheme',
      );
      expect(() => normalizeAddress('gemini://home.zz')).toThrow(
        'Address must not include a scheme',
      );
    });

    it('rejects paths', () => {
      expect(() => normalizeAddress('home.zz/about')).toThrow(
        'Address must not include a path',
      );
      expect(() => normalizeAddress('home.zz/')).toThrow(
        'Address must not include a path',
      );
    });

    it('rejects ports', () => {
      expect(() => normalizeAddress('home.zz:3000')).toThrow(
        'Address must not include a port',
      );
    });

    it('rejects fragments', () => {
      expect(() => normalizeAddress('home.zz#section')).toThrow(
        'Address must not include a fragment',
      );
    });

    it('rejects query strings', () => {
      expect(() => normalizeAddress('home.zz?q=1')).toThrow(
        'Address must not include a query string',
      );
    });

    it('rejects non-.zz addresses', () => {
      expect(() => normalizeAddress('home.com')).toThrow(
        'Address must be a single valid .zz address',
      );
      expect(() => normalizeAddress('localhost')).toThrow(
        'Address must be a single valid .zz address',
      );
    });

  it('rejects whitespace inside the address', () => {
    expect(() => normalizeAddress('tide pool.zz')).toThrow(
      'Address must not include whitespace',
    );
  });

  it('rejects invalid hostname characters', () => {
      expect(() => normalizeAddress('home_site.zz')).toThrow(
        'Address must be a single valid .zz address',
      );
      expect(() => normalizeAddress('-home.zz')).toThrow(
        'Address must be a single valid .zz address',
      );
      expect(() => normalizeAddress('home-.zz')).toThrow(
        'Address must be a single valid .zz address',
      );
      expect(() => normalizeAddress('tide_pool.zz')).toThrow(
        'Address must be a single valid .zz address',
      );
    });
  });
});
