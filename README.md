# Gmail Notepad
Attach persistent notes to Gmail email threads.

## Description
Attach notes below the subject line in Gmail inbox and thread view. Notes are saved automatically as you type. A popup lets you browse, search and delete all saved notes.

## Installation
### Chrome Extension
Visit [Gmail Notepad](https://chromewebstore.google.com/detail/gmail-notepad/gknaddhjhnmjcoldbbjlkgdicejdnaem) to download Chrome Extension.

### Firefox Add-On
Visit [Gmail Notepad](https://addons.mozilla.org/en-US/firefox/addon/gmail-notepad/) to download Firefox Add-On.

### Chrome Browser
1. Navigate to `chrome://extensions/`
2. Enable `Developer Mode`
3. Click `Load unpacked`
4. Select the `GmailNotes` directory

### Firefox Browser
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on…`
3. Select `manifest.json` in the `GmailNotes` directory

## Usage
1. Go to [mail.google.com](https://mail.google.com)
2. Open any email thread — a yellow notepad appears below the subject line
3. Type your note; it saves automatically
4. Click the extension icon to browse all saved notes

### Browsing Notes
- Click any note in the popup to navigate to that thread
- Click `✕` to delete a note; click `Undo` within 5 seconds to restore it
- Use the search bar to filter notes by content

### Notes Storage
Notes are saved in the browser's local extension storage (`chrome.storage.local` / `browser.storage.local`) on your device. They are **not synced** to other devices or browsers. If you uninstall the extension or clear browser data, notes will be lost.

# Privacy Policy
Gmail Notepad does not collect, transmit or share any user data. All notes are stored locally in your browser using the browser's built-in storage API and never leave your device.

## Packaging
```bash
# Chrome
cp manifest-chrome.json manifest.json
zip -r gmail-notepad-chrome.zip manifest.json icons/ src/ styles/
```

```bash
# Firefox
cp manifest-firefox.json manifest.json
zip -r gmail-notepad-firefox.zip manifest.json icons/ src/ styles/
```

## Contributors
Jackie Ma