import type { EmbyItemMetadata, EmbyServer } from "@shared";
import { useCallback, useEffect, useState } from "react";
import { fetchResumeItems } from "../lib/emby-library-client";

export function useContinueWatching(activeServer: EmbyServer | null) {
  const [items, setItems] = useState<EmbyItemMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadResumeItems = useCallback(
    async (signal?: AbortSignal) => {
      if (!activeServer?.serverUrl || !activeServer.accessToken || !activeServer.userId) {
        setItems([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchResumeItems(activeServer, 12, signal);
        if (signal?.aborted) return;
        setItems(result.items);
      } catch (err: unknown) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [activeServer],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadResumeItems(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadResumeItems]);

  return {
    items,
    loading,
    error,
    refresh: loadResumeItems,
  };
}
