# channel-sync

> 此文件夹为个人数据备份目录，用于在多台设备之间同步插件工作台数据。

## 用途

- `ai-channels.json`：插件工作台的备份文件，通过 Git 提交实现跨设备同步。

## 使用方式

1. 在插件工作台「管理」面板中点击 **保存项目同步文件**，覆盖本目录中的 `ai-channels.json`。
2. 提交并推送到远程仓库。
3. 其他设备拉取后重新构建（`pnpm build`），或手动将文件复制到 `dist/channel-sync/`。
4. 重新加载插件，点击 **从项目同步文件更新** 即可同步数据。

> `scripts/postbuild.mjs` 会在每次构建时自动将本文件夹复制到 `dist/channel-sync/`。
