import type { EmbyItemMetadata } from "@shared";
import { IconAlertCircle } from "@tabler/icons-react";
import { Navigate, useNavigate } from "react-router";
import { MediaThumb, MediaThumbSkeleton } from "../components/MediaThumb";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/ui";
import { useIINABridge, useOnWindowReopen } from "../hooks/useIINABridge";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { clearLibraryCache, fetchResumeItems } from "../lib/emby-library-client";
import styles from "./continue-watching.module.css";

const PAGE_SIZE = 24;

export function meta() {
  return [{ title: "Continue Watching - IINA Emby" }, { name: "description", content: "Continue watching media" }];
}

export default function ContinueWatchingRoute() {
  const navigate = useNavigate();
  const { activeServer, servers, isLoading: isBridgeLoading, playMedia } = useIINABridge();

  const { items, totalCount, isLoading, isLoadingMore, isRefreshing, error, refresh, sentinelRef } = useInfiniteScroll<EmbyItemMetadata>({
    fetcher: (startIndex, limit, signal) => {
      if (!activeServer) return Promise.resolve({ items: [], totalRecordCount: 0 });
      return fetchResumeItems(activeServer, { limit, startIndex }, signal);
    },
    pageSize: PAGE_SIZE,
    enabled: Boolean(activeServer),
    dependencies: [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId],
  });

  const handleRefresh = async () => {
    clearLibraryCache();
    await refresh(true);
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
                <MediaThumb key={item.Id} item={item} server={activeServer} onPlay={playMedia} onUserDataChange={() => handleRefresh()} />
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
