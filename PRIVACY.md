# Smart Bookmark 隐私政策 / Privacy Policy

**生效日期 / Effective Date**: 2026-09-08  
**版本 / Version**: 0.2.0  
**开发者 / Developer**: xiaoniuge36  
**项目主页 / Project**: https://github.com/xiaoniuge36/Smart-Bookmark  
**联系邮箱 / Contact**: 通过 GitHub Issues 反馈 / Please file an issue on GitHub

> **2026-09-08 修订说明 / Revision note**：补充此前未如实披露的数据去向——站点图标（favicon）第三方服务、首页内嵌的 NewsNow iframe 与 GitHub 公开接口、以及 AI 对话会携带本机书签摘要；并补齐 `cookies`、`favicon` 两项权限说明。**开发者侧立场未变：零收集、零遥测、无后端。**

---

## 中文版

### 1. 总则

Smart Bookmark 是一个**本地优先**（local-first）的浏览器扩展：我们**不运营任何服务器**、**不收集任何用户数据**、**不做任何行为分析**，扩展内**没有任何遥测或统计上报**代码。

但「我们不收集」不等于「数据从不离开你的浏览器」。为了实现站点图标显示、首页资讯小组件与可选的 AI 问答，扩展会**直接从你的浏览器**向第三方服务发起网络请求（详见第 4 节）。这些请求不经过我们，我们也无从获取其内容。

### 2. 我们处理的数据

| 数据类别 | 用途 | 存储位置 | 是否上传 |
|---|---|---|---|
| 书签（bookmarks） | 展示、搜索、清理（失效/重复/空文件夹）、编辑、生成画像 | 浏览器本地书签数据库 | ⚠️ 默认不上传；两处例外见下方说明 |
| 浏览历史（history） | 在新标签页/侧边栏按关键词搜索历史 | 浏览器本地历史数据库 | ❌ 永不上传 |
| 常用站点（topSites） | 新标签页「快捷入口」区 | 浏览器提供，仅内存读取 | ❌ 永不上传 |
| 扩展设置（主题、壁纸、搜索引擎、密度、布局） | 个性化界面 | `chrome.storage.local`（仅本机） | ❌ 永不上传 |
| AI API Key（可选） | 访问你自行填入的 OpenAI / Anthropic / 自定义端点账户 | `chrome.storage.local`（仅本机） | ❌ 仅在调用时用于向该端点鉴权；我们不经手、不存储 |
| 对话消息（AI） | 流式显示回复 | 不落盘（刷新即清空） | ➡️ 仅在你主动点「发送」时发给你选择的 Provider，并附带书签摘要（见 4.3） |
| NewsNow 登录状态 | 判断你是否已登录内嵌的 NewsNow，以决定是否提示「需登录同步」 | 读取该站点 cookie，判定结果仅存本机 `localStorage` | ❌ 不上传（cookie 仅由浏览器在加载该 iframe 时按常规发送） |

**书签的两处例外**：

1. **显示站点图标时**：书签的**域名**会随图标请求发给第三方 favicon 服务（见 4.1）。不含完整 URL、书签标题或其他信息。
2. **你主动使用 AI 助手时**：最多 60 条书签的标题与 URL、以及最多 24 个文件夹的路径与条数，会作为上下文直连你自选的 AI Provider（见 4.3）。未启用 AI 助手则完全不会发生。

### 3. 权限使用说明

| 权限 | 用途 | 说明 |
|---|---|---|
| `bookmarks` | 读取 / 整理 / 编辑 / 删除书签 | 核心功能：清理、画像、搜索、增删改 |
| `storage` | 保存用户设置与 API Key | 仅 `chrome.storage.local` |
| `contextMenus` | 注册右键菜单 | 选中文字搜索书签、扩展图标右键操作 |
| `sidePanel`（Chrome / Edge） | 打开侧边栏 | `Alt+B` 显示书签面板；Firefox 侧使用 `sidebar_action` |
| `history` | 搜索历史记录 | 与书签统一搜索 |
| `topSites` | 读取常用网站 | 新标签页展示常用入口 |
| `tabs` | 打开新标签页 | 从 Popup / 右键菜单新开页面 |
| `favicon`（Chrome / Edge） | 读取浏览器**本地已缓存**的站点图标 | 在线图标加载失败时的兜底，纯本地读取，不联网 |
| `scripting` | 注入悬浮球 | 网页右上角的可选悬浮球（可在设置中关闭） |
| `cookies` | 检测 NewsNow 登录状态 | 仅读取 `newsnow.busiyi.world` 的 cookie 用于判断是否已登录；不上传、不用于其他用途 |
| `https://*/*` 主机权限 | 失效链接检测 + 悬浮球注入 + 图标加载 | 扫描时对目标网址发 `HEAD` 探测，不读取网页正文 |

### 4. 第三方服务

#### 4.1 站点图标（favicon）服务 —— 默认启用

