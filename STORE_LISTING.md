# 扩展商店上架素材

> 本文件是上架 **Chrome Web Store**、**Microsoft Edge Add-ons** 与 **Firefox Add-ons (AMO)** 的文案与权限说明模板，直接复制粘贴到各自后台。  
> 每次发版前请更新 `version` 字段并同步截图。

---

## 基本信息

| 字段 | 内容 |
|---|---|
| **Extension name (EN)** | Smart Bookmark - Cleaner & New Tab |
| **扩展名称（中文）** | Smart Bookmark - 书签清理 + 新标签页 |
| **Short name** | SmartBookmark |
| **Version** | 0.2.0 |
| **Category / 类别** | Productivity / 生产力工具 |
| **Language / 语言** | Chinese (Simplified) + English |
| **浏览器支持** | Chrome / Edge（MV3）· Firefox（`build:firefox` 派生，MV3，`strict_min_version` 115） |
| **Homepage** | https://github.com/xiaoniuge36/Smart-Bookmark |
| **Support URL** | https://github.com/xiaoniuge36/Smart-Bookmark/issues |
| **Privacy Policy URL** | https://xiaoniuge36.github.io/Smart-Bookmark/privacy.html |
| **License** | MIT |

---

## 简短描述（Short description）

> Chrome ≤ 132 字符 · Edge ≤ 132 字符

**中文（121 字符）**
```
书签清理 + 新标签页看板 + AI 搜索，三合一浏览器扩展。一键检测失效、重复、空文件夹；自定义新标签页；侧边栏与悬浮球随手可用。
```

**English (132 chars)**
```
Smart bookmarks: clean invalids & duplicates, new-tab dashboard, AI search, side panel & floating widget. Local-first.
```

---

## 详细描述（Detailed description）

### 中文版

```markdown
Smart Bookmark 是一款把「书签清理器」和「书签型新标签页」合二为一的浏览器扩展，致敬 LazyCat Bookmark Cleaner 与 TabMark。本地优先：不运营服务器、无遥测；书签默认不上传（仅两处例外：显示站点图标时域名会发往第三方 favicon 服务、你主动发起 AI 对话时携带书签摘要，详见隐私政策）。

🧹 书签清理中心
• 一键扫描失效链接（可选开启，基于 HEAD 探测）
• 智能检测重复书签（自动忽略 utm_、hash 等噪声参数）
• 找出空文件夹与异常 URL
• 扫描前预览，按类别分组勾选，安全放心
• 生成书签画像：总数、Top 域名、近 30 天新增

📑 新标签页书签看板
• 文件夹侧栏，一键指定常用文件夹作为主页；文件夹可拖动排序
• favicon 卡片、舒适/紧凑密度、上下/左右内部布局
• 卡片与文件夹右键菜单：编辑、删除、重命名（删除二次确认）
• 展示范围切换（仅当前文件夹 / 包含子文件夹）
• 在线 favicon 多级回退 + 图标有效性检测，失败回退本地图标或首字母
• 自定义壁纸 + 暗黑模式（跟随系统 / 浅色 / 深色）
• 搜索命中书签直接跳转，未命中自动走搜索引擎

✨ AI 智能助手
• 支持 OpenAI / Anthropic，API Key 仅保存在本地
• 流式输出，支持随时打断
• 可基于你的书签上下文提问

📡 AI 渠道看板
• 从书签文件夹扫出 AI 服务，统一管理状态 / 风险 / 价格标签
• 自定义分组（颜色 + 关键词自动归组）、拖拽排序、批量操作
• 渠道数据导入 / 导出，Chrome Sync 跨设备同步

🔍 对比搜索
• 多个搜索引擎并排对比同一关键词
• Cmd/Ctrl+Enter 一键全开

📌 侧边栏 + 悬浮球
• Alt+B / ⌘+B 任意网页唤出书签侧边栏
• 网页右上角可选悬浮球，快速访问常用书签
• 实时响应书签变更

📤 备份与导出
• 一键导出 JSON / HTML 备份
• 清理前自动保存快照

🔳 二维码
• 当前页 / 任意书签生成二维码，下载 PNG（分辨率按复杂度自适应）或 SVG（矢量）

🌐 中英双语
• 全 UI 中英文，跟随系统或手动一键切换

🔒 隐私优先
• 本地优先：不运营服务器、不收集数据、无遥测、不分析用户行为
• 书签默认不上传；两处例外：① 显示站点图标时域名发往第三方 favicon 服务（可断网或在浏览器层限制联网以关闭）② 你主动发起的 AI 对话携带书签摘要直连你自选的 Provider
• 代码完全开源（MIT）

👉 快捷键
• Alt+B / ⌘+B：打开侧边栏
• Alt+Shift+C：打开清理中心
• Alt+Shift+F：切换悬浮球
```

