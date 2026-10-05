import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { MediaPoster, MediaPosterSkeleton } from "../components/MediaPoster";
import { PageHeader } from "../components/PageHeader";
import { SectionToolbar } from "../components/SectionToolbar";
import { Alert } from "../components/ui";
import { useIINABridge, useOnWindowReopen } from "../hooks/useIINABridge";
import { useProgressiveScroll } from "../hooks/useProgressiveScroll";
import { clearLibraryCache, fetchAllSectionData, fetchUserViews, type SectionAllData } from "../lib/emby-library-client";
import { filterAndSortSectionItems, type SectionFilter, type SectionSortBy, type SectionSortOrder } from "../lib/section-items";
import { startViewTransitionSafe } from "../lib/view-transitions";
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SectionSortBy>("name");
  const [sortOrder, setSortOrder] = useState<SectionSortOrder>("asc");

  const [rawData, setRawData] = useState<SectionAllData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch section title if not provided in route state
  useEffect(() => {
    if (stateName || !activeServer || !id) return;
    const controller = new AbortController();

    fetchUserViews(activeServer, controller.signal)
      .then((views) => {
        if (controller.signal.aborted) return;
        const found = views.find((v) => v.Id === id);
        if (found?.Name) {
          setSectionTitle(found.Name);
        }
      })
      .catch(() => {
        // Non-critical, fallback remains "Library"
      });

    return () => {
      controller.abort();
    };
  }, [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId, id, stateName]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(
    async (bypassCache = false) => {
      if (!activeServer || !id) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      try {
        if (bypassCache) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const data = await fetchAllSectionData(activeServer, id, signal, bypassCache);
        if (signal.aborted) return;
        setRawData(data);
      } catch (err: unknown) {
        if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId, id],
  );

  useEffect(() => {
    loadData(false);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadData]);

  const handleRefresh = async () => {
    clearLibraryCache();
    await loadData(true);
  };

  useOnWindowReopen(() => {
    handleRefresh();
  });

  const handleFilterChange = (newFilter: SectionFilter) => {
    startViewTransitionSafe(() => {
      setFilter(newFilter);
    });
  };

  const handleSortByChange = (newSortBy: SectionSortBy) => {
    startViewTransitionSafe(() => {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === "name" ? "asc" : "desc");
    });
  };

  const handleSortOrderChange = (newOrder: SectionSortOrder) => {
    startViewTransitionSafe(() => {
      setSortOrder(newOrder);
    });
  };

  const handleSearchQueryChange = (query: string) => {
    if (!query && searchQuery) {
      startViewTransitionSafe(() => {
        setSearchQuery("");
      });
    } else {
      setSearchQuery(query);
    }
  };

  // Client-side filtering and sorting
  const filteredItems = useMemo(() => {
    if (!rawData) return [];
    return filterAndSortSectionItems(rawData.items, {
      filter,
      searchQuery,
      sortBy,
      sortOrder,
      resumeSeriesIds: rawData.resumeSeriesIds,
      resumeItemIds: rawData.resumeItemIds,
    });
  }, [rawData, filter, searchQuery, sortBy, sortOrder]);

  // Progressive rendering for DOM performance
  const { visibleItems, hasMore, sentinelRef } = useProgressiveScroll({
    items: filteredItems,
    pageSize: PAGE_SIZE,
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

  const totalCount = rawData?.items.length ?? 0;
  const filteredCount = filteredItems.length;

  const countBadgeText = totalCount === 0 ? null : filteredCount !== totalCount ? `(${filteredCount} / ${totalCount})` : `(${totalCount})`;

  const titleNode = (
    <span>
      {sectionTitle}
      {countBadgeText && <span className={styles.countBadge}>{countBadgeText}</span>}
    </span>
  );

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No media found matching "${searchQuery.trim()}".`;
    }
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
        <SectionToolbar
          filter={filter}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />

        {error && <Alert icon={<IconAlertCircle size={18} />}>{error}</Alert>}

        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 18 }).map((_, index) => (
              <MediaPosterSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredItems.length === 0 && !error ? (
          <div className={styles.emptyState}>
            <p>{getEmptyMessage()}</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {visibleItems.map((item) => (
                <MediaPoster key={item.Id} item={item} server={activeServer} />
              ))}
            </div>

            {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
          </>
        )}
      </main>
    </div>
  );
}
