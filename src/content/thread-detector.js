const ThreadDetector = (() => {
  function extractThreadId(hash) {
    if (!hash || hash === '#') return null;
    const parts = hash.replace(/^#/, '').split('/');
    const candidate = parts[parts.length - 1];
    return /^[A-Za-z0-9_-]{16,}$/.test(candidate) ? candidate : null;
  }

  function create() {
    let lastThreadId   = Symbol('initial');
    let observer       = null;
    let settleTimer    = null;
    let onThreadChange = null;

    function check() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const id = extractThreadId(window.location.hash);
        if (id !== lastThreadId) {
          lastThreadId = id;
          if (onThreadChange) onThreadChange(id);
        }
      }, GMAILNOTES_CONSTANTS.SETTLE_MS);
    }

    function start(callback) {
      onThreadChange = callback;
      window.addEventListener('hashchange', check);
      observer = new MutationObserver(check);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributeFilter: ['data-thread-perm-id'],
      });
      check();
    }

    function stop() {
      window.removeEventListener('hashchange', check);
      if (observer) { observer.disconnect(); observer = null; }
      clearTimeout(settleTimer);
    }

    return { start, stop };
  }

  return { create, extractThreadId };
})();