### English

```markdown
Smart Bookmark combines a bookmark cleaner with a bookmark-powered new-tab dashboard. Inspired by LazyCat Bookmark Cleaner and TabMark. Local-first — no servers, no telemetry; bookmarks stay on your device (two narrow exceptions: favicon lookups and AI chats you initiate — see the privacy policy).

🧹 Cleaner
• Scan for invalid links (opt-in, HEAD probes)
• Smart duplicate detection (normalizes utm_, hash, trailing slash)
• Find empty folders and malformed URLs
• Preview before cleaning, grouped check-boxes
• Bookmark profile: totals, top domains, recent activity

📑 New Tab Dashboard
• Folder sidebar, pin any folder as your home; drag to reorder folders
• Favicon cards, comfy / compact density, vertical / horizontal inner layout
• Card & folder context menus: edit, delete, rename (delete asks for confirmation)
• Display-scope toggle (current folder only / include subfolders)
• Online favicon with multi-level fallback + validity detection; falls back to local icon or initial
• Custom wallpaper + dark mode (system / light / dark)
• Search hits jump instantly; misses fall back to your search engine

✨ AI Assistant
• OpenAI / Anthropic, API key stored locally only
• Streaming output, interruptible
• Ask questions grounded in your bookmarks

📡 AI Channel Board
• Scan bookmark folders to surface AI services; manage status / risk / price tags
• Custom groups (colors + keyword auto-classify), drag-to-reorder, batch actions
• Import / export channel data; cross-device sync via Chrome Sync

🔍 Compare Search
• Query multiple engines side-by-side
• Cmd/Ctrl+Enter to open all

📌 Side Panel + Floating Widget
• Alt+B / ⌘+B from any page
• Optional floating ball for one-click access
• Live-updates as bookmarks change

📤 Backup & Export
• Export JSON / HTML with one click
• Auto-snapshot before cleaning

🔳 QR Code
• Generate a QR for the current page / any bookmark; download PNG (resolution adapts to complexity) or SVG (vector)

🌐 Bilingual
• Full 中文 / English UI, follows your system or switches manually

🔒 Privacy First
• Local-first: no servers, no analytics, no telemetry
• Bookmarks are not uploaded by default; two narrow exceptions: (1) rendering site icons sends the domain to a third-party favicon service (disable by going offline), (2) AI chats you initiate include a bookmark summary sent to your chosen provider
• Fully open source (MIT)

👉 Shortcuts
• Alt+B / ⌘+B: open side panel
• Alt+Shift+C: open cleaner
• Alt+Shift+F: toggle floating ball
```

---

## 权限说明（Permissions Justifications）

> 各家商店都会要求你逐条解释；直接贴下面的文字到对应输入框。

### 单个权限说明

