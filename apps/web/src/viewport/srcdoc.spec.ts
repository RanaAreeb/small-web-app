import { readFileSync } from 'fs';
import { join } from 'path';
import { SITE_VIEWPORT_BRIDGE_SOURCE } from './bridge-source';
import { buildSiteSrcDoc, createCspNonce } from './srcdoc';

describe('buildSiteSrcDoc', () => {
  it('wraps sanitized HTML in a full document with CSP and nonce’d bridge only', () => {
    const nonce = 'abc123nonce';
    const { srcDoc } = buildSiteSrcDoc({
      title: 'Tidepool <Journal>',
      sanitizedHtml: '<p>Hello <a href="nighttrain.zz">train</a></p>',
      nonce,
    });

    expect(srcDoc).toContain('<!DOCTYPE html>');
    expect(srcDoc).toContain('<title>Tidepool &lt;Journal&gt;</title>');
    expect(srcDoc).toContain("default-src 'none'");
    expect(srcDoc).toContain("img-src 'none'");
    expect(srcDoc).toContain("media-src 'none'");
    expect(srcDoc).toContain("connect-src 'none'");
    expect(srcDoc).toContain("frame-src 'none'");
    expect(srcDoc).toContain("object-src 'none'");
    expect(srcDoc).toContain("base-uri 'none'");
    expect(srcDoc).toContain("form-action 'none'");
    expect(srcDoc).toContain("style-src 'unsafe-inline'");
    expect(srcDoc).toContain(`script-src 'nonce-${nonce}'`);
    expect(srcDoc).toContain(`<script nonce="${nonce}">`);
    expect(srcDoc).toContain(SITE_VIEWPORT_BRIDGE_SOURCE);
    expect(srcDoc).toContain('<p>Hello <a href="nighttrain.zz">train</a></p>');

    const scriptTags = srcDoc.match(/<script\b/gi) ?? [];
    expect(scriptTags).toHaveLength(1);
  });

  it('creates unique nonces by default', () => {
    const first = createCspNonce();
    const second = createCspNonce();
    expect(first).toHaveLength(32);
    expect(second).toHaveLength(32);
    expect(first).not.toBe(second);
  });
});

describe('hostile fixture containment', () => {
  const fixture = readFileSync(
    join(__dirname, 'fixtures', 'hostile-page.html'),
    'utf8',
  );

  it('keeps hostile attempts inside srcDoc without granting them a script nonce', () => {
    const nonce = 'trusted-bridge-only';
    const bodyHtml = fixture
      .replace(/^[\s\S]*<body>/i, '')
      .replace(/<\/body>[\s\S]*$/i, '');

    const { srcDoc } = buildSiteSrcDoc({
      title: 'Hostile fixture',
      sanitizedHtml: bodyHtml,
      nonce,
    });

    expect(srcDoc).toContain("default-src 'none'");
    expect(srcDoc).toContain("img-src 'none'");
    expect(srcDoc).toContain("connect-src 'none'");
    expect(srcDoc).toContain("frame-src 'none'");
    expect(srcDoc).toContain("form-action 'none'");
    expect(srcDoc).toContain(`script-src 'nonce-${nonce}'`);

    // Author/hostile scripts are present as text in the body HTML for the fixture
    // exercise, but they do not carry our nonce and are blocked by CSP.
    const nonceScripts = srcDoc.match(/<script nonce="trusted-bridge-only">/g) ?? [];
    expect(nonceScripts).toHaveLength(1);

    expect(srcDoc).toContain('javascript:alert(1)');
    expect(srcDoc).toContain('https://evil.example');
    expect(srcDoc).toContain('onclick=');
    expect(srcDoc).toContain('href="friend.zz"');

    // Application shell constraints reflected in the document policy:
    expect(srcDoc).not.toContain('allow-same-origin');
    expect(srcDoc).not.toContain('allow-top-navigation');
    expect(srcDoc).not.toContain('allow-popups');
    expect(srcDoc).not.toContain('allow-forms');
    expect(srcDoc).not.toContain('allow-downloads');
  });

  it('documents that only the bridge script is executable under CSP', () => {
    const { srcDoc, nonce } = buildSiteSrcDoc({
      title: 'Policy',
      sanitizedHtml: '<script>alert(1)</script><p>x</p>',
    });

    expect(srcDoc).toContain(`script-src 'nonce-${nonce}'`);
    expect(srcDoc).toContain(`<script nonce="${nonce}">${SITE_VIEWPORT_BRIDGE_SOURCE}</script>`);
    // Un-nonce’d author script markup cannot satisfy script-src.
    expect(srcDoc).toContain('<script>alert(1)</script>');
    expect(srcDoc.indexOf(`<script nonce="${nonce}">`)).toBe(
      srcDoc.lastIndexOf('<script'),
    );
  });
});
