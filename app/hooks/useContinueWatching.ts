import { useCallback, useEffect, useState } from "react";
import type { EmbyItemMetadata, EmbyServer } from "@shared";
import { fetchResumeItems } from "../lib/emby-library-client";

export function useContinueWatching(activeServer: EmbyServer | null) {
  const [items, setItems] = useState<EmbyItemMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadResumeItems = useCallback(async () => {
    if (!activeServer || !activeServer.serverUrl || !activeServer.accessToken || !activeServer.userId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchResumeItems(activeServer);
      setItems(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeServer]);

  useEffect(() => {
    loadResumeItems();
  }, [loadResumeItems]);

  return {
    items,
    loading,
    error,
    refresh: loadResumeItems,
  };
}
