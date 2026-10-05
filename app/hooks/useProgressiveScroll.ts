import { useCallback, useEffect, useState } from "react";
import { useIntersectionSentinel } from "./useIntersectionSentinel";

export interface UseProgressiveScrollOptions<T> {
  items: T[];
  pageSize?: number;
  rootMargin?: string;
}

export interface UseProgressiveScrollResult<T> {
  visibleItems: T[];
  visibleCount: number;
  hasMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  loadMore: () => void;
}

/**
 * Incrementally renders items from an in-memory list as the user scrolls,
 * preventing DOM bloat and unnecessary image requests for large collections.
 */
export function useProgressiveScroll<T>({
  items,
  pageSize = 36,
  rootMargin = "300px",
}: UseProgressiveScrollOptions<T>): UseProgressiveScrollResult<T> {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  // When items list reference changes (e.g. user typed search, switched tab, or changed sort),
  // reset visible count back to the initial page size.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= items.length) return prev;
      return Math.min(prev + pageSize, items.length);
    });
  }, [items.length, pageSize]);

  const hasMore = visibleCount < items.length;

  const sentinelRef = useIntersectionSentinel({
    onIntersect: loadMore,
    rootMargin,
    enabled: hasMore,
    resetKey: visibleCount,
  });

  const visibleItems = items.slice(0, visibleCount);

  return {
    visibleItems,
    visibleCount,
    hasMore,
    sentinelRef,
    loadMore,
  };
}
