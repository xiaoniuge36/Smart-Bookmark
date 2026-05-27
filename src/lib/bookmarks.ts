import type { BookmarkNode, FlatBookmark, FolderStat } from "@/types";

const hasChromeBookmarks =
  typeof chrome !== "undefined" && !!chrome.bookmarks;

export async function getTree(): Promise<BookmarkNode[]> {
  if (!hasChromeBookmarks) return mockTree();
  return await chrome.bookmarks.getTree();
}

export async function getChildren(id: string): Promise<BookmarkNode[]> {
  if (!hasChromeBookmarks) return [];
  return await chrome.bookmarks.getChildren(id);
}

export async function removeBookmark(id: string): Promise<void> {
  if (!hasChromeBookmarks) return;
  await chrome.bookmarks.remove(id);
}

export async function removeTree(id: string): Promise<void> {
  if (!hasChromeBookmarks) return;
  await chrome.bookmarks.removeTree(id);
}

export async function moveBookmark(id: string, parentId: string, index?: number) {
  if (!hasChromeBookmarks) return;
  await chrome.bookmarks.move(id, { parentId, index });
}

export async function createFolder(parentId: string, title: string): Promise<BookmarkNode | null> {
  if (!hasChromeBookmarks) return null;
  return (await chrome.bookmarks.create({ parentId, title })) as BookmarkNode;
}

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string },
): Promise<void> {
  if (!hasChromeBookmarks) return;
  await chrome.bookmarks.update(id, changes);
}

export function flatten(nodes: BookmarkNode[], pathPrefix = ""): FlatBookmark[] {
  const out: FlatBookmark[] = [];
  const walk = (node: BookmarkNode, path: string) => {
    const here = node.title ? (path ? `${path} / ${node.title}` : node.title) : path;
    if (node.url) {
      out.push({
        id: node.id,
        parentId: node.parentId,
        title: node.title || node.url,
        url: node.url,
        path: path || "Bookmarks",
        dateAdded: node.dateAdded,
      });
    }
    for (const c of node.children ?? []) walk(c, here);
  };
  for (const n of nodes) walk(n, pathPrefix);
  return out;
}

export function allFolders(nodes: BookmarkNode[]): FolderStat[] {
  const out: FolderStat[] = [];
  const walk = (node: BookmarkNode, path: string) => {
    const here = node.title ? (path ? `${path} / ${node.title}` : node.title) : path;
    if (!node.url && node.id !== "0") {
      const count = countBookmarks(node);
      out.push({ id: node.id, title: node.title || "(root)", path: here, count });
    }
    for (const c of node.children ?? []) walk(c, here);
  };
  for (const n of nodes) walk(n, "");
  return out;
}

export function countBookmarks(node: BookmarkNode): number {
  if (node.url) return 1;
  return (node.children ?? []).reduce((s, c) => s + countBookmarks(c), 0);
}

export function findFolder(nodes: BookmarkNode[], id: string): BookmarkNode | undefined {
  for (const n of nodes) {
    if (n.id === id && !n.url) return n;
    const found = n.children && findFolder(n.children, id);
    if (found) return found;
  }
  return undefined;
}

function mockTree(): BookmarkNode[] {
  return [
    {
      id: "0",
      title: "",
      children: [
        {
          id: "1",
          parentId: "0",
          title: "Bookmarks bar",
          children: [
            { id: "10", parentId: "1", title: "GitHub", url: "https://github.com/" },
            { id: "11", parentId: "1", title: "Google", url: "https://www.google.com/" },
          ],
        },
      ],
    },
  ];
}
