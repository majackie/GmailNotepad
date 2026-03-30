'use strict';

const searchInput = document.getElementById('search-input');
const notesList   = document.getElementById('notes-list');
const undoBtn     = document.getElementById('undo-btn');

let allNotes  = {};
let undoStack = [];
let undoTimer = null;

const MIN_ROWS = 10;

function openThread(threadId) {
  chrome.runtime.sendMessage({ type: 'NAVIGATE_TO_THREAD', threadId });
  window.close();
}

async function broadcastDelete(threadId) {
  const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/mail/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'NOTE_DELETED', threadId }).catch(() => {});
  }
}

async function broadcastRestore(threadId, text) {
  const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/mail/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'NOTE_RESTORED', threadId, text }).catch(() => {});
  }
}

function previewText(text) {
  return (text || '').replace(/\n/g, ' ↵ ');
}

function buildNoteCard(threadId, text) {
  const card = document.createElement('div');
  card.className        = 'note-card';
  card.dataset.threadId = threadId;

  const delBtn       = document.createElement('button');
  delBtn.className   = 'btn-delete';
  delBtn.textContent = '✕';
  delBtn.title       = 'Delete this note';
  delBtn.addEventListener('click', async e => {
    e.stopPropagation();
    undoStack.push({ threadId, text: allNotes[threadId] });
    await GmailNotesStorage.deleteNote(threadId);
    await broadcastDelete(threadId);
    delete allNotes[threadId];
    card.remove();
    fillEmptyRows();
    activateUndo();
  });

  const noteEl       = document.createElement('div');
  noteEl.className   = 'note-text';
  noteEl.textContent = previewText(text);

  card.append(delBtn, noteEl);
  card.addEventListener('click', () => openThread(threadId));
  return card;
}

function fillEmptyRows() {
  notesList.querySelectorAll('.empty-row').forEach(r => r.remove());
  const cardCount = notesList.querySelectorAll('.note-card').length;
  const count     = Math.max(MIN_ROWS - cardCount, 0);
  const frag      = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'empty-row';
    frag.appendChild(row);
  }
  notesList.appendChild(frag);
}

function renderNotes(notes) {
  notesList.querySelectorAll('.note-card, .empty-row').forEach(c => c.remove());
  const entries = Object.entries(notes);
  entries.sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0));
  const frag = document.createDocumentFragment();
  entries.forEach(([id, text]) => frag.appendChild(buildNoteCard(id, text)));
  notesList.appendChild(frag);
  fillEmptyRows();
}

function applySearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) { renderNotes(allNotes); return; }
  renderNotes(Object.fromEntries(
    Object.entries(allNotes).filter(([id, text]) =>
      text.toLowerCase().includes(q) || id.toLowerCase().includes(q)
    )
  ));
}

function activateUndo() {
  undoBtn.disabled = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    undoStack = [];
    undoBtn.disabled = true;
  }, 5000);
}

undoBtn.addEventListener('click', async () => {
  if (!undoStack.length) return;
  clearTimeout(undoTimer);
  while (undoStack.length) {
    const { threadId, text } = undoStack.pop();
    await GmailNotesStorage.saveNote(threadId, text);
    allNotes[threadId] = text;
    await broadcastRestore(threadId, text);
  }
  undoBtn.disabled = true;
  applySearch(searchInput.value);
});

searchInput.addEventListener('input', () => applySearch(searchInput.value));

GmailNotesStorage.getAllNotes().then(notes => {
  allNotes = notes;
  applySearch(searchInput.value);
});
