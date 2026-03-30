const ThreadView = (() => {
  const AREA_CLASS = 'gmailnotes-thread-area';
  let saveTimer = null;

  function findInjectionPoint() {
    const h2 =
      document.querySelector('h2.hP')           ||
      document.querySelector('.ha h2')           ||
      document.querySelector('[role="main"] h2') ||
      document.querySelector('h2[tabindex="-1"]');
    if (!h2) return null;
    let el = h2.parentElement || h2;
    while (el.parentElement && el.parentElement !== document.body) {
      const d = getComputedStyle(el.parentElement).display;
      if (d !== 'flex' && d !== 'inline-flex') break;
      el = el.parentElement;
    }
    return el;
  }

  function scheduleAutosave(threadId, textarea, statusEl, charCountEl) {
    clearTimeout(saveTimer);
    statusEl.textContent = 'Saving…';
    saveTimer = setTimeout(async () => {
      await GmailNotesStorage.saveNote(threadId, textarea.value);
      NoteCache.set(threadId, textarea.value);
      const len = textarea.value.length;
      statusEl.textContent    = len ? 'Saved' : '';
      charCountEl.textContent = len ? `${len} char${len !== 1 ? 's' : ''}` : '';
    }, GMAILNOTES_CONSTANTS.DEBOUNCE_MS);
  }

  function buildArea(threadId, noteText) {
    const area = document.createElement('div');
    area.className        = AREA_CLASS;
    area.dataset.threadId = threadId;

    const label       = document.createElement('div');
    label.className   = 'gmailnotes-label';
    label.textContent = 'Notes';

    const textarea       = document.createElement('textarea');
    textarea.className   = 'gmailnotes-textarea';
    textarea.value       = noteText;
    textarea.placeholder = 'Add a note for this thread…';
    textarea.spellcheck  = true;

    const footer      = document.createElement('div');
    footer.className  = 'gmailnotes-footer';

    const statusEl      = document.createElement('span');
    statusEl.className  = 'gmailnotes-status';
    statusEl.textContent = noteText ? 'Saved' : '';

    const charCountEl      = document.createElement('span');
    charCountEl.className  = 'gmailnotes-charcount';
    charCountEl.textContent = noteText.length
      ? `${noteText.length} char${noteText.length !== 1 ? 's' : ''}` : '';

    footer.append(statusEl, charCountEl);
    area.append(label, textarea, footer);

    textarea.addEventListener('input', () =>
      scheduleAutosave(threadId, textarea, statusEl, charCountEl)
    );

    return area;
  }

  async function tryInject(urlThreadId, hexId) {
    if (!urlThreadId) return;
    const threadId = hexId || urlThreadId;
    const point    = findInjectionPoint();
    if (!point) return;

    const existing = point.nextElementSibling;
    if (existing?.classList.contains(AREA_CLASS)) {
      if (existing.dataset.threadId === threadId) return;
      existing.remove();
    }

    if (NoteCache.has(threadId)) {
      point.insertAdjacentElement('afterend', buildArea(threadId, NoteCache.get(threadId)));
      return;
    }

    if (point.dataset.gnInjecting === threadId) return;
    point.dataset.gnInjecting = threadId;

    const noteText = await NoteCache.getOrFetch(threadId);
    delete point.dataset.gnInjecting;

    const pointNow = findInjectionPoint();
    if (!pointNow) return;

    const existingNow = pointNow.nextElementSibling;
    if (existingNow?.classList.contains(AREA_CLASS)) {
      if (existingNow.dataset.threadId === threadId) return;
      existingNow.remove();
    }

    pointNow.insertAdjacentElement('afterend', buildArea(threadId, noteText));
  }

  return {
    AREA_CLASS,
    findInjectionPoint,
    tryInject,
    cancelAutosave: () => clearTimeout(saveTimer),
  };
})();