为在书签卡片与搜索引擎图标上显示站点图标，扩展会**默认**按候选链依次向下列第三方发起图片请求。请求 URL 中仅包含**域名**：

- `https://favicon.so/{域名}`
- `https://ico.faviconkit.net/favicon/{域名}`
- `https://{域名}/favicon.ico`（站点自身）
- `https://www.google.com/s2/favicons?domain={域名}&sz=64`（仅当前面候选都失败时回退）

上述服务可能按各自隐私政策记录被请求的域名。若你不希望发起此类请求，可断开网络使用，或在浏览器层面限制扩展联网；此时图标会回退为浏览器本地 favicon 或站点首字母，其余功能不受影响。

#### 4.2 首页资讯小组件 —— 默认启用，可在设置中逐项关闭

- **NewsNow 实时热点**：首页以 `<iframe>` 内嵌 `https://newsnow.busiyi.world/`。该框架内的内容由第三方站点自行渲染，其数据收集行为受**该站点**隐私政策约束，与本扩展无关。iframe 已设置 `referrerPolicy="no-referrer"`（不发送来源页）与 `sandbox` 权限限制。
- **GitHub 热门**：向公开接口 `https://api.github.com/search/repositories` 请求热门仓库列表；查询参数仅为时间范围与编程语言，**不含任何用户数据或个人标识**。

#### 4.3 AI 助手 —— 需你主动启用

仅当你**主动选择 Provider 并填入自己的 API Key** 时，扩展才会**从你的浏览器直接**向对应端点发起请求：

- `https://api.openai.com/*`（选择 OpenAI）
- `https://api.anthropic.com/*`（选择 Anthropic）
- 你在设置中自行填写的 OpenAI 兼容端点（选择自定义 Provider）

每次请求的内容包括：

1. 你输入的对话文本；
2. 作为 system prompt 上下文的**本机书签摘要**——书签总数、最多 24 个文件夹的路径与条数、最多 60 条书签的标题与 URL。

**不启用 AI 助手（未填 API Key）则不会产生任何此类请求，书签数据也不会离开本机。**

请参考对应服务商的隐私政策：

- OpenAI: https://openai.com/policies/privacy-policy
- Anthropic: https://www.anthropic.com/legal/privacy

#### 4.4 失效链接检测 —— 需你主动触发

在「书签清理」中执行失效链接扫描时，扩展会向你书签里记录的**目标网址本身**发起 `HEAD` 探测以判断链接是否可达；不读取网页正文，也不经由任何中间服务转发。

### 5. 数据保留与删除

- 本地数据：卸载扩展 → 所有 `chrome.storage.local` 数据随扩展一并清除
- 书签本身由浏览器管理，不受扩展控制
- 你可以随时在「设置」页清空 API Key
- 第三方服务（4.1 / 4.2）可能按其自身政策留存请求日志，我们无法代为删除；如需行使相关权利请直接联系对应服务方

### 6. 儿童隐私

本扩展不针对 13 岁以下儿童设计，开发者亦不主动收集任何个人数据。

### 7. 政策变更

若政策变更，会通过新版本 `README.md` 和本文件的 commit 历史公开；**不会降低对已有用户的保护**。

### 8. 联系方式

隐私相关问题请在 https://github.com/xiaoniuge36/Smart-Bookmark/issues 提 issue。

---

## English

### 1. Overview

Smart Bookmark is a **local-first** browser extension. **No servers are operated by us. No user data is collected. No analytics, no telemetry** — there is no tracking code in the extension.

That said, "we don't collect" is not the same as "data never leaves your browser". To render site icons, power the home-page widgets, and enable the optional AI assistant, the extension makes network requests **directly from your browser** to third-party services (see Section 4). Those requests never pass through us and we have no access to their contents.

### 2. Data We Process

| Category | Purpose | Storage | Uploaded? |
|---|---|---|---|
| Bookmarks | Display, search, clean (invalid/duplicate/empty), edit, profile stats | Browser's local bookmark store | ⚠️ Not by default; two exceptions below |
| History | Search browsing history alongside bookmarks | Browser's local history store | ❌ Never |
| Top sites | Show quick links on new tab | In-memory only | ❌ Never |
| Settings (theme, wallpaper, engine, density, layout) | UI personalization | `chrome.storage.local` (this machine) | ❌ Never |
| AI API Key (optional) | Access your own OpenAI / Anthropic / custom endpoint account | `chrome.storage.local` (this machine) | ❌ Used only to authenticate to that endpoint; never handled or stored by us |
| AI chat messages | Streamed display | Not persisted (cleared on refresh) | ➡️ Only sent to your selected provider when you press Send, together with a bookmark summary (see 4.3) |
| NewsNow login state | Decide whether to show a "login required to sync" hint for the embedded NewsNow feed | Reads that site's cookie; the verdict is kept in local `localStorage` only | ❌ Not uploaded (cookies are sent by the browser as usual when that iframe loads) |

