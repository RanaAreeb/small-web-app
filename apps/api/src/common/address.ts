export class InvalidAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAddressError';
  }
}

const ZZ_ADDRESS_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.zz$/;

/**
 * Normalize and validate a single .zz address.
 * Trims, lowercases, strips one trailing dot, then validates.
 */
export function normalizeAddress(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new InvalidAddressError('Address must be a string');
  }

  let address = raw.trim().toLowerCase();

  if (address.endsWith('.')) {
    address = address.slice(0, -1);
  }

  if (!address) {
    throw new InvalidAddressError('Address is required');
  }

  // Schemes use `://` or a dot-free scheme name before `:`; `host.zz:port` is a port.
  if (address.includes('://') || /^[a-z][a-z0-9+-]*:/i.test(address)) {
    throw new InvalidAddressError('Address must not include a scheme');
  }

  if (address.includes('/')) {
    throw new InvalidAddressError('Address must not include a path');
  }

  if (address.includes(':')) {
    throw new InvalidAddressError('Address must not include a port');
  }

  if (address.includes('#')) {
    throw new InvalidAddressError('Address must not include a fragment');
  }

  if (address.includes('?')) {
    throw new InvalidAddressError('Address must not include a query string');
  }

  if (address.includes(' ') || /\s/.test(address)) {
    throw new InvalidAddressError('Address must not include whitespace');
  }

  if (!address.endsWith('.zz')) {
    throw new InvalidAddressError('Address must be a single valid .zz address');
  }

  if (!ZZ_ADDRESS_PATTERN.test(address)) {
    throw new InvalidAddressError('Address must be a single valid .zz address');
  }

  return address;
}
