import type { EmbyItemMetadata } from "@shared";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { Alert } from "../components/Alert";
import { MediaPoster, MediaPosterSkeleton } from "../components/MediaPoster";
import { PageHeader } from "../components/PageHeader";
import { WatchStatusTabs } from "../components/WatchStatusTabs";
import { useIINABridge, useOnWindowReopen } from "../hooks/useIINABridge";
import {
  clearLibraryCache,
  fetchSectionItems,
  fetchUserViews,
  type SectionFilter,
} from "../lib/emby-library-client";
import styles from "./section.module.css";

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
  const [items, setItems] = useState<EmbyItemMetadata[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [activeServer, id, stateName]);

  const loadItems = useCallback(
    async (currentFilter: SectionFilter, bypassCache = false, signal?: AbortSignal) => {
      if (!activeServer || !id) return;

      try {
        setError(null);
        const result = await fetchSectionItems(
          activeServer,
          id,
          { limit: 1000, filter: currentFilter },
          signal,
          bypassCache,
        );
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
    [activeServer, id],
  );

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    loadItems(filter, false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadItems, filter]);

  const handleFilterChange = (newFilter: SectionFilter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    clearLibraryCache();
    await loadItems(filter, true);
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
      <PageHeader
        onBack={handleBack}
        backTitle="Home"
        title={titleNode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className={styles.content}>
        <WatchStatusTabs value={filter} onChange={handleFilterChange} />

        {error && (
          <Alert icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}

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
          <div className={styles.grid}>
            {items.map((item) => (
              <MediaPoster key={item.Id} item={item} server={activeServer} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