**The two bookmark exceptions:**

1. **When rendering site icons**: the bookmark's **domain** is sent to a third-party favicon service (see 4.1). No full URL, no bookmark title, nothing else.
2. **When you actively use the AI assistant**: up to 60 bookmark titles + URLs, plus up to 24 folder paths with their counts, are sent as context directly to the AI provider you chose (see 4.3). This never happens if you don't enable the AI assistant.

### 3. Permissions Justification

| Permission | Purpose | Notes |
|---|---|---|
| `bookmarks` | Read / organize / edit / delete bookmarks | Core functionality |
| `storage` | Persist user settings and API key | `chrome.storage.local` only |
| `contextMenus` | Register right-click actions | e.g. "Search bookmarks for selection" |
| `sidePanel` (Chrome / Edge) | Open the side panel | `Alt+B` / `Cmd+B`; Firefox uses `sidebar_action` |
| `history` | Search history records | Unified search with bookmarks |
| `topSites` | Show most-visited sites | Quick-launch on new tab |
| `tabs` | Open new tabs | From popup / context menu |
| `favicon` (Chrome / Edge) | Read the browser's **locally cached** site icons | Fallback when online icon loading fails; purely local, no network |
| `scripting` | Inject the floating widget | Optional hover ball on pages (toggle in Settings) |
| `cookies` | Detect NewsNow login state | Reads cookies for `newsnow.busiyi.world` only, to tell whether you are signed in; not uploaded, not used for anything else |
| `https://*/*` host access | Link-liveness check + widget injection + icon loading | `HEAD` probes to the target URLs only; does NOT read page contents |

### 4. Third-Party Services

#### 4.1 Favicon services — enabled by default

To display site icons on bookmark cards and search-engine entries, the extension walks a candidate chain **by default**. Only the **domain** appears in these request URLs:

- `https://favicon.so/{domain}`
- `https://ico.faviconkit.net/favicon/{domain}`
- `https://{domain}/favicon.ico` (the site itself)
- `https://www.google.com/s2/favicons?domain={domain}&sz=64` (fallback only, after the above all fail)

These services may log requested domains under their own privacy policies. If you'd rather not make these requests, use the extension offline or restrict its network access at the browser level; icons then fall back to the browser's local favicon or the site's initial letter, and everything else keeps working.

#### 4.2 Home-page widgets — enabled by default, individually toggleable in Settings

- **NewsNow live feed**: the dashboard embeds `https://newsnow.busiyi.world/` in an `<iframe>`. Content inside that frame is rendered by the third-party site and governed by **that site's** privacy policy, not ours. The iframe sets `referrerPolicy="no-referrer"` (no referring page is sent) and is restricted by a `sandbox` attribute.
- **GitHub Trending**: queries the public endpoint `https://api.github.com/search/repositories`. The only query parameters are a time range and a programming language — **no user data or personal identifiers**.

#### 4.3 AI assistant — requires your explicit opt-in

Only when you **choose a provider and enter your own API key** does the extension send requests **directly from your browser** to:

- `https://api.openai.com/*` (if you choose OpenAI)
- `https://api.anthropic.com/*` (if you choose Anthropic)
- Any OpenAI-compatible endpoint you enter yourself in Settings (custom provider)

Each request contains:

1. The chat text you typed;
2. A **local bookmark summary** used as system-prompt context — total bookmark count, up to 24 folder paths with their counts, and up to 60 bookmark titles + URLs.

**If you don't enable the AI assistant (no API key), no such request is ever made and your bookmark data never leaves this machine.**

Refer to each provider's privacy policy:

- OpenAI: https://openai.com/policies/privacy-policy
- Anthropic: https://www.anthropic.com/legal/privacy

#### 4.4 Link-liveness check — requires your explicit action

When you run an invalid-link scan in the Bookmark Cleaner, the extension sends `HEAD` probes to **the target URLs recorded in your own bookmarks** to see whether they still resolve. Page bodies are not read, and nothing is relayed through any intermediary service.

### 5. Data Retention & Deletion

- Local data: uninstalling the extension wipes all `chrome.storage.local` data.
- Bookmarks are managed by the browser itself.
- You can clear your API key at any time in Settings.
- Third-party services (4.1 / 4.2) may retain request logs under their own policies; we cannot delete those on your behalf. To exercise such rights, contact the respective provider directly.

### 6. Children's Privacy

Not designed for children under 13. No personal data is intentionally collected by the developer.

### 7. Changes

Policy updates will be committed to this file publicly. Protections already granted will not be reduced.

### 8. Contact

File an issue at https://github.com/xiaoniuge36/Smart-Bookmark/issues

---

> 本政策采用 MIT-0 许可，你可以自由复用、修改，用于你自己的项目。  
> This policy is dedicated to the public domain under MIT-0. Reuse and modify freely.
