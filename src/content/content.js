(function () {
  'use strict';

  let currentHexId   = null;
  let navigatingToId = null;
  let threadReady    = false;
  let blockUrlId     = null;
  let fromThread     = false;

  document.addEventListener('click', e => {
    const row = e.target.closest(ListView.ROW_SELECTOR);
    if (!row) return;
    const id = ThreadId.fromRow(row);
    if (!id) return;
    blockUrlId     = ThreadDetector.extractThreadId(window.location.hash);
    currentHexId   = id;
    navigatingToId = id;
    threadReady    = true;
  }, true);

  function teardownThreadArea() {
    const area = document.querySelector('.' + ThreadView.AREA_CLASS);
    if (!area) return;
    const textarea = area.querySelector('.gmailnotes-textarea');
    if (textarea && area.dataset.threadId) NoteCache.prime(area.dataset.threadId, textarea.value);
    area.remove();
  }

  function injectIfNeeded(urlThreadId) {
    if (!document.querySelector('h2.hP')) return;
    const existing = document.querySelector('.' + ThreadView.AREA_CLASS);
    if (existing?.dataset.threadId === currentHexId) {
      const point = ThreadView.findInjectionPoint();
      if (!point || !point.parentElement || point.parentElement.contains(existing)) return;
      point.insertAdjacentElement('afterend', existing);
      return;
    }
    const point = ThreadView.findInjectionPoint();
    if (!point) return;
    ThreadView.tryInject(urlThreadId, currentHexId);
  }

  function onThreadChange(urlThreadId) {
    ThreadView.cancelAutosave();
    fromThread = false;

    if (!urlThreadId) {
      if (!navigatingToId) {
        teardownThreadArea();
        currentHexId = null;
        threadReady  = false;
        blockUrlId   = null;
      }
      ListView.scanAll();
      return;
    }

    navigatingToId = null;
    blockUrlId     = null;
    threadReady    = true;
    if (!currentHexId) currentHexId = urlThreadId;
    injectIfNeeded(urlThreadId);
  }

  const domObserver = new MutationObserver(() => {
    const urlId = ThreadDetector.extractThreadId(window.location.hash);

    if (threadReady && !navigatingToId && !blockUrlId && !urlId) {
      threadReady = false;
      teardownThreadArea();
    }

    ListView.heal();
    ListView.debouncedScanAll();

    if (!threadReady || !currentHexId) return;
    if (blockUrlId && urlId === blockUrlId) return;
    if (!urlId) return;
    if (fromThread) return;

    injectIfNeeded(urlId);
  });

  domObserver.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('hashchange', () => {
    blockUrlId = null;
    const urlThreadId = ThreadDetector.extractThreadId(window.location.hash);
    if (!urlThreadId) return;
    if (!currentHexId) currentHexId = urlThreadId;
    threadReady = true;

    const stale = document.querySelector('.' + ThreadView.AREA_CLASS);
    if (stale && stale.dataset.threadId !== currentHexId) {
      teardownThreadArea();
      fromThread = true;
      return;
    }

    fromThread = false;
    injectIfNeeded(urlThreadId);
  });

  chrome.runtime.onMessage.addListener((message) => {
    const { type, threadId, text } = message;

    if (type === 'OPEN_THREAD') {
      blockUrlId     = ThreadDetector.extractThreadId(window.location.hash);
      currentHexId   = threadId;
      navigatingToId = threadId;
      threadReady    = true;
      NoteCache.prefetch(threadId);
      return;
    }

    if (type === 'NOTE_RESTORED') {
      NoteCache.set(threadId, text);
      for (const row of document.querySelectorAll('[data-gn-note-id]')) {
        if (row.dataset.gnNoteId === threadId) ListView.processRow(row);
      }
      const area = document.querySelector('.' + ThreadView.AREA_CLASS + '[data-thread-id="' + threadId + '"]');
      if (area) {
        const textarea = area.querySelector('.gmailnotes-textarea');
        if (textarea) textarea.value = text;
      }
      return;
    }

    if (type === 'NOTE_DELETED') {
      NoteCache.set(threadId, '');
      for (const row of document.querySelectorAll('[data-gn-note-id]')) {
        if (row.dataset.gnNoteId === threadId) row.querySelector('.' + ListView.PREVIEW_CLASS)?.remove();
      }
      document.querySelector('.' + ThreadView.AREA_CLASS + '[data-thread-id="' + threadId + '"]')?.remove();
    }
  });

  GmailNotesStorage.getAllNotes().then(notes => {
    for (const [id, text] of Object.entries(notes)) NoteCache.set(id, text);
    ListView.scanAll();
  });

  ThreadDetector.create().start(onThreadChange);
})();
