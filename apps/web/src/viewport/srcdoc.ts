import { SITE_VIEWPORT_BRIDGE_SOURCE } from './bridge-source';

export type SrcDocParts = {
  nonce: string;
  srcDoc: string;
};

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Create a cryptographically strong CSP nonce for the trusted bridge only. */
export function createCspNonce(
  randomSource: Pick<Crypto, 'getRandomValues'> = globalThis.crypto,
): string {
  const bytes = new Uint8Array(16);
  randomSource.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Build a complete HTML document for iframe srcDoc around already-sanitized body HTML.
 * Author markup is placed only inside <body>; the sole executable script is our nonce'd bridge.
 */
export function buildSiteSrcDoc(options: {
  title: string;
  sanitizedHtml: string;
  nonce?: string;
}): SrcDocParts {
  const nonce = options.nonce ?? createCspNonce();
  const title = escapeHtmlText(options.title);
  const csp = [
    "default-src 'none'",
    "img-src 'none'",
    "media-src 'none'",
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "style-src 'unsafe-inline'",
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  const srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(csp)}" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  html, body { margin: 0; padding: 0; }
  body {
    padding: 1.25rem 1.5rem 2rem;
    color: #1a1d21;
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1.7;
    background: #f5f6f7;
  }
  a { color: #1f4e46; }
</style>
</head>
<body>
${options.sanitizedHtml}
<script nonce="${escapeAttribute(nonce)}">${SITE_VIEWPORT_BRIDGE_SOURCE}</script>
</body>
</html>`;

  return { nonce, srcDoc };
}
