/**
 * 浏览器差异适配层。
 *
 * Firefox 原生提供 `browser.*` 命名空间，且 UA 含 "Firefox"；据此在运行时
 * 分支处理 Chrome 专有能力（sidePanel、_favicon 等），使同一份打包产物可
 * 同时用于 Chrome/Edge 与 Firefox。
 */
export const isFirefox: boolean =
  typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);

/**
 * 跨浏览器打开侧边栏：
 * - Chrome/Edge：`chrome.sidePanel.open({ windowId })`
 * - Firefox：`browser.sidebarAction.open()`（Firefox 127+ 支持；旧版静默降级）
 *
 * 无对应能力时静默失败，不抛异常。
 */
export async function openSidebar(windowId?: number): Promise<void> {
  try {
    if (!isFirefox) {
      const sp = (chrome as unknown as {
        sidePanel?: { open?: (o: { windowId?: number }) => Promise<void> };
      })?.sidePanel;
      if (sp?.open) await sp.open(windowId != null ? { windowId } : {});
      return;
    }
    const b = (globalThis as unknown as {
      browser?: { sidebarAction?: { open?: () => Promise<void> } };
    })?.browser;
    if (b?.sidebarAction?.open) await b.sidebarAction.open();
  } catch {
    // 无侧边栏能力时静默降级
  }
}
