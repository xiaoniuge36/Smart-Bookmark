import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

async function copy(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await copy(s, d);
  }
}

async function moveHtmlToRoot(pageName) {
  const from = path.join(dist, "src", pageName, "index.html");
  const to = path.join(dist, `${pageName}.html`);
  try {
    let html = await fs.readFile(from, "utf8");
    html = html.replace(/(src|href)="\.\.\/\.\.\//g, '$1="./');
    await fs.writeFile(to, html);
    await fs.rm(path.join(dist, "src", pageName), { recursive: true, force: true });
  } catch (err) {
    console.warn(`[postbuild] skip ${pageName}: ${err.message}`);
  }
}

async function main() {
  await copy(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));

  const iconsSrc = path.join(root, "public", "icons");
  try {
    await copyDir(iconsSrc, path.join(dist, "icons"));
  } catch {
    console.warn("[postbuild] no icons folder, skipping");
  }

  const localesSrc = path.join(root, "public", "_locales");
  try {
    await copyDir(localesSrc, path.join(dist, "_locales"));
  } catch {
    console.warn("[postbuild] no _locales folder, skipping");
  }

  const channelSyncSrc = path.join(root, "channel-sync");
  try {
    await copyDir(channelSyncSrc, path.join(dist, "channel-sync"));
  } catch {
    console.warn("[postbuild] no channel-sync folder, skipping");
  }

  for (const page of ["newtab", "sidepanel", "popup"]) {
    await moveHtmlToRoot(page);
  }

  try {
    await fs.rm(path.join(dist, "src"), { recursive: true, force: true });
  } catch {}

  console.log("[postbuild] dist ready at:", dist);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
