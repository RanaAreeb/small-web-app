import {
  BRIDGE_LINK_CLICK,
  BRIDGE_RESTORE_SCROLL,
  BRIDGE_SCROLL,
  createRestoreScrollMessage,
  parseBridgeToParentMessage,
  parseParentToBridgeMessage,
} from './messages';

describe('parseBridgeToParentMessage', () => {
  it('accepts a valid LINK_CLICK with a .zz address', () => {
    expect(
      parseBridgeToParentMessage({
        type: BRIDGE_LINK_CLICK,
        address: ' Friend.ZZ. ',
      }),
    ).toEqual({
      type: BRIDGE_LINK_CLICK,
      address: 'friend.zz',
    });
  });

  it('rejects javascript: and non-.zz LINK_CLICK values', () => {
    expect(
      parseBridgeToParentMessage({
        type: BRIDGE_LINK_CLICK,
        address: 'javascript:alert(1)',
      }),
    ).toBeNull();
    expect(
      parseBridgeToParentMessage({
        type: BRIDGE_LINK_CLICK,
        address: 'https://evil.example',
      }),
    ).toBeNull();
    expect(
      parseBridgeToParentMessage({
        type: BRIDGE_LINK_CLICK,
        address: 'not-an-address',
      }),
    ).toBeNull();
  });

  it('accepts finite non-negative SCROLL values', () => {
    expect(
      parseBridgeToParentMessage({ type: BRIDGE_SCROLL, scrollY: 120 }),
    ).toEqual({ type: BRIDGE_SCROLL, scrollY: 120 });
  });

  it('rejects malformed SCROLL payloads', () => {
    expect(
      parseBridgeToParentMessage({ type: BRIDGE_SCROLL, scrollY: -1 }),
    ).toBeNull();
    expect(
      parseBridgeToParentMessage({ type: BRIDGE_SCROLL, scrollY: Number.NaN }),
    ).toBeNull();
    expect(
      parseBridgeToParentMessage({ type: BRIDGE_SCROLL, scrollY: '40' }),
    ).toBeNull();
  });

  it('rejects unknown or incomplete messages', () => {
    expect(parseBridgeToParentMessage(null)).toBeNull();
    expect(parseBridgeToParentMessage({ type: 'HACK' })).toBeNull();
    expect(
      parseBridgeToParentMessage({ type: BRIDGE_LINK_CLICK }),
    ).toBeNull();
    expect(
      parseBridgeToParentMessage({
        type: BRIDGE_RESTORE_SCROLL,
        scrollY: 10,
      }),
    ).toBeNull();
  });
});

describe('parseParentToBridgeMessage', () => {
  it('accepts RESTORE_SCROLL', () => {
    expect(
      parseParentToBridgeMessage(createRestoreScrollMessage(80)),
    ).toEqual({
      type: BRIDGE_RESTORE_SCROLL,
      scrollY: 80,
    });
  });

  it('rejects invalid restore payloads', () => {
    expect(
      parseParentToBridgeMessage({
        type: BRIDGE_RESTORE_SCROLL,
        scrollY: -4,
      }),
    ).toBeNull();
  });
});
