import { useCallback, useEffect, useRef, useState } from "react";

export interface UseIntersectionSentinelOptions {
  onIntersect: () => void;
  rootMargin?: string;
  enabled?: boolean;
  resetKey?: unknown;
}

/**
 * Shared IntersectionObserver hook for detecting when a sentinel element scrolls into view.
 * Uses a callback ref to handle dynamic mounting/unmounting, and supports resetKey to
 * re-evaluate intersection when new items are rendered (e.g. on large viewports).
 */
export function useIntersectionSentinel({
  onIntersect,
  rootMargin = "300px",
  enabled = true,
  resetKey,
}: UseIntersectionSentinelOptions): (node: HTMLDivElement | null) => void {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  const sentinelRef = useCallback((element: HTMLDivElement | null) => {
    setNode(element);
  }, []);

  useEffect(() => {
    if (!enabled || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onIntersectRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, enabled, rootMargin, resetKey]);

  return sentinelRef;
}
