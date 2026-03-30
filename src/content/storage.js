const GmailNotesStorage = (() => {
  const PREFIX = GMAILNOTES_CONSTANTS.STORAGE_KEY_PREFIX;

  const keyFor = (threadId) => PREFIX + threadId;

  function getNote(threadId) {
    return new Promise(resolve => {
      const key = keyFor(threadId);
      chrome.storage.local.get(key, result => resolve(result[key] || ''));
    });
  }

  function saveNote(threadId, text) {
    return new Promise(resolve => {
      const key = keyFor(threadId);
      if (text.trim() === '') {
        chrome.storage.local.remove(key, resolve);
      } else {
        chrome.storage.local.set({ [key]: text }, resolve);
      }
    });
  }

  function deleteNote(threadId) {
    return new Promise(resolve => chrome.storage.local.remove(keyFor(threadId), resolve));
  }

  function getAllNotes() {
    return new Promise(resolve => {
      chrome.storage.local.get(null, allItems => {
        const notes = {};
        for (const [key, value] of Object.entries(allItems)) {
          if (key.startsWith(PREFIX)) notes[key.slice(PREFIX.length)] = value;
        }
        resolve(notes);
      });
    });
  }

  function deleteAllNotes() {
    return new Promise(resolve => {
      chrome.storage.local.get(null, allItems => {
        const keys = Object.keys(allItems).filter(k => k.startsWith(PREFIX));
        if (keys.length === 0) { resolve(); return; }
        chrome.storage.local.remove(keys, resolve);
      });
    });
  }

  return { getNote, saveNote, deleteNote, getAllNotes, deleteAllNotes };
})();
