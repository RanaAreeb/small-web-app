'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  BRIDGE_LINK_CLICK,
  BRIDGE_SCROLL,
  createRestoreScrollMessage,
  parseBridgeToParentMessage,
} from '@/viewport/messages';
import { buildSiteSrcDoc } from '@/viewport/srcdoc';

type SiteViewportProps = {
  title: string;
  sanitizedHtml: string;
  scrollY: number;
  onLinkClick: (address: string) => void;
  onScrollY: (scrollY: number) => void;
};

/**
 * Secure site renderer.
 *
 * Author HTML never enters the parent DOM. It is only supplied to a sandboxed
 * iframe via srcDoc. The frame uses `sandbox="allow-scripts"` without
 * `allow-same-origin`, so it has an opaque origin: `event.origin` is `"null"`
 * and cannot identify the sender. Parents must compare `event.source` to this
 * iframe's `contentWindow` before trusting any bridge message.
 */
export function SiteViewport({
  title,
  sanitizedHtml,
  scrollY,
  onLinkClick,
  onScrollY,
}: SiteViewportProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onLinkClickRef = useRef(onLinkClick);
  const onScrollYRef = useRef(onScrollY);
  const lastRestoredScrollRef = useRef<number | null>(null);

  onLinkClickRef.current = onLinkClick;
  onScrollYRef.current = onScrollY;

  const { srcDoc } = useMemo(
    () => buildSiteSrcDoc({ title, sanitizedHtml }),
    [title, sanitizedHtml],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frameWindow = iframeRef.current?.contentWindow;
      // Required under opaque origin: origin is always "null".
      if (!frameWindow || event.source !== frameWindow) {
        return;
      }

      const message = parseBridgeToParentMessage(event.data);
      if (!message) {
        return;
      }

      if (message.type === BRIDGE_LINK_CLICK) {
        onLinkClickRef.current(message.address);
        return;
      }

      if (message.type === BRIDGE_SCROLL) {
        onScrollYRef.current(message.scrollY);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    lastRestoredScrollRef.current = null;
  }, [srcDoc]);

  useEffect(() => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) {
      return;
    }
    if (lastRestoredScrollRef.current === scrollY) {
      return;
    }
    lastRestoredScrollRef.current = scrollY;
    // Opaque origin requires targetOrigin "*".
    frameWindow.postMessage(createRestoreScrollMessage(scrollY), '*');
  }, [scrollY, srcDoc]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      data-testid="site-viewport"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className="h-full min-h-[28rem] w-full flex-1 border-0 bg-[var(--background)]"
      onLoad={() => {
        const frameWindow = iframeRef.current?.contentWindow;
        if (!frameWindow) {
          return;
        }
        lastRestoredScrollRef.current = scrollY;
        frameWindow.postMessage(createRestoreScrollMessage(scrollY), '*');
      }}
    />
  );
}
