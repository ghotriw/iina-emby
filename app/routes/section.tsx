import type { EmbyItemMetadata } from "@shared";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { MediaPoster, MediaPosterSkeleton } from "../components/MediaPoster";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/ui";
import { WatchStatusTabs } from "../components/WatchStatusTabs";
import { useIINABridge, useOnWindowReopen } from "../hooks/useIINABridge";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { clearLibraryCache, fetchSectionItems, fetchUserViews, type SectionFilter } from "../lib/emby-library-client";
import styles from "./section.module.css";

const PAGE_SIZE = 36;

export function meta() {
  return [{ title: "Collection - IINA Emby" }, { name: "description", content: "Collection view" }];
}

export default function SectionRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeServer, servers, isLoading: isBridgeLoading } = useIINABridge();

  const stateName = location.state?.name as string | undefined;
  const [sectionTitle, setSectionTitle] = useState<string>(stateName || "Library");
  const [filter, setFilter] = useState<SectionFilter>("all");

  // Fetch section title if not provided in route state
  useEffect(() => {
    if (stateName || !activeServer || !id) return;

    fetchUserViews(activeServer)
      .then((views) => {
        const found = views.find((v) => v.Id === id);
        if (found?.Name) {
          setSectionTitle(found.Name);
        }
      })
      .catch(() => {
        // Non-critical, fallback remains "Library"
      });
  }, [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId, id, stateName]);

  const { items, totalCount, isLoading, isLoadingMore, isRefreshing, error, refresh, sentinelRef } = useInfiniteScroll<EmbyItemMetadata>({
    fetcher: (startIndex, limit, signal, bypassCache) => {
      if (!activeServer || !id) return Promise.resolve({ items: [], totalRecordCount: 0 });
      return fetchSectionItems(activeServer, id, { limit, startIndex, filter }, signal, bypassCache);
    },
    pageSize: PAGE_SIZE,
    enabled: Boolean(activeServer && id),
    dependencies: [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId, id, filter],
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
      {sectionTitle}
      {totalCount > 0 && <span className={styles.countBadge}>({totalCount})</span>}
    </span>
  );

  const getEmptyMessage = () => {
    switch (filter) {
      case "unplayed":
        return "No unplayed media in this collection.";
      case "inprogress":
        return "No in-progress media in this collection.";
      case "played":
        return "No played media in this collection.";
      default:
        return "No media found in this collection.";
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader onBack={handleBack} backTitle="Home" title={titleNode} onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className={styles.content}>
        <WatchStatusTabs value={filter} onChange={setFilter} />

        {error && <Alert icon={<IconAlertCircle size={18} />}>{error}</Alert>}

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 18 }).map((_, index) => (
              <MediaPosterSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : items.length === 0 && !error ? (
          <div className={styles.emptyState}>
            <p>{getEmptyMessage()}</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map((item) => (
                <MediaPoster key={item.Id} item={item} server={activeServer} />
              ))}
              {isLoadingMore && Array.from({ length: 6 }).map((_, index) => <MediaPosterSkeleton key={`more-skeleton-${index}`} />)}
            </div>

            {items.length < totalCount && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
          </>
        )}
      </main>
    </div>
  );
}
