import * as cheerio from 'cheerio';
import { normalizeAddress } from '../common/address';

export const MAX_TITLE_LENGTH = 120;
export const MAX_HTML_BYTES = 100 * 1024;
export const SEARCH_SNIPPET_LENGTH = 160;

const ALLOWED_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'main',
  'nav',
  'div',
  'span',
  'a',
  'style',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'mark',
  'small',
  'sub',
  'sup',
  'abbr',
  'cite',
  'q',
  'dfn',
  'time',
]);

const REMOVED_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'img',
  'audio',
  'video',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'link',
  'meta',
  'base',
  'svg',
  'math',
  'source',
  'track',
  'picture',
  'canvas',
  'noscript',
]);

function allowedAttributesFor(tagName: string): Set<string> {
  if (tagName === 'a') {
    return new Set(['href', 'title']);
  }
  return new Set(['title']);
}

function sanitizeHref(rawHref: string | undefined): string | undefined {
  if (!rawHref) {
    return undefined;
  }

  try {
    return normalizeAddress(rawHref);
  } catch {
    return undefined;
  }
}

/**
 * Sanitize published HTML with an explicit allowlist.
 * Scripts, event handlers, media, forms, and unsafe URLs are removed.
 * Anchor href values are kept only when they are valid .zz addresses.
 */
export function sanitizeSiteHtml(html: string): string {
  const $ = cheerio.load(html, null, false);

  $('*').each((_, el) => {
    const tagName = 'name' in el && typeof el.name === 'string' ? el.name.toLowerCase() : '';
    if (!tagName) {
      return;
    }

    if (REMOVED_TAGS.has(tagName) || !ALLOWED_TAGS.has(tagName)) {
      $(el).remove();
      return;
    }

    const attribs =
      'attribs' in el && el.attribs && typeof el.attribs === 'object'
        ? (el.attribs as Record<string, string>)
        : {};

    const allowed = allowedAttributesFor(tagName);
    for (const attr of Object.keys(attribs)) {
      const lower = attr.toLowerCase();
      if (lower.startsWith('on') || !allowed.has(lower)) {
        $(el).removeAttr(attr);
        continue;
      }

      if (lower === 'href') {
        const href = sanitizeHref(attribs[attr]);
        if (href) {
          $(el).attr('href', href);
        } else {
          $(el).removeAttr(attr);
        }
      }
    }
  });

  return $.root().html() ?? '';
}

/** Extract visible text from HTML for full-text search indexing. */
export function extractSearchableText(html: string): string {
  const $ = cheerio.load(html, null, false);
  $('style, script').remove();
  const text = $.root().text();
  return text.replace(/\s+/g, ' ').trim();
}

export function buildSearchSnippet(
  text: string,
  maxLength = SEARCH_SNIPPET_LENGTH,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function assertHtmlSizeLimit(html: string): void {
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > MAX_HTML_BYTES) {
    throw new Error(`HTML must be at most ${MAX_HTML_BYTES} bytes`);
  }
}
