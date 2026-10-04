import type { EmbyItemMetadata } from "@shared";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { MediaThumb, MediaThumbSkeleton } from "../components/MediaThumb";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/ui";
import { useIINABridge, useOnWindowReopen } from "../hooks/useIINABridge";
import { clearLibraryCache, fetchResumeItems } from "../lib/emby-library-client";
import styles from "./continue-watching.module.css";

const PAGE_SIZE = 24;

export function meta() {
  return [{ title: "Continue Watching - IINA Emby" }, { name: "description", content: "Continue watching media" }];
}

export default function ContinueWatchingRoute() {
  const navigate = useNavigate();
  const { activeServer, servers, isLoading: isBridgeLoading, playMedia } = useIINABridge();

  const [items, setItems] = useState<EmbyItemMetadata[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadInitial = useCallback(
    async (signal?: AbortSignal) => {
      if (!activeServer) return;

      try {
        setError(null);
        const result = await fetchResumeItems(activeServer, { limit: PAGE_SIZE, startIndex: 0 }, signal);
        if (signal?.aborted) return;
        setItems(result.items);
        setTotalCount(result.totalRecordCount);
      } catch (err: unknown) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeServer],
  );

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    loadInitial(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!activeServer || isLoadingMore || isLoading || isRefreshing) return;
    if (items.length >= totalCount) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchResumeItems(activeServer, {
        limit: PAGE_SIZE,
        startIndex: items.length,
      });
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.Id));
        const newItems = result.items.filter((i) => !existingIds.has(i.Id));
        return [...prev, ...newItems];
      });
      setTotalCount(result.totalRecordCount);
    } catch (err: unknown) {
      console.error("Failed to load more resume items:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeServer, isLoadingMore, isLoading, isRefreshing, items.length, totalCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    clearLibraryCache();
    await loadInitial();
  };

  useOnWindowReopen(() => {
    handleRefresh();
  });

  if (isBridgeLoading) {
    return null;
  }

  if (servers.length === 0 || !activeServer) {
    return <Navigate to="/servers" replace />;
  }

  const handleBack = () => {
    navigate("/");
  };

  const titleNode = (
    <span>
      Continue Watching
      {totalCount > 0 && <span className={styles.countBadge}>({totalCount})</span>}
    </span>
  );

  return (
    <div className={styles.container}>
      <PageHeader onBack={handleBack} backTitle="Home" title={titleNode} onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className={styles.content}>
        {error && <Alert icon={<IconAlertCircle size={18} />}>{error}</Alert>}

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <MediaThumbSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : items.length === 0 && !error ? (
          <div className={styles.emptyState}>
            <p>No in-progress movies or episodes right now.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map((item) => (
                <MediaThumb
                  key={item.Id}
                  item={item}
                  server={activeServer}
                  onPlay={playMedia}
                  onUserDataChange={() => handleRefresh()}
                />
              ))}
              {isLoadingMore && Array.from({ length: 4 }).map((_, index) => <MediaThumbSkeleton key={`more-skeleton-${index}`} />)}
            </div>

            {items.length < totalCount && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
          </>
        )}
      </main>
    </div>
  );
}
