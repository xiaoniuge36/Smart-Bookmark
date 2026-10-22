import { validateIconImage } from "@/lib/iconValidation";

const LOAD_TIMEOUT_MS = 2000;

// 按 URL 缓存探测结果与进行中的请求：BookmarkIcon 与 EngineIcon 共享同一份缓存，
// 同一图标 URL 只探测一次。
const candidateResults = new Map<string, boolean>();
const candidateLoads = new Map<string, Promise<boolean>>();

/** 探测单个候选图标 URL 能否加载且为有效图案；结果与进行中请求均按 URL 去重缓存。 */
export function loadCandidate(url: string): Promise<boolean> {
  const cached = candidateResults.get(url);
  if (cached !== undefined) return Promise.resolve(cached);

  const existing = candidateLoads.get(url);
  if (existing) return existing;

  const promise = new Promise<boolean>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (valid: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      candidateResults.set(url, valid);
      candidateLoads.delete(url);
      resolve(valid);
    };
    const timer = window.setTimeout(() => finish(false), LOAD_TIMEOUT_MS);
    image.onload = () => finish(validateIconImage(image));
    image.onerror = () => finish(false);
    image.src = url;
  });
  candidateLoads.set(url, promise);
  return promise;
}

/** 候选列表中首个「已缓存为有效」的下标，无则 -1；用于同步命中缓存、避免首帧闪烁。 */
export function cachedCandidateIndex(candidates: string[]): number {
  return candidates.findIndex((url) => candidateResults.get(url) === true);
}