| Permission | 中文说明 | English |
|---|---|---|
| `bookmarks` | 读取、整理与编辑用户书签，为清理、画像、搜索、增删改等核心功能提供数据。 | Read, organize, and edit user bookmarks for core features: clean, profile, search, and edit/delete. |
| `storage` | 将用户界面偏好（主题、壁纸、搜索引擎、密度、布局）以及用户自行填入的 AI API Key 保存在 `chrome.storage.local`。仅本机，不上传。 | Persist UI preferences (theme, wallpaper, engine, density, layout) and the user-provided AI API key in `chrome.storage.local`. Local-only, never uploaded. |
| `contextMenus` | 注册右键菜单："在 Smart Bookmark 中搜索选中文字"、扩展图标上的清理/侧边栏入口。 | Register right-click actions like "Search bookmarks for selection" and quick access to cleaner / side panel from the action icon. |
| `sidePanel` | 通过快捷键 Alt+B / ⌘+B 打开 Smart Bookmark 侧边栏，方便在任意网页快速访问书签。（Firefox 用 `sidebar_action`） | Open the Smart Bookmark side panel via Alt+B / ⌘+B from any page for instant bookmark access. (Firefox uses `sidebar_action`.) |
| `history` | 在新标签页和侧边栏中，对浏览历史与书签进行统一的关键词搜索。 | Provide unified keyword search across bookmarks and browsing history in new tab / side panel. |
| `topSites` | 在新标签页展示"常用站点"快捷入口，数据来自浏览器本地，仅内存读取。 | Display a "Most Visited" shortcut row on the new tab, read in-memory from the browser's local list. |
| `tabs` | 当用户从弹窗或右键菜单触发动作时，打开新标签页（例如打开清理中心、AI 面板）。 | Open new tabs when the user triggers actions from the popup or context menu (e.g., open the cleaner or AI panel). |
| `favicon` | 读取浏览器**本地已缓存**的站点图标，作为在线图标加载失败时的兜底；纯本地读取，不联网。（Chrome / Edge） | Read the browser's **locally cached** site icons as a fallback when online icon loading fails; purely local, no network. (Chrome / Edge) |
| `scripting` | 当用户启用"网页悬浮球"功能时，注入一个可交互的悬浮 UI 到页面右上角。可在设置中随时关闭。 | Inject the optional floating widget to the top-right of pages when the user enables it in Settings. Toggleable. |
| `cookies` | 仅读取 `newsnow.busiyi.world` 的 cookie，用于判断首页内嵌的 NewsNow 资讯是否已登录；不上传、不用于其他用途。 | Read cookies for `newsnow.busiyi.world` only, to tell whether the embedded NewsNow feed is signed in; not uploaded, not used for anything else. |
| Host: `https://*/*` | 用途 1：失效链接扫描时向书签对应域名发起 `HEAD` 请求检测可达性（不读取页面内容）。用途 2：悬浮球注入。用途 3：在线加载站点图标——按候选链向第三方 favicon 服务发图片请求，URL 中仅含**域名**。 | (1) HEAD probes against bookmarked domains during link-liveness scan (does NOT read page contents). (2) Floating widget injection. (3) Online site-icon loading — image requests to third-party favicon services; the request URL contains only the **domain**. |
| Host: `http://localhost/*`, `http://127.0.0.1/*` | 支持本地开发环境的书签（localhost / 127.0.0.1）参与扫描。 | Include localhost / 127.0.0.1 bookmarks in scans (for developers). |
| `chrome_url_overrides.newtab` | 替换默认新标签页，显示书签看板。 | Replace the default new tab with the bookmark dashboard. |

### 单独问答题：Why does this extension need "broad host access"?

**EN:**
> The extension performs link-liveness checks against the user's own bookmarks (which may be on any domain) using HEAD requests. It injects an optional on-page floating widget for quick access to bookmarks and selection-to-bookmark-search. It also fetches site icons (favicons) for bookmarks and search engines via a candidate chain of third-party services — those request URLs contain only the domain. No page contents are read or exfiltrated, and no data is sent to any server we operate (we operate none).

**中文:**
> 扩展需要对用户自己收藏的书签做可达性检测（书签可能在任何域名上），通过 HEAD 请求实现；悬浮球功能需要向网页注入一段可交互 UI（可在设置中关闭）；此外会按候选链向第三方 favicon 服务请求站点图标，请求 URL 中仅含**域名**。扩展**不读取**网页内容，也不把数据发回任何我们运营的服务器——我们没有服务器。

### 单独问答题：Remote Code Usage

**EN / 中文:**
> **No remote code.** All JavaScript is bundled at build time; no dynamic `import()` of external URLs, no `eval` on network payloads. AI chat is a plain `fetch` POST with JSON — data only, not executable code.

### 单独问答题：Data Usage Disclosure（Chrome 隐私标签必填）

Chrome 后台会让你勾选 "What user data does this extension handle?"，按此勾选：

| 分类 | 是否勾选 | 理由 |
|---|---|---|
| Personally identifiable information | ❌ 否 | 不收集 |
| Health information | ❌ 否 | - |
| Financial and payment information | ❌ 否 | - |
| Authentication information | ❌ 否 | API Key 仅存本地、不上传 |
| Personal communications | ❌ 否 | - |
| Location | ❌ 否 | - |
| Web history | ✅ 是 | 用 `history` 权限做本地统一搜索 |
| User activity | ❌ 否 | - |
| Website content | ❌ 否 | 扩展不读取页面内容 |

三条下方的声明全部勾选：
- ✅ I do not sell or transfer user data to third parties
- ✅ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

> ⚠️ **据实复核**：显示站点图标时，书签**域名**会发往第三方 favicon 服务（favicon.so / faviconkit / 站点自身 / Google s2），首页小组件会内嵌 NewsNow iframe 并请求 GitHub 公开接口（详见 PRIVACY.md 第 4 节）。若商店审核认为上述构成"向第三方传输用户数据"，请据实调整第一条声明；本扩展不读取网页正文、不收集 PII、不运营任何后端。

**Single purpose statement（必填）：**
> EN: Smart Bookmark helps users organize, visualize, search, and clean their browser bookmarks from a unified new-tab dashboard and side panel.  
> 中文：Smart Bookmark 帮助用户在统一的新标签页看板和侧边栏中，整理、可视化、搜索与清理浏览器书签。

