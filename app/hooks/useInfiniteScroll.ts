import { useCallback, useEffect, useRef, useState } from "react";
import { useIntersectionSentinel } from "./useIntersectionSentinel";

export interface PaginatedResult<T> {
  items: T[];
  totalRecordCount: number;
}

export interface UseInfiniteScrollOptions<T> {
  fetcher: (startIndex: number, limit: number, signal?: AbortSignal, bypassCache?: boolean) => Promise<PaginatedResult<T>>;
  pageSize: number;
  enabled?: boolean;
  dependencies?: unknown[];
  getItemId?: (item: T) => string | number;
  rootMargin?: string;
}

export interface UseInfiniteScrollResult<T> {
  items: T[];
  totalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  refresh: (bypassCache?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useInfiniteScroll<T>({
  fetcher,
  pageSize,
  enabled = true,
  dependencies = [],
  getItemId = (item: T) => (item as { Id?: string }).Id ?? JSON.stringify(item),
  rootMargin = "300px",
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const getItemIdRef = useRef(getItemId);
  getItemIdRef.current = getItemId;

  // Initial load or dependency change
  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const controller = new AbortController();

    fetcherRef
      .current(0, pageSize, controller.signal, false)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setTotalCount(result.totalRecordCount);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pageSize, ...dependencies]);

  // Load more items for infinite scroll
  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingMore || isLoading || isRefreshing) return;
    if (items.length >= totalCount) return;

    setIsLoadingMore(true);
    try {
      const result = await fetcherRef.current(items.length, pageSize);
      setItems((prev) => {
        const idExtractor = getItemIdRef.current;
        const existingIds = new Set(prev.map(idExtractor));
        const newItems = result.items.filter((i) => !existingIds.has(idExtractor(i)));
        return [...prev, ...newItems];
      });
      setTotalCount(result.totalRecordCount);
    } catch (err: unknown) {
      console.error("[useInfiniteScroll] Failed to load more items:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [enabled, isLoadingMore, isLoading, isRefreshing, items.length, pageSize, totalCount]);

  const sentinelRef = useIntersectionSentinel({
    onIntersect: loadMore,
    rootMargin,
    enabled: enabled && items.length < totalCount,
    resetKey: `${items.length}:${isLoading}:${isLoadingMore}:${isRefreshing}`,
  });

  // Refresh (pull-to-refresh or explicit refresh button)
  const refresh = useCallback(
    async (bypassCache = true) => {
      if (!enabled || isRefreshing) return;
      setIsRefreshing(true);
      setError(null);

      try {
        const result = await fetcherRef.current(0, pageSize, undefined, bypassCache);
        setItems(result.items);
        setTotalCount(result.totalRecordCount);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsRefreshing(false);
      }
    },
    [enabled, isRefreshing, pageSize],
  );

  const hasMore = items.length < totalCount;

  return {
    items,
    totalCount,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    sentinelRef,
    refresh,
    loadMore,
  };
}
