const NoteCache = (() => {
  const cache   = new Map();
  const pending = new Map();

  return {
    has:   (id)       => cache.has(id),
    get:   (id)       => cache.get(id),
    set:   (id, text) => { cache.set(id, text); pending.delete(id); },
    prime: (id, text) => cache.set(id, text),

    getOrFetch(id) {
      if (cache.has(id)) return Promise.resolve(cache.get(id));
      if (pending.has(id)) return pending.get(id);
      const p = GmailNotesStorage.getNote(id).then(text => {
        cache.set(id, text);
        pending.delete(id);
        return text;
      });
      pending.set(id, p);
      return p;
    },

    prefetch(id) {
      if (!cache.has(id) && !pending.has(id)) this.getOrFetch(id);
    },

    isInFlight:    (id) => pending.has(id),
    addInFlight:   ()   => {},
    clearInFlight: ()   => {},
  };
})();
