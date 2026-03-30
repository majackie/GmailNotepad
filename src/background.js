function updateActionState(tab) {
  const isGmail = tab?.url?.startsWith('https://mail.google.com/');
  (isGmail ? chrome.action.enable : chrome.action.disable)(tab.id);
}

chrome.action.disable();
chrome.tabs.query({ active: true }, tabs => tabs.forEach(updateActionState));
chrome.tabs.onActivated.addListener(({ tabId }) => chrome.tabs.get(tabId, updateActionState));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url !== undefined) updateActionState(tab);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'NAVIGATE_TO_THREAD') return;
  const { threadId } = message;

  chrome.tabs.query({ url: 'https://mail.google.com/mail/*' }, (tabs) => {
    if (tabs.length > 0) {
      const tab  = tabs[0];
      const base = tab.url.match(/https:\/\/mail\.google\.com\/mail\/u\/\d+/)?.[0]
        ?? 'https://mail.google.com/mail/u/0';
      chrome.tabs.sendMessage(tab.id, { type: 'OPEN_THREAD', threadId }, () => {
        void chrome.runtime.lastError;
        chrome.tabs.update(tab.id, { url: `${base}/#all/${threadId}`, active: true });
      });
    } else {
      chrome.tabs.create({ url: `https://mail.google.com/mail/u/0/#all/${threadId}` });
    }
  });
});
