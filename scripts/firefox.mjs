import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const out = path.join(root, "dist-firefox");

// Firefox 附加组件标识与最低版本（MV3 稳定版为 109，取 115 ESR 作为稳妥下限）
const GECKO_ID = "smart-bookmark@xiaoniuge36.dev";
const GECKO_MIN = "115.0";

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

/**
 * 从主（Chrome）manifest 派生 Firefox 版：
 * - background.service_worker -> background.scripts（事件页）
 * - side_panel -> sidebar_action
 * - 增加 browser_specific_settings.gecko（id / strict_min_version / data_collection_permissions）
 * - 移除 minimum_chrome_version、optional_host_permissions
 *   及 Firefox 不支持的权限（favicon / sidePanel）
 */
function toFirefoxManifest(m) {
  const fx = JSON.parse(JSON.stringify(m));

  fx.background = { scripts: ["background.js"] };

  delete fx.side_panel;
  fx.sidebar_action = {
    default_panel: "sidepanel.html",
    default_title: m.short_name || m.name || "Smart Bookmark",
    default_icon: { "16": "icons/icon-16.png", "32": "icons/icon-32.png" },
    open_at_install: false,
  };

  fx.browser_specific_settings = {
    gecko: {
      id: GECKO_ID,
      strict_min_version: GECKO_MIN,
      // AMO 自 2025-11-03 起要求所有新扩展申报数据收集类别，缺失会直接判定验证失败。
      // 本扩展无遥测、无开发者后端、不收集任何用户数据，故声明 none；
      // 书签摘要仅在你主动发起 AI 对话时由浏览器直连你自选的 Provider
      //（详见 PRIVACY.md 第 4 节）。
      data_collection_permissions: { required: ["none"] },
    },
  };
  delete fx.minimum_chrome_version;
  // optional_host_permissions 需 Firefox 128+，与 strict_min_version 115 冲突（AMO 会告警）；
  // 且代码中并无 permissions.request/contains/remove 调用，属死配置——
  // 直接移除即可消除告警，同时保留 Firefox 115 ESR 支持。
  delete fx.optional_host_permissions;

  fx.permissions = (fx.permissions || []).filter(
    (p) => !["favicon", "sidePanel"].includes(p),
  );

  if (typeof fx.description === "string") {
    fx.description = fx.description
      .replace(/Chrome\s*\/\s*Edge/i, "Chrome / Edge / Firefox")
      .replace(/双平台/g, "多平台");
  }

  return fx;
}

async function main() {
  const stat = await fs.stat(dist).catch(() => null);
  if (!stat) {
    console.error("[firefox] dist 不存在，请先运行 npm run build");
    process.exit(1);
  }
  await fs.rm(out, { recursive: true, force: true });
  await copyDir(dist, out);
  const m = JSON.parse(
    await fs.readFile(path.join(root, "manifest.json"), "utf8"),
  );
  await fs.writeFile(
    path.join(out, "manifest.json"),
    JSON.stringify(toFirefoxManifest(m), null, 2) + "\n",
  );
  console.log("[firefox] dist-firefox 就绪:", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
