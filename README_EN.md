# Smart Bookmark

> [中文](./README.md) · **English**

> Bookmark cleaner + new tab dashboard + AI search + multi-engine compare search + floating ball + QR code + backup, an all-in-one Chrome / Edge browser extension.
> Inspired by [LazyCat Bookmark Cleaner](https://github.com/Alanrk/LazyCat-Bookmark-Cleaner) and [TabMark](https://github.com/Alanrk/TabMark-Bookmark-New-Tab).

## ✨ Features

### 🧹 Bookmark Cleaner Center
- Dead link detection (optional, based on HEAD/GET probing)
- Duplicate bookmark detection (smart URL normalization, ignores utm_* / hash, etc.)
- Empty folder detection
- Broken URL detection
- Preview before scan, group-level selection, batch cleanup
- Bookmark profile (total count, top domains, recently added in 30 days)

### 📑 New Tab Dashboard
- Sidebar folder list, set any folder as your home view with one click
- **🆕 Home widgets on demand** — Three home widgets (GitHub Trending / Signal Radar / Frequent Sites) all support hover-to-hide, and can be restored at any time from the "Settings → Home Widgets" card grid
- **🆕 Drag-and-drop reorder** — In any folder view, hold and drag a card to reorder; the order is written back to bookmarks
- **🆕 Card context menu** — Copy link / Generate QR code
- Comfy / compact card density
- Custom wallpaper (local URL or remote link)
- Dark mode (follow system / light / dark)
- Search: hit a bookmark → press Enter to jump; no hit → fallback to your default search engine

### 🔀 Compare Search (added in 0.2)
- Multi-engine side-by-side view (Google / Bing / DuckDuckGo / Baidu / GitHub / Stack Overflow / YouTube / MDN — pick any subset)
- iframe-compatible engines are embedded directly; iframe-blocked engines open in a new tab with one click
- "Open in all engines" dispatches to multiple tabs at once

### 💾 Backup / Import & Export (added in 0.2)
- Export the full bookmark tree as **JSON** (Smart Bookmark native format, fully restorable)
- Export as **Netscape HTML** (Chrome / Edge / Firefox / Safari all support it)
- Import from JSON / Netscape HTML into a specified folder
- Import is append-only: duplicate URLs are auto-skipped and nothing is overwritten

### 🎈 In-Page Floating Ball (added in 0.2)
- A draggable floating button at the bottom-right of any web page (its position is persisted)
- Click to expand a mini panel: instant bookmark search, open side panel, open cleaner, copy current URL, generate QR code
- Shadow DOM isolated styles — never pollutes the host page
- One-click close / toggleable in Settings / shortcut `Alt+Shift+F`

### 🔳 QR Code (added in 0.2)
- Generate QR codes from card menus, the floating ball, or right-click menu
- Auto-adapts to light / dark theme
- One-click download PNG / copy URL

### 🌐 i18n (added in 0.2)
- Full UI coverage in 中文 / English, automatically follows your system language
- Manual switcher in Settings, applies in real time
- Quick language switcher in the dashboard / side panel header

### ✨ AI Assistant
- Supports OpenAI and Anthropic, API key stays local only
- Streaming output with stop control

### � AI Channel Board (🆕)

> Built for "I saved a bunch of AI service bookmarks but have no idea which ones still work" — scan selected bookmark folders to surface every AI channel, then manage status, risk, price, and custom groups all in one place.

- **Auto-scan**: Detect AI service URLs from selected bookmark folders; record status (Pending / Active / Watching / Dead / Blocked), risk (Low / Med / High), and price tag (S/A/B/C)
- **Custom groups**: Create as many groups as you like with 6 preset colors or any custom HEX value
- **Keyword auto-classify**: Attach keywords to a group and one-click auto-assign all bookmarks by title/URL match
- **Batch create groups**: Paste a multi-line block to create many groups at once — format `group name: kw1, kw2`
- **Batch assign**: Select multiple channels, then move them all to a group in one action
- **Drag-to-reorder**: Rearrange the group list with drag-and-drop
- **Group filter tabs**: Switch between All / Ungrouped / any custom group with one click
- **Import / Export**: Export channel data (including groups) as JSON; auto-sync across devices via Chrome Sync

### �📌 Side Panel
- Open from any web page via **Alt+B** / **⌘+B**
- Reacts to bookmark changes in real time, instant search filter

### 🖱️ Context Menus + Shortcuts
- Selected text → "Search in Smart Bookmark"
- Current page → Copy URL / Generate QR code
- Any link → Copy link / Generate QR code
- Right-click on the extension icon → Open Cleaner / Side Panel / Toggle floating ball
- `Alt+Shift+C` → Open the cleaner directly
- `Alt+B` / `⌘+B` → Side panel
- `Alt+Shift+F` → Toggle the in-page floating ball

## 🛠️ Development

```bash
npm install
npm run icons     # Generate the four PNG icons from icon.svg
npm run dev       # Vite dev server (no extension runtime; UI debugging only)
npm run build     # Build into dist/ (icons + tsc + vite + postbuild)
npm run zip       # Build and pack dist.zip (for store upload)
```

### Install directly (zero-build, recommended)

The repo ships with the latest prebuilt `dist/`. After `git clone`, you can load the extension **without running npm install**:

```bash
git clone https://github.com/xiaoniuge36/Smart-Bookmark.git
```

1. Open `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode" → click "Load unpacked" → select the cloned `dist/` directory
3. Open a new tab and Smart Bookmark is ready

### Local development / Build it yourself

```bash
npm install
npm run build    # Regenerates dist/
npm run zip      # Pack dist.zip (for store upload)
```

> Note: `dist/` is committed alongside source updates — after pulling the latest changes, just reload the extension and you'll be on the new version.

### Directory Structure

```
smart-bookmark/
├── manifest.json            # MV3 manifest
├── public/icons/            # Icon source (SVG) + exported PNGs
├── scripts/
│   ├── icons.mjs            # Batch-export PNGs via sharp
│   ├── postbuild.mjs        # Copy manifest & icons into dist/, hoist HTML to root
│   └── zip.mjs              # Pack dist.zip
├── src/
│   ├── background/          # Service Worker (context menus, shortcuts, message proxy)
│   ├── content/             # In-page floating ball (Shadow DOM)
│   ├── newtab/              # New tab page (Dashboard / Cleaner / Compare / AI / Backup / Settings)
│   ├── sidepanel/           # Side panel
│   ├── popup/               # Toolbar popup
│   ├── components/ui/       # shadcn/ui components + toast
│   ├── lib/                 # bookmarks / cleaner / ai / storage / theme
│   │                        # backup / i18n / qr / utils
│   ├── types/               # Shared types
│   └── styles/              # Tailwind globals
└── vite.config.ts
```

## 🗺️ Roadmap

Done ✅ (0.2)
- [x] Drag-and-drop reorder / custom order inside folders
- [x] QR code / copy-URL context menus (in-page)
- [x] Compare search (multi-engine side-by-side)
- [x] Floating ball
- [x] Backup / export JSON / HTML
- [x] English i18n

Done ✅ (latest)
- [x] AI Channel Board: auto-scan + status / risk / price-tag management
- [x] Channel custom groups (color + keywords + drag-to-reorder)
- [x] One-click keyword auto-classify + batch group create + batch group assign
- [x] Channel data import / export (JSON) + Chrome Sync cross-device sync

Next candidates
- [ ] OAuth-based Google Bookmarks / Pocket / Raindrop sync
- [ ] Universal bookmark tags & cross-folder smart search
- [ ] AI-driven auto-categorization / dedup suggestions
- [ ] Browser history timeline visualization
- [ ] Export bookmarks as Markdown
- [ ] PWA version / Firefox adaptation

## 🔐 Privacy

- Bookmark data is 100% processed locally
- AI API keys live only in `chrome.storage.local`
- Dead-link detection issues HEAD/GET requests to the target domains — you can disable it during a scan
- The floating ball is only injected when you enable it; no requests are made on injection, and search runs against local bookmarks
- Full privacy policy: [PRIVACY.md](./PRIVACY.md) · [Online version](https://xiaoniuge36.github.io/Smart-Bookmark/privacy.html)

## 🏪 Store Listing

Store copy and permission notes live in [`STORE_LISTING.md`](./STORE_LISTING.md).

## 🙏 Acknowledgements

Big thanks to the sincere, friendly, united, and professional LinuxDo community — I learned a lot about AI there.

<p>
  <a href="https://linux.do">
    <img src="https://img.shields.io/badge/LinuxDo-community-1f6feb" alt="LinuxDo">
  </a>
</p>

- [LinuxDo](https://linux.do) Learn AI, hop onto L!

## 📄 License

MIT
