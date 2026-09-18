import { normalizeAddress } from '@/lib/address';

export const BRIDGE_LINK_CLICK = 'LINK_CLICK' as const;
export const BRIDGE_SCROLL = 'SCROLL' as const;
export const BRIDGE_RESTORE_SCROLL = 'RESTORE_SCROLL' as const;

export type LinkClickMessage = {
  type: typeof BRIDGE_LINK_CLICK;
  address: string;
};

export type ScrollMessage = {
  type: typeof BRIDGE_SCROLL;
  scrollY: number;
};

export type RestoreScrollMessage = {
  type: typeof BRIDGE_RESTORE_SCROLL;
  scrollY: number;
};

export type BridgeToParentMessage = LinkClickMessage | ScrollMessage;
export type ParentToBridgeMessage = RestoreScrollMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Validate postMessage payloads from the sandboxed site iframe before acting.
 *
 * Opaque-origin note: with `sandbox="allow-scripts"` and without
 * `allow-same-origin`, the iframe has an opaque origin. Incoming
 * `MessageEvent.origin` is therefore `"null"` and cannot identify which frame
 * sent the message. The parent must still verify `event.source ===
 * iframe.contentWindow` so another window cannot spoof `origin: "null"`
 * messages. Type/value checks below are a second gate after source matching.
 */
export function parseBridgeToParentMessage(
  data: unknown,
): BridgeToParentMessage | null {
  if (!isRecord(data) || typeof data.type !== 'string') {
    return null;
  }

  if (data.type === BRIDGE_LINK_CLICK) {
    if (typeof data.address !== 'string') {
      return null;
    }
    try {
      return {
        type: BRIDGE_LINK_CLICK,
        address: normalizeAddress(data.address),
      };
    } catch {
      return null;
    }
  }

  if (data.type === BRIDGE_SCROLL) {
    if (typeof data.scrollY !== 'number' || !Number.isFinite(data.scrollY)) {
      return null;
    }
    if (data.scrollY < 0) {
      return null;
    }
    return {
      type: BRIDGE_SCROLL,
      scrollY: data.scrollY,
    };
  }

  return null;
}

export function parseParentToBridgeMessage(
  data: unknown,
): ParentToBridgeMessage | null {
  if (!isRecord(data) || data.type !== BRIDGE_RESTORE_SCROLL) {
    return null;
  }
  if (typeof data.scrollY !== 'number' || !Number.isFinite(data.scrollY)) {
    return null;
  }
  if (data.scrollY < 0) {
    return null;
  }
  return {
    type: BRIDGE_RESTORE_SCROLL,
    scrollY: data.scrollY,
  };
}

export function createRestoreScrollMessage(scrollY: number): RestoreScrollMessage {
  return {
    type: BRIDGE_RESTORE_SCROLL,
    scrollY,
  };
}
