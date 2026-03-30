const ListView = (() => {
  const PREVIEW_CLASS = 'gmailnotes-list-note-inner';
  const ROW_SELECTOR  = 'tr.zA, tr[jsthread], tr[data-thread-perm-id]';

  let scanTimer = null;

  function buildPreview(noteText, row) {
    const inner       = document.createElement('div');
    inner.className   = PREVIEW_CLASS;
    inner.textContent = noteText;

    const alignEl =
      row.querySelector('.ar') ||
      row.querySelector('.yP') ||
      row.querySelector('.y6') ||
      row.querySelector('.xT') ||
      row.querySelector('td.a4W');

    const cell =
      row.querySelector('.y6')?.closest('td') ||
      row.querySelector('.xT')?.closest('td') ||
      row.querySelector('td.a4W');

    if (alignEl && cell) {
      const offset = alignEl.getBoundingClientRect().left - cell.getBoundingClientRect().left;
      inner.style.marginLeft = Math.max(0, offset) + 'px';
    }

    return { inner, cell };
  }

  function injectIntoRow(note, row) {
    const { inner, cell } = buildPreview(note, row);
    if (!cell) return;
    cell.style.height     = 'auto';
    cell.style.overflow   = 'visible';
    cell.style.whiteSpace = 'normal';
    const subject = cell.querySelector('.xT') || cell.querySelector('.y6');
    if (subject) {
      subject.insertAdjacentElement('afterend', inner);
    } else {
      cell.appendChild(inner);
    }
  }

  async function processRow(row) {
    if (row.querySelector('.' + PREVIEW_CLASS)) return;
    const threadId = ThreadId.fromRow(row);
    if (!threadId) return;
    row.dataset.gnNoteId = threadId;

    if (NoteCache.has(threadId)) {
      const cached = NoteCache.get(threadId);
      if (cached) injectIntoRow(cached, row);
      return;
    }

    if (NoteCache.isInFlight(threadId)) return;
    const note = await NoteCache.getOrFetch(threadId);
    if (!note || row.querySelector('.' + PREVIEW_CLASS)) return;
    injectIntoRow(note, row);
  }

  function heal() {
    for (const row of document.querySelectorAll(ROW_SELECTOR)) {
      if (row.querySelector('.' + PREVIEW_CLASS)) continue;
      const tid = row.dataset.gnNoteId || ThreadId.fromRow(row);
      if (!tid) continue;
      row.dataset.gnNoteId = tid;
      const note = NoteCache.get(tid);
      if (note) {
        injectIntoRow(note, row);
      } else if (!NoteCache.isInFlight(tid)) {
        processRow(row);
      }
    }
  }

  function scanAll() {
    document.querySelectorAll(ROW_SELECTOR).forEach(processRow);
  }

  function debouncedScanAll() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanAll, 80);
  }

  return { ROW_SELECTOR, PREVIEW_CLASS, processRow, scanAll, debouncedScanAll, heal };
})();
