import { allFolders, flatten, getTree } from "@/lib/bookmarks";

/**
 * 供 AI 调用的本机书签摘要。
 *
 * 注意：返回值会被 AiPanel 拼进 system prompt 一并发送给你自选的 AI Provider，
 * 即最多 60 条书签的标题与 URL、以及最多 24 个文件夹的路径与条数会离开本机。
 * 未启用 AI 助手（未填 API Key）时不会产生任何外发。详见 PRIVACY.md 第 4 节。
 */
export async function getBookmarkContextForAi(): Promise<string> {
  const tree = await getTree();
  const all = flatten(tree);
  const folders = allFolders(tree)
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);
  const folderLines = folders
    .map((f) => `  - ${f.path}：${f.count} 条`)
    .join("\n");
  const sample = all
    .slice(0, 60)
    .map((b) => `  - ${b.title} | ${b.url}`)
    .join("\n");
  return [
    `本机 Chrome 书签统计：共 ${all.length} 条书签。`,
    folders.length
      ? `按文件夹条数（节选）：\n${folderLines}`
      : "无文件夹级统计。",
    all.length
      ? `书签名与 URL 示例（最多 60 条，供回答「有哪些 / 查某类」时参考）：\n${sample}`
      : "当前没有可列出的书签。",
  ].join("\n");
}
