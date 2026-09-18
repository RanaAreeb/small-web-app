import { InvalidAddressError, normalizeAddress } from './address';

describe('normalizeAddress (web)', () => {
  it('normalizes a valid address', () => {
    expect(normalizeAddress(' TidePool.ZZ. ')).toBe('tidepool.zz');
  });

  it('rejects schemes and paths', () => {
    expect(() => normalizeAddress('http://tidepool.zz')).toThrow(
      InvalidAddressError,
    );
    expect(() => normalizeAddress('tidepool.zz/path')).toThrow(
      InvalidAddressError,
    );
  });
});
