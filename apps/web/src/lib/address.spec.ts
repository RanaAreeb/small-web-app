import { InvalidAddressError, normalizeAddress } from './address';

describe('normalizeAddress (web)', () => {
  it('normalizes a valid address', () => {
    expect(normalizeAddress(' TidePool.ZZ. ')).toBe('tidepool.zz');
  });

  it('rejects real-world URLs with schemes', () => {
    expect(() => normalizeAddress('https://google.com')).toThrow(
      InvalidAddressError,
    );
    expect(() => normalizeAddress('https://google.com')).toThrow(
      'Address must not include a scheme',
    );
    expect(() => normalizeAddress('http://tidepool.zz')).toThrow(
      'Address must not include a scheme',
    );
  });

  it('rejects addresses with a path', () => {
    expect(() => normalizeAddress('tidepool.zz/about')).toThrow(
      'Address must not include a path',
    );
  });

  it('rejects non-.zz domains', () => {
    expect(() => normalizeAddress('example.com')).toThrow(
      'Address must be a single valid .zz address',
    );
  });

  it('rejects invalid characters and labels', () => {
    for (const address of [
      'tide_pool.zz',
      '-tidepool.zz',
      'tidepool-.zz',
      'tide pool.zz',
    ]) {
      expect(() => normalizeAddress(address)).toThrow(InvalidAddressError);
    }
  });
});
