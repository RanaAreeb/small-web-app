/**
 * Trusted bridge injected into the sandboxed srcDoc.
 * Kept as a string so it can be embedded with a CSP nonce.
 */
export const SITE_VIEWPORT_BRIDGE_SOURCE = `
(function () {
  function normalizeZz(raw) {
    if (typeof raw !== 'string') return null;
    var address = raw.trim().toLowerCase();
    if (address.charAt(address.length - 1) === '.') {
      address = address.slice(0, -1);
    }
    if (!address) return null;
    if (address.indexOf('://') !== -1 || /^[a-z][a-z0-9+-]*:/i.test(address)) return null;
    if (address.indexOf('/') !== -1) return null;
    if (address.indexOf(':') !== -1) return null;
    if (address.indexOf('#') !== -1) return null;
    if (address.indexOf('?') !== -1) return null;
    if (/\\s/.test(address)) return null;
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\\.zz$/.test(address)) {
      return null;
    }
    return address;
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var anchor = target.closest('a');
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    var address = normalizeZz(href);
    if (!address) return;
    event.preventDefault();
    event.stopPropagation();
    parent.postMessage({ type: 'LINK_CLICK', address: address }, '*');
  }, true);

  var scrollScheduled = false;
  window.addEventListener('scroll', function () {
    if (scrollScheduled) return;
    scrollScheduled = true;
    setTimeout(function () {
      scrollScheduled = false;
      var y = window.scrollY || window.pageYOffset || 0;
      parent.postMessage({ type: 'SCROLL', scrollY: y }, '*');
    }, 100);
  }, { passive: true });

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== 'RESTORE_SCROLL') return;
    if (typeof data.scrollY !== 'number' || !isFinite(data.scrollY) || data.scrollY < 0) return;
    window.scrollTo(0, data.scrollY);
  });
})();
`.trim();
