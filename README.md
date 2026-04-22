# Smart Bookmark

> 书签清理 + 新标签页看板 + AI 搜索 + 对比搜索 + 悬浮球 + 二维码 + 备份，一站式 Chrome / Edge 浏览器扩展。  
> 致敬 [LazyCat Bookmark Cleaner](https://github.com/Alanrk/LazyCat-Bookmark-Cleaner) 和 [TabMark](https://github.com/Alanrk/TabMark-Bookmark-New-Tab)。

## ✨ 功能

### 🧹 书签清理中心
- 失效链接检测（可选，基于 HEAD/GET 探测）
- 重复书签检测（智能归一化 URL，忽略 utm_* / hash 等）
- 空文件夹检测
- 异常 URL 检测
- 扫描前预览、分组勾选、批量清理
- 书签画像（总数、Top 域名、近 30 天新增）

### 📑 新标签页看板
- 侧边栏文件夹列表，一键指定常用文件夹作为主页
- **🆕 拖拽排序** —— 在指定文件夹视图下按住卡片拖动，顺序会同步写回书签
- **🆕 卡片右键菜单** —— 复制链接 / 生成二维码
- 舒适 / 紧凑卡片密度
- 自定义壁纸（本地 URL 或远程链接）
- 暗黑模式（跟随系统 / 浅色 / 深色）
- 搜索：命中书签直接回车跳转，未命中自动跳搜索引擎

### 🔀 对比搜索（0.2 新增）
- 多搜索引擎并排呈现（Google / Bing / DuckDuckGo / 百度 / GitHub / Stack Overflow / YouTube / MDN 可多选）
- 支持 iframe 的引擎直接内嵌；禁 iframe 的引擎一键在新标签页打开
- "在全部引擎打开"一键分发到多 tab

### 💾 备份 / 导入导出（0.2 新增）
- 导出完整书签树为 **JSON**（Smart Bookmark 自有格式，可完整还原）
- 导出为 **Netscape HTML**（Chrome / Edge / Firefox / Safari 通吃）
- 从 JSON / Netscape HTML 导入到指定文件夹
- 导入仅新增，重复 URL 自动跳过，不会覆盖

### 🎈 网页内悬浮球（0.2 新增）
- 任意网页右下角悬浮按钮，可拖动调整位置（位置会持久化）
- 点击展开迷你面板：书签即时搜索、打开侧边栏、打开清理中心、复制当前 URL、生成二维码
- Shadow DOM 隔离样式，不会污染页面
- 一键关闭 / 设置页开关 / `Alt+Shift+F` 快捷键切换

### 🔳 二维码（0.2 新增）
- 卡片菜单、悬浮球、右键菜单均可生成二维码
- 支持浅色 / 深色自动适配
- 一键下载 PNG / 复制 URL

### 🌐 i18n（0.2 新增）
- 中文 / English 全 UI 覆盖，跟随系统自动切换
- 设置页手动切换，实时生效

### ✨ AI 助手
- 支持 OpenAI、Anthropic，API Key 只存本地
- 流式输出，支持停止

### 📌 侧边栏
- 任意网页按 **Alt+B** / **⌘+B** 打开
- 实时响应书签变更，搜索即时过滤

### 🖱️ 右键菜单 + 快捷键
- 选中文字 → 在 Smart Bookmark 中搜索
- 当前页面 → 复制 URL / 生成二维码
- 任意链接 → 复制链接 / 生成二维码
- 扩展图标右键 → 打开清理中心 / 侧边栏 / 切换悬浮球
- `Alt+Shift+C` → 一键打开清理中心
- `Alt+B` / `⌘+B` → 侧边栏
- `Alt+Shift+F` → 切换网页悬浮球

## 🛠️ 开发

```bash
npm install
npm run icons     # 从 icon.svg 生成四个 PNG
npm run dev       # Vite dev server（非扩展环境，仅用于 UI 调试）
npm run build     # 构建到 dist/（自动生成图标 + tsc + vite + postbuild）
npm run zip       # 构建并打包 dist.zip，可上传商店
```

### 直接安装（零构建，推荐）

仓库已附带最新的预构建产物 `dist/`，`git clone` 后**无需 npm install** 即可直接加载：

```bash
git clone https://github.com/xiaoniuge36/Smart-Bookmark.git
```

1. Chrome / Edge 打开 `chrome://extensions` 或 `edge://extensions`
2. 开启「开发者模式」→ 点击「加载已解压的扩展程序」→ 选择克隆后的 `dist/` 目录
3. 打开新标签页即可看到 Smart Bookmark

### 本地开发 / 自行构建

```bash
npm install
npm run build    # 重新生成 dist/
npm run zip      # 打包 dist.zip（上传商店用）
```

> 注：`dist/` 会随代码更新一并提交，Pull 最新后重新加载扩展即可生效。

### 目录结构

```
smart-bookmark/
├── manifest.json            # MV3 manifest
├── public/icons/            # 图标源（SVG）与导出后的 PNG
├── scripts/
│   ├── icons.mjs            # sharp 批量导出 PNG
│   ├── postbuild.mjs        # 把 manifest & icons 拷贝到 dist/，HTML 上移到根
│   └── zip.mjs              # 打包 dist.zip
├── src/
│   ├── background/          # Service Worker（上下文菜单、快捷键、消息代理）
│   ├── content/             # 网页内悬浮球（Shadow DOM）
│   ├── newtab/              # 新标签页（看板 / 清理 / 对比 / AI / 备份 / 设置）
│   ├── sidepanel/           # 侧边栏
│   ├── popup/               # 工具栏弹窗
│   ├── components/ui/       # shadcn/ui 组件 + toast
│   ├── lib/                 # bookmarks / cleaner / ai / storage / theme
│   │                        # backup / i18n / qr / utils
│   ├── types/               # 共享类型
│   └── styles/              # Tailwind globals
└── vite.config.ts
```

## 🗺️ Roadmap

已完成 ✅（0.2）
- [x] 拖拽排序 / 文件夹内自定义顺序
- [x] 生成二维码 / 复制 URL 上下文菜单（网页内）
- [x] 对比搜索（多搜索引擎并排对比）
- [x] 悬浮球
- [x] 备份 / 导出 JSON / HTML
- [x] 英文 i18n

下一步候选
- [ ] OAuth 版 Google Bookmarks / Pocket / Raindrop 同步
- [ ] 书签标签（Tag）与智能分组
- [ ] 基于 AI 的书签自动分类 / 去重建议
- [ ] 浏览器历史可视化时间线
- [ ] 书签导出为 Markdown
- [ ] PWA 版本 / Firefox 适配

## 🔐 隐私

- 书签数据 100% 本地处理
- AI API Key 仅保存在 `chrome.storage.local`
- 失效链接检测会向对应域名发起 HEAD/GET 请求，可在扫描时选择关闭
- 悬浮球只在你开启时才会注入；注入时不发任何请求，搜索走本地书签
- 完整隐私政策：[PRIVACY.md](./PRIVACY.md) · [在线版](https://xiaoniuge36.github.io/Smart-Bookmark/privacy.html)

## 🏪 商店上架

商店上架文案与权限说明见 [`STORE_LISTING.md`](./STORE_LISTING.md)。

## 📄 License

MIT
