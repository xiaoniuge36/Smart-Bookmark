# Smart Bookmark 隐私政策 / Privacy Policy

**生效日期 / Effective Date**: 2025-01-15  
**版本 / Version**: 0.2.0  
**开发者 / Developer**: xiaoniuge36  
**项目主页 / Project**: https://github.com/xiaoniuge36/Smart-Bookmark  
**联系邮箱 / Contact**: 通过 GitHub Issues 反馈 / Please file an issue on GitHub

---

## 中文版

### 1. 总则
Smart Bookmark 是一个**本地优先**（local-first）的浏览器扩展，我们**不运营任何服务器**，**不收集任何用户数据**，**不分析用户行为**。本政策解释扩展所使用的权限与数据去向。

### 2. 我们处理的数据

| 数据类别 | 用途 | 存储位置 | 是否上传 |
|---|---|---|---|
| 书签（bookmarks） | 展示、搜索、清理（失效/重复/空文件夹）、生成画像 | 浏览器本地书签数据库 | ❌ 永不上传 |
| 浏览历史（history） | 在新标签页/侧边栏按关键词搜索历史 | 浏览器本地历史数据库 | ❌ 永不上传 |
| 常用站点（topSites） | 新标签页"快捷入口"区 | 浏览器提供，仅内存读取 | ❌ 永不上传 |
| 扩展设置（主题、壁纸、搜索引擎、密度） | 个性化界面 | `chrome.storage.local`（仅本机） | ❌ 永不上传 |
| AI API Key（可选） | 访问你自行填入的 OpenAI / Anthropic 账户 | `chrome.storage.local`（仅本机） | ❌ 仅在你主动发起 AI 对话时由浏览器直连对应 API，Smart Bookmark 后台服务器不经手 |
| 对话消息（AI） | 流式显示回复 | 不落盘（刷新即清空） | ➡️ 仅在你主动点「发送」时发给你选择的 AI Provider |

### 3. 权限使用说明 

| 权限 | 用途 | 说明 |
|---|---|---|
| `bookmarks` | 读取/整理/删除书签 | 核心功能：清理、画像、搜索 |
| `storage` | 保存用户设置与 API Key | 仅 `chrome.storage.local` |
| `contextMenus` | 注册右键菜单 | 选中文字搜索书签、扩展图标右键操作 |
| `sidePanel` | 打开侧边栏 | `Alt+B` 快捷键显示书签面板 |
| `history` | 搜索历史记录 | 与书签统一搜索 |
| `topSites` | 读取常用网站 | 新标签页展示常用入口 |
| `tabs` | 打开新标签页 | 从 Popup / 右键菜单新开页面 |
| `scripting` | 注入悬浮球 | 在网页右上角显示可选悬浮球（可在设置中关闭） |
| `https://*/*` 主机权限 | 失效链接检测 + 悬浮球注入 | 扫描时 HEAD 探测链接状态；不读取网页内容 |

### 4. 第三方服务

**默认为零**。仅在你**主动启用 AI 助手**并填入 API Key 时，扩展会**从你的浏览器直接**向下列端点发起请求：
- `https://api.openai.com/*`（若你选择 OpenAI）
- `https://api.anthropic.com/*`（若你选择 Anthropic）

请求内容为你输入的对话文本，不包含书签数据或个人身份信息，除非你在对话中主动提及。请参考对应服务商的隐私政策：
- OpenAI: https://openai.com/policies/privacy-policy
- Anthropic: https://www.anthropic.com/legal/privacy

### 5. 数据保留与删除
- 本地数据：卸载扩展 → 所有 `chrome.storage.local` 数据随扩展一并清除
- 书签本身由浏览器管理，不受扩展控制
- 你可以随时在「设置」页清空 API Key

### 6. 儿童隐私
本扩展不针对 13 岁以下儿童设计，亦不会主动收集任何个人数据。

### 7. 政策变更
若政策变更，会通过新版本 `README.md` 和本文件的 commit 历史公开；**不会降低对已有用户的保护**。

### 8. 联系方式
隐私相关问题请在 https://github.com/xiaoniuge36/Smart-Bookmark/issues 提 issue。

---

## English

### 1. Overview
Smart Bookmark is a **local-first** browser extension. **No servers are operated by us. No user data is collected. No analytics or telemetry.** This policy explains what permissions the extension uses and where data goes.

### 2. Data We Process

| Category | Purpose | Storage | Uploaded? |
|---|---|---|---|
| Bookmarks | Display, search, clean (invalid/duplicate/empty), profile stats | Browser's local bookmark store | ❌ Never |
| History | Search browsing history alongside bookmarks | Browser's local history store | ❌ Never |
| Top sites | Show quick links on new tab | In-memory only | ❌ Never |
| Settings (theme, wallpaper, engine, density) | UI personalization | `chrome.storage.local` (this machine) | ❌ Never |
| AI API Key (optional) | Access your own OpenAI / Anthropic account | `chrome.storage.local` (this machine) | ❌ Only sent to the chosen AI vendor when you initiate a chat, direct from your browser |
| AI chat messages | Streamed display | Not persisted (cleared on refresh) | ➡️ Only sent to your selected AI provider when you press Send |

### 3. Permissions Justification

| Permission | Purpose | Notes |
|---|---|---|
| `bookmarks` | Read / organize / delete bookmarks | Core functionality |
| `storage` | Persist user settings and API key | `chrome.storage.local` only |
| `contextMenus` | Register right-click actions | e.g., "Search bookmarks for selection" |
| `sidePanel` | Open the side panel | `Alt+B` / `Cmd+B` |
| `history` | Search history records | Unified search with bookmarks |
| `topSites` | Show most-visited sites | Quick-launch on new tab |
| `tabs` | Open new tabs | From popup / context menu |
| `scripting` | Inject the floating widget | Optional hover ball on pages (toggle in Settings) |
| `https://*/*` host access | Link-liveness check + widget injection | `HEAD` probes only; does NOT read page contents |

### 4. Third-Party Services
**None by default.** Only when you **opt in** to the AI assistant and provide an API key, the extension sends requests **directly from your browser** to:
- `https://api.openai.com/*` (if you choose OpenAI)
- `https://api.anthropic.com/*` (if you choose Anthropic)

Payload is the chat text you type — it does NOT include bookmark data or personal identifiers unless you paste them yourself. Refer to each provider's privacy policy:
- OpenAI: https://openai.com/policies/privacy-policy
- Anthropic: https://www.anthropic.com/legal/privacy

### 5. Data Retention & Deletion
- Local data: uninstalling the extension wipes all `chrome.storage.local` data.
- Bookmarks are managed by the browser itself.
- You can clear your API key at any time in Settings.

### 6. Children's Privacy
Not designed for children under 13. No personal data is intentionally collected.

### 7. Changes
Policy updates will be committed to this file publicly. Protections already granted will not be reduced.

### 8. Contact
File an issue at https://github.com/xiaoniuge36/Smart-Bookmark/issues

---

> 本政策采用 MIT-0 许可，你可以自由复用、修改，用于你自己的项目。  
> This policy is dedicated to the public domain under MIT-0. Reuse and modify freely.