---

## Certification Notes（Edge 必填 / Chrome 可选）

贴到 Edge 后台的 "Notes for the certification team"：

```text
Thanks for reviewing Smart Bookmark!

## How to test
1. After install, open a new tab — you will see the bookmark dashboard.
2. Click "Cleaner" tab → "Start scan" (leave "detect invalid links" off for a quick pass). The cleaner will find duplicate bookmarks, empty folders, etc. No bookmarks are removed until you press "Clean selected".
3. Press Alt+B (Cmd+B on Mac) anywhere to open the side panel.
4. AI Assistant tab: disabled by default. To test, go to Settings → AI → choose a Provider and paste your own API key (we cannot provide one).

## Privacy & data
- No servers operated by us. No telemetry.
- Settings and API key stay in `chrome.storage.local`.
- Site icons are fetched from third-party favicon services (request URL contains only the domain); this can be disabled by going offline.
- AI requests (if enabled) go directly from the user's browser to api.openai.com / api.anthropic.com.
- Full privacy policy: https://xiaoniuge36.github.io/Smart-Bookmark/privacy.html

## Open source
https://github.com/xiaoniuge36/Smart-Bookmark (MIT license)
```

---

## Firefox / AMO 上架备注

- **构建**：`npm run build:firefox` 从主 manifest 派生 Firefox 版到 `dist-firefox/`（`background.service_worker` → `background.scripts` 事件页、`side_panel` → `sidebar_action`、移除 Chrome 专有的 `favicon` / `sidePanel` 权限与 `minimum_chrome_version`）；`npm run zip:firefox` 打包为可上传 AMO 的 zip（manifest 位于压缩包根部）。
- **`browser_specific_settings.gecko`**：`id` = `smart-bookmark@xiaoniuge36.dev`，`strict_min_version` = `115.0`（ESR 下限）。
- **data_collection_permissions（必填）**：AMO 自 2025-11-03 起要求新扩展申报数据收集类别，缺失会判定验证失败。本扩展无遥测、无开发者后端、零收集，派生 manifest 已注入 `data_collection_permissions: { required: ["none"] }`。
- **optional_host_permissions**：已从 Firefox 版移除（需 Firefox 128+，与 `strict_min_version` 115 冲突会产生告警；代码中亦无 `permissions.request/contains/remove` 调用）。
- **运行时差异**：`_favicon` 在 Firefox 不可用，图标回退到在线候选链；打开侧边栏在 Firefox 走 `browser.sidebarAction.open()`（127+，旧版静默降级）。

---

## 截图素材需求

| # | 文件名 | 尺寸 | 内容建议 |
|---|---|---|---|
| 1 | `screenshot-dashboard.png` | 1280×800 | 新标签页看板，壁纸 + 暗黑模式 + 搜索框 |
| 2 | `screenshot-cleaner.png` | 1280×800 | 清理中心，展示画像 + 三类问题分组 |
| 3 | `screenshot-ai.png` | 1280×800 | AI 对话气泡 + 设置入口 |
| 4 | `screenshot-sidepanel.png` | 1280×800 | 侧边栏在真实网页旁边的效果 |
| 5 | `screenshot-compare.png` | 1280×800 | 对比搜索多引擎并排 |

Chrome 最多 5 张，Edge 最多 10 张，AMO 最多 10 张，**同一套素材三边通用**。

### 图标素材
- `public/icons/icon-128.png` ← Chrome 商店"宣传图"用这张
- Edge 允许额外上传 `Marquee promo tile`（1400×560）可选

---

## 提交 Checklist

发布前复核：

- [ ] `manifest.json.version` 已递增
- [ ] `npm run build && npm run zip` 产出 `dist.zip`（Chrome / Edge）
- [ ] `npm run build:firefox && npm run zip:firefox` 产出 `dist-firefox.zip`（AMO）
- [ ] 加载解压 `dist/`（Firefox 用 `dist-firefox/`）本地实测通过
- [ ] 所有 `console.error` / `console.warn` 清理（或确认合理）
- [ ] 截图已准备
- [ ] Privacy Policy URL 可访问（GitHub Pages 已发布）
- [ ] Support URL 可访问
- [ ] 中英文描述、短描述、类目都就位
- [ ] 权限逐条 justification 粘贴完毕（含 `favicon` / `cookies`）
- [ ] Chrome 隐私标签已勾选（并复核 favicon 第三方传输声明）
- [ ] Edge 审核备注已填
- [ ] AMO：`data_collection_permissions` 已申报、gecko id / strict_min_version 正确
