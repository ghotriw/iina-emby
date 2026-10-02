import type { EmbyItemMetadata, EmbyServer, EmbyView } from "@shared";
import { useCallback, useEffect, useState } from "react";
import { fetchLatestItems, fetchUserViews } from "../lib/emby-library-client";

export interface LibrarySectionData {
  view: EmbyView;
  items: EmbyItemMetadata[];
  isLoading?: boolean;
}

export function useLibrarySections(server: EmbyServer | null) {
  const [sections, setSections] = useState<LibrarySectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSections = useCallback(
    async (signal?: AbortSignal) => {
      if (!server?.userId || !server.serverUrl) {
        setSections([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch all user library views (Movies, TV Shows, etc.)
        const views = await fetchUserViews(server, signal);
        if (signal?.aborted) return;

        // Filter views suitable for video shelves
        const videoViews = views.filter(
          (v) => !v.CollectionType || ["movies", "tvshows", "homevideos", "boxsets"].includes(v.CollectionType),
        );

        // Progressive Phase 1:
        // If we don't have sections yet, immediately show placeholder shelves with real library titles
        setSections((prev) => {
          if (prev.length === 0) {
            return videoViews.map((view) => ({ view, items: [], isLoading: true }));
          }
          return prev;
        });

        // Progressive Phase 2:
        // Concurrently fetch latest items for each library and update each shelf as it resolves
        await Promise.all(
          videoViews.map(async (view) => {
            try {
              const items = await fetchLatestItems(server, view.Id, 16, signal);
              if (signal?.aborted) return;
              setSections((prev) => {
                if (items.length > 0) {
                  const existingIndex = prev.findIndex((s) => s.view.Id === view.Id);
                  if (existingIndex >= 0) {
                    const next = [...prev];
                    next[existingIndex] = { view, items, isLoading: false };
                    return next;
                  }
                  return [...prev, { view, items, isLoading: false }];
                }
                // If library has no items, remove its placeholder shelf
                return prev.filter((s) => s.view.Id !== view.Id);
              });
            } catch (err: unknown) {
              if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
                return;
              }
              console.error(`Failed to fetch items for library "${view.Name}":`, err);
              // On error, keep existing items if available, or remove placeholder
              setSections((prev) =>
                prev
                  .map((s) => (s.view.Id === view.Id ? { ...s, isLoading: false } : s))
                  .filter((s) => s.view.Id !== view.Id || s.items.length > 0),
              );
            }
          }),
        );

        if (signal?.aborted) return;

        // Clean up any stale libraries that no longer exist in videoViews
        const validViewIds = new Set(videoViews.map((v) => v.Id));
        setSections((prev) => prev.filter((s) => validViewIds.has(s.view.Id)));
      } catch (err: unknown) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [server],
  );

  useEffect(() => {
    const controller = new AbortController();
    setSections([]);
    loadSections(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadSections]);

  return {
    sections,
    isLoading,
    error,
    reload: loadSections,
  };
}
