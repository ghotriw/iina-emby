import { useCallback, useEffect, useState } from "react";
import type { EmbyItemMetadata, EmbyServer, EmbyView } from "@shared";
import { fetchLatestItems, fetchUserViews } from "../lib/emby-library-client";

export interface LibrarySectionData {
  view: EmbyView;
  items: EmbyItemMetadata[];
}

export function useLibrarySections(server: EmbyServer | null) {
  const [sections, setSections] = useState<LibrarySectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSections = useCallback(async () => {
    if (!server?.userId || !server.serverUrl) {
      setSections([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch all user library views (Movies, TV Shows, etc.)
      const views = await fetchUserViews(server);

      // Filter views suitable for video shelves
      const videoViews = views.filter(
        (v) =>
          !v.CollectionType ||
          ["movies", "tvshows", "homevideos", "boxsets"].includes(v.CollectionType),
      );

      // 2. Concurrently fetch latest items for each library
      const results = await Promise.all(
        videoViews.map(async (view) => {
          try {
            const items = await fetchLatestItems(server, view.Id, 16);
            return { view, items };
          } catch (err) {
            console.error(`Failed to fetch items for library "${view.Name}":`, err);
            return { view, items: [] };
          }
        }),
      );

      // Filter out libraries with no items
      setSections(results.filter((res) => res.items.length > 0));
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [server]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  return {
    sections,
    isLoading,
    error,
    reload: loadSections,
  };
}
