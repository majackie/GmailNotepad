const ThreadId = (() => {
  const VALID_ID   = /^[A-Za-z0-9_-]{10,}$/;
  const VALID_LONG = /^[A-Za-z0-9_-]{16,}$/;
  const HEX_SUBSTR = /[a-fA-F0-9]{16,}/;

  function fromRow(row) {
    for (const attr of ['data-thread-perm-id', 'data-legacy-thread-id', 'jsthread']) {
      const val = row.getAttribute(attr);
      if (val && VALID_ID.test(val)) return val;
    }

    const withPerm = row.querySelector('[data-thread-perm-id]');
    if (withPerm) {
      const val = withPerm.getAttribute('data-thread-perm-id');
      if (val && VALID_ID.test(val)) return val;
    }

    for (const a of row.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || '';
      const idx  = href.indexOf('#');
      if (idx !== -1) {
        const id = ThreadDetector.extractThreadId(href.slice(idx));
        if (id) return id;
      }
    }

    const cb = row.querySelector('input[type="checkbox"][id]');
    if (cb) {
      const m = (cb.id || '').match(HEX_SUBSTR);
      if (m) return m[0];
    }

    for (const el of row.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        if (VALID_LONG.test(attr.value)) return attr.value;
      }
    }

    return null;
  }

  return { fromRow };
})();
