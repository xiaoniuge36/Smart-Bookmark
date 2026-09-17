# Smart Bookmark

> **中文** · [English](./README_EN.md)

> 书签清理 + 新标签页看板 + AI 搜索 + 对比搜索 + 悬浮球 + 二维码 + 备份，一站式 Chrome / Edge / Firefox 浏览器扩展。  
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
- **🆕 首页组件按需显隐** —— GitHub 热门 / 信息差雷达 / 常去 三个首页组件均支持鼠标悬停后一键「隐藏」，在「设置 → 首页组件」卡片网格里可随时恢复
- **🆕 拖拽排序** —— 书签卡片与左侧文件夹均可拖动排序，顺序同步写回书签
- **🆕 展示范围切换** —— 「仅当前文件夹 / 包含子文件夹」分段单选，随时切换
- **🆕 卡片右键 / 三点菜单** —— 复制链接 / 生成二维码 / 编辑（改名称、链接）/ 删除（二次确认）
- **🆕 文件夹右键菜单** —— 重命名 / 删除（二次确认，并提示内含书签数量）
- **🆕 卡片内部布局** —— 上下 / 左右（favicon 在左、标题链接在右）两种布局，设置页可切换
- **🆕 在线 favicon** —— 书签与搜索引擎图标走多级回退候选链在线加载，含图标有效性检测（过滤全透明 / 纯色假图标），失败回退浏览器本地 favicon 或首字母
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
- 统一黑码白底（标准、利于扫码 / 打印 / 分享），不随深色模式反色
- 下载 PNG（分辨率按二维码复杂度自适应：每模块 8px 基准，边长夹在 256–1024px）或 SVG（矢量、无损缩放），并可一键复制 URL

### 🌐 i18n（0.2 新增）
- 中文 / English 全 UI 覆盖，跟随系统自动切换
- 设置页手动切换，实时生效
- 看板 / 侧边栏顶部新增一键语言切换器（🌐 图标），无需进设置页

### ✨ AI 助手
- 支持 OpenAI、Anthropic，API Key 只存本地
- 流式输出，支持停止

### � AI 渠道看板（🆕）

> 专为「收藏了一堆 AI 服务书签却不知道哪个还能用」而生——从指定书签文件夹中扫出所有 AI 渠道，统一管理状态、风险、价格与自定义分组。

- **自动扫描**：从选定书签文件夹识别 AI 服务网址，记录状态（待验证 / 可用 / 观察中 / 失效 / 屏蔽）、风险（低 / 中 / 高）与价格标签（S/A/B/C）
- **自定义分组**：创建任意数量分组，支持 6 种预设颜色 + 自定义 HEX 色值
- **关键词自动分组**：为每个分组设置匹配关键词，一键将所有书签按标题/URL 关键词自动归组
- **批量新建分组**：多行文本一次创建多组，格式 `分组名: 关键词1, 关键词2`
- **批量指定分组**：多选渠道后一键批量划入目标分组
- **拖拽调整顺序**：分组列表支持拖拽排序
- **分组标签页**：顶部标签一键切换（全部 / 未分组 / 各自定义分组）
- **导入 / 导出**：渠道数据（含分组信息）可导出为 JSON；通过 Chrome Sync 跨设备自动同步

### �📌 侧边栏
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
npm run icons         # 从 icon.svg 生成四个 PNG
npm run dev           # Vite dev server（非扩展环境，仅用于 UI 调试）
npm run typecheck     # tsc -b --noEmit 类型检查
npm run build         # 构建到 dist/（自动生成图标 + tsc + vite + postbuild）
npm run zip           # 构建并打包 dist.zip，可上传 Chrome / Edge 商店
npm run build:firefox # 从 dist/ 派生 Firefox 版到 dist-firefox/（改写 manifest）
npm run zip:firefox   # 构建 Firefox 版并打包为可上传 AMO 的 zip
```

### 直接安装（零构建，推荐）

仓库已附带最新的预构建产物 `dist/`，`git clone` 后**无需 npm install** 即可直接加载：

```bash
git clone https://github.com/xiaoniuge36/Smart-Bookmark.git
```

> ⚠️ 必须选择项目里的 `dist/` 文件夹，不要选择仓库根目录。  
> 例如应选择 `Smart-Bookmark/dist/`，而不是 `Smart-Bookmark/`。如果选错根目录，浏览器可能会报 `Side panel file path must exist`。

#### Chrome 本地导入

1. 打开 Chrome，地址栏输入 `chrome://extensions`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 在文件选择窗口中进入克隆后的项目目录，选择里面的 `dist/` 文件夹
5. 打开新标签页，即可看到 Smart Bookmark

