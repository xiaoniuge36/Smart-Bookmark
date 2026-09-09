import { useEffect, useMemo, useState } from "react";
import type { EngineDef } from "@/lib/engines";
import { faviconCandidates } from "@/lib/engines";
import { cn } from "@/lib/utils";
import { cachedCandidateIndex, loadCandidate } from "@/lib/faviconLoader";

export default function EngineIcon({
  engine,
  className,
}: {
  engine: EngineDef;
  className?: string;
}) {
  const candidates = useMemo(
    () => faviconCandidates(engine),
    [engine.id, engine.host],
  );
  const [loadedUrl, setLoadedUrl] = useState<string | null>(() => {
    const cachedIndex = cachedCandidateIndex(candidates);
    return cachedIndex >= 0 ? candidates[cachedIndex] : null;
  });

  useEffect(() => {
    let cancelled = false;
    const cachedIndex = cachedCandidateIndex(candidates);
    setLoadedUrl(cachedIndex >= 0 ? candidates[cachedIndex] : null);

    if (cachedIndex >= 0) return () => {
      cancelled = true;
    };

    const findCandidate = async () => {
      for (let next = 0; next < candidates.length; next += 1) {
        if (await loadCandidate(candidates[next]) && !cancelled) {
          setLoadedUrl(candidates[next]);
          return;
        }
        if (cancelled) return;
      }
      // 所有在线候选都失败，保持 loadedUrl 为 null，回退到首字母占位
    };
    void findCandidate();
    return () => {
      cancelled = true;
    };
  }, [candidates]);

  const fallback = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded bg-muted text-[0.65em] font-semibold text-muted-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {(engine.name.trim()[0] || "?").toUpperCase()}
    </span>
  );

  return loadedUrl ? (
    <img src={loadedUrl} alt="" className={cn("rounded", className)} />
  ) : (
    fallback
  );
}