#### Edge 本地导入

1. 打开 Edge，地址栏输入 `edge://extensions`
2. 左侧或右侧开启「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 在文件选择窗口中进入克隆后的项目目录，选择里面的 `dist/` 文件夹
5. 打开新标签页，即可看到 Smart Bookmark

#### Firefox 本地导入

> Firefox 产物 `dist-firefox/` 不随仓库提交，需自行构建：`npm install && npm run build:firefox`。

1. 地址栏输入 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件…」(Load Temporary Add-on)
3. 选择 `dist-firefox/manifest.json`
4. 打开新标签页，即可看到 Smart Bookmark

> 临时加载在浏览器重启后失效；永久安装需经 AMO 签名（`npm run zip:firefox` 产出可上传的 zip）。

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
│   ├── firefox.mjs          # 从主 manifest 派生 Firefox 版到 dist-firefox/
│   └── zip.mjs              # 打包 dist.zip / dist-firefox.zip
├── src/
│   ├── background/          # Service Worker（上下文菜单、快捷键、消息代理）
│   ├── content/             # 网页内悬浮球（Shadow DOM）
│   ├── newtab/              # 新标签页（看板 / 清理 / 对比 / AI / 备份 / 设置）
│   ├── sidepanel/           # 侧边栏
│   ├── popup/               # 工具栏弹窗
│   ├── components/ui/       # shadcn/ui 组件 + toast
│   ├── lib/                 # bookmarks / cleaner / ai / storage / theme / backup
│   │                        # i18n / qr / engines / browser / faviconLoader / iconValidation / utils
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

已完成 ✅（新版）
- [x] AI 渠道看板：自动扫描 + 状态 / 风险 / 价格标签管理
- [x] 渠道自定义分组（颜色 + 关键词 + 拖拽排序）
- [x] 关键词一键自动分组 + 批量新建分组 + 批量指定分组
- [x] 渠道数据导入 / 导出（JSON）+ Chrome Sync 跨设备同步

已完成 ✅（增强）
- [x] Firefox 适配（独立构建目标 `dist-firefox` + 运行时浏览器分支）
- [x] 书签 / 文件夹的编辑、删除、重命名（右键 / 三点菜单，删除二次确认）
- [x] 卡片上下 / 左右内部布局；展示范围切换（仅当前 / 含子文件夹）；文件夹拖动排序
- [x] 在线 favicon 多级回退 + 图标有效性检测（书签与搜索引擎图标）
- [x] 二维码下载 PNG（分辨率按复杂度自适应）/ SVG（矢量）

下一步候选
- [ ] OAuth 版 Google Bookmarks / Pocket / Raindrop 同步
- [ ] 通用书签 Tag 与跨文件夹智能搜索
- [ ] 基于 AI 的书签自动分类 / 去重建议
- [ ] 浏览器历史可视化时间线
- [ ] 书签导出为 Markdown
- [ ] PWA 版本

## 🔐 隐私

- **本地优先**：不运营服务器、无遥测、无行为分析；书签 / 历史 / 设置均存于本机
- 书签默认不上传，两处例外：① 显示站点图标时书签**域名**会发给第三方 favicon 服务（favicon.so / faviconkit / 站点自身 / Google s2；可断网或在浏览器层限制联网以关闭，图标回退本地 favicon 或首字母）；② 主动使用 AI 助手时，最多 60 条书签标题+URL 作为上下文直连你自选的 Provider
- AI API Key 仅保存在 `chrome.storage.local`
- 失效链接检测向对应域名发起 HEAD 请求（可在扫描时关闭）；首页资讯小组件（NewsNow iframe / GitHub 公开接口）默认启用、可在设置中逐项关闭
- 悬浮球只在你开启时才注入；注入时不发请求，搜索走本地书签
- 完整隐私政策：[PRIVACY.md](./PRIVACY.md) · [在线版](https://xiaoniuge36.github.io/Smart-Bookmark/privacy.html)

## 🏪 商店上架

商店上架文案与权限说明见 [`STORE_LISTING.md`](./STORE_LISTING.md)。

## 🙏 致谢

感谢真诚、友善、团结、专业的 Linuxdo 社区，让我学到那么多有关ai相关知识。

<p>
  <a href="https://linux.do">
    <img src="https://img.shields.io/badge/LinuxDo-community-1f6feb" alt="LinuxDo">
  </a>
</p>

- [LinuxDo](https://linux.do) 学 ai, 上 L 站!

## 📄 License

MIT
