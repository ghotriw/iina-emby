import type { EmbyItemMetadata, EmbyItemsResponse, EmbyServer, EmbySystemInfo, EmbyUserData, EmbyView } from "@shared";
import { buildAuthHeaders } from "./emby-auth-client";

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_CACHE_TTL_MS = 60_000; // 1 minute

export function clearLibraryCache(): void {
  cache.clear();
}

async function getOrFetchCached<T>(key: string, ttlMs: number, bypassCache: boolean, fetcher: () => Promise<T>): Promise<T> {
  if (!bypassCache) {
    const existing = cache.get(key);
    if (existing && Date.now() < existing.expires) {
      return existing.data as T;
    }
  }

  const result = await fetcher();
  cache.set(key, { data: result, expires: Date.now() + ttlMs });
  return result;
}

export interface FetchResumeItemsResult {
  items: EmbyItemMetadata[];
  totalRecordCount: number;
}

/**
 * Fetch Continue Watching (Resume) items for the active user from Emby server.
 */
export async function fetchResumeItems(
  server: EmbyServer,
  options?: number | { limit?: number; startIndex?: number },
  signal?: AbortSignal,
): Promise<FetchResumeItemsResult> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const limit = typeof options === "number" ? options : (options?.limit ?? 12);
  const startIndex = typeof options === "object" ? (options?.startIndex ?? 0) : 0;

  const query = new URLSearchParams({
    StartIndex: String(startIndex),
    Recursive: "true",
    MediaTypes: "Video",
    Fields:
      "PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear,UserData,SeriesName,SeasonId,SeriesId,ParentIndexNumber,IndexNumber,MediaSources,ImageTags,BackdropImageTags,ParentBackdropItemId,ParentBackdropImageTags,ParentThumbItemId,ParentThumbImageTag,SeriesPrimaryImageTag",
    EnableImageTypes: "Primary,Backdrop,Thumb",
    ImageTypeLimit: "1",
  });

  if (limit > 0) {
    query.set("Limit", String(limit));
  }

  const url = `${base}/Users/${encodeURIComponent(server.userId)}/Items/Resume?${query.toString()}`;
  const response = await fetch(url, {
    signal,
    headers: buildAuthHeaders(server.accessToken, {
      Accept: "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch resume items: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as EmbyItemsResponse<EmbyItemMetadata>;
  return {
    items: data.Items || [],
    totalRecordCount: data.TotalRecordCount ?? (data.Items?.length || 0),
  };
}

/**
 * Fetch root user library views (e.g. Movies, TV shows).
 */
export async function fetchUserViews(server: EmbyServer, signal?: AbortSignal, bypassCache = false): Promise<EmbyView[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:${server.userId}:views`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const url = `${base}/Users/${encodeURIComponent(server.userId)}/Views`;

    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user views: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as EmbyItemsResponse<EmbyView>;
    return data.Items || [];
  });
}

/**
 * Fetch latest items for a specific library (ParentId).
 */
export async function fetchLatestItems(
  server: EmbyServer,
  parentId: string,
  limit = 16,
  signal?: AbortSignal,
  bypassCache = false,
): Promise<EmbyItemMetadata[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:${server.userId}:latest:${parentId}:${limit}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const query = new URLSearchParams({
      ParentId: parentId,
      Limit: String(limit),
      Fields: "CommunityRating,ProductionYear,ImageTags,BackdropImageTags,UserData,PrimaryImageAspectRatio,SeriesName",
      EnableImageTypes: "Primary,Backdrop,Thumb",
      ImageTypeLimit: "1",
    });

    const url = `${base}/Users/${encodeURIComponent(server.userId)}/Items/Latest?${query.toString()}`;
    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest items for library ${parentId}: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as EmbyItemMetadata[];
    return Array.isArray(data) ? data : [];
  });
}

export type SectionFilter = "all" | "unplayed" | "inprogress" | "played";

export interface FetchSectionItemsResult {
  items: EmbyItemMetadata[];
  totalRecordCount: number;
}

/**
 * Fetch all items for a specific library section (ParentId).
 */
export async function fetchSectionItems(
  server: EmbyServer,
  parentId: string,
  options?: {
    sortBy?: string;
    sortOrder?: "Ascending" | "Descending";
    limit?: number;
    startIndex?: number;
    includeItemTypes?: string;
    filter?: SectionFilter;
  },
  signal?: AbortSignal,
  bypassCache = false,
): Promise<FetchSectionItemsResult> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const sortBy = options?.sortBy || "SortName";
  const sortOrder = options?.sortOrder || "Ascending";
  const limit = options?.limit ?? 500;
  const startIndex = options?.startIndex ?? 0;
  const includeItemTypes = options?.includeItemTypes || "Movie,Series,BoxSet,Video";
  const filter = options?.filter || "all";

  const cacheKey = `${base}:${server.userId}:section:${parentId}:${sortBy}:${sortOrder}:${startIndex}:${limit}:${includeItemTypes}:${filter}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    if (filter === "inprogress" || filter === "unplayed") {
      // Emby's native IsUnplayed filter considers anything where Played == false as "unplayed",
      // which wrongly includes items already in progress.
      // We partition them cleanly so Unplayed only shows completely untouched media.
      const [sectionData, resumeResult] = await Promise.all([
        fetchSectionItems(server, parentId, { ...options, filter: "all" }, signal, bypassCache),
        fetchResumeItems(server, 100, signal).catch(() => ({ items: [], totalRecordCount: 0 })),
      ]);

      const resumeSeriesIds = new Set(resumeResult.items.map((r) => r.SeriesId).filter((id): id is string => Boolean(id)));
      const resumeItemIds = new Set(resumeResult.items.map((r) => r.Id));

      const isProgress = (item: EmbyItemMetadata) => {
        if (item.Type === "Series") {
          if (resumeSeriesIds.has(item.Id)) return true;
          if (item.UserData?.Played) return false;
          if (typeof item.UserData?.PlayedPercentage === "number" && item.UserData.PlayedPercentage > 0) {
            return true;
          }
          const unplayed = item.UserData?.UnplayedItemCount;
          const total = (item as unknown as { RecursiveItemCount?: number }).RecursiveItemCount;
          if (typeof unplayed === "number" && typeof total === "number" && total > 0 && unplayed < total) {
            return true;
          }
          return false;
        }

        // Movies, Videos, Episodes
        if (resumeItemIds.has(item.Id)) return true;
        return Boolean(item.UserData?.PlaybackPositionTicks && item.UserData.PlaybackPositionTicks > 0);
      };

      const filteredItems = sectionData.items.filter((item) => {
        const inProgress = isProgress(item);
        if (filter === "inprogress") {
          return inProgress;
        }
        // filter === "unplayed": must not be marked as played and must not be in progress
        if (item.UserData?.Played) return false;
        return !inProgress;
      });

      return {
        items: filteredItems,
        totalRecordCount: filteredItems.length,
      };
    }

    const query = new URLSearchParams({
      ParentId: parentId,
      Recursive: "true",
      SortBy: sortBy,
      SortOrder: sortOrder,
      StartIndex: String(startIndex),
      Limit: String(limit),
      IncludeItemTypes: includeItemTypes,
      Fields:
        "CommunityRating,ProductionYear,ImageTags,BackdropImageTags,UserData,PrimaryImageAspectRatio,SeriesName,RunTimeTicks,Overview,RecursiveItemCount,ItemCounts",
      EnableImageTypes: "Primary,Backdrop,Thumb",
      ImageTypeLimit: "1",
    });

    if (filter === "played") {
      query.set("Filters", "IsPlayed");
    }

    const url = `${base}/Users/${encodeURIComponent(server.userId)}/Items?${query.toString()}`;
    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch section items: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as EmbyItemsResponse<EmbyItemMetadata>;
    return {
      items: data.Items || [],
      totalRecordCount: data.TotalRecordCount ?? (data.Items?.length || 0),
    };
  });
}

/**
 * Fetch next up episode for a series.
 */
export async function fetchNextUp(server: EmbyServer, seriesId: string, signal?: AbortSignal): Promise<EmbyItemMetadata | null> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    SeriesId: seriesId,
    UserId: server.userId,
    Limit: "1",
    Fields: "UserData,MediaSources,MediaStreams,ImageTags,Overview,RunTimeTicks,PremiereDate,ParentIndexNumber,IndexNumber",
  });

  const url = `${base}/Shows/NextUp?${query.toString()}`;
  const response = await fetch(url, {
    signal,
    headers: buildAuthHeaders(server.accessToken, {
      Accept: "application/json",
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as EmbyItemsResponse<EmbyItemMetadata>;
  return data.Items?.[0] || null;
}

/**
 * Fetch full details for a single item.
 */
export async function fetchItemDetails(
  server: EmbyServer,
  itemId: string,
  signal?: AbortSignal,
  bypassCache = false,
): Promise<EmbyItemMetadata> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:${server.userId}:item:${itemId}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const url = `${base}/Users/${encodeURIComponent(server.userId)}/Items/${encodeURIComponent(itemId)}`;

    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as EmbyItemMetadata;
  });
}

/**
 * Image descriptor returned by /Items/{id}/Images.
 */
export interface EmbyImageInfo {
  ImageType: string;
  ImageIndex?: number;
  Path?: string;
  Filename?: string;
  Height?: number;
  Width?: number;
  Size?: number;
}

/**
 * Fetch all available images for an item.
 */
export async function fetchItemImages(server: EmbyServer, itemId: string, signal?: AbortSignal): Promise<EmbyImageInfo[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const url = `${base}/Items/${encodeURIComponent(itemId)}/Images?api_key=${encodeURIComponent(server.accessToken)}`;

  try {
    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as EmbyImageInfo[];
  } catch {
    return [];
  }
}

/**
 * Builds the direct static video stream URL for playing an item in IINA.
 */
export function buildStreamUrl(server: EmbyServer, itemId: string): string {
  const base = server.serverUrl.replace(/\/+$/, "");
  return `${base}/Videos/${encodeURIComponent(itemId)}/stream?static=true&api_key=${encodeURIComponent(server.accessToken)}`;
}

/**
 * Fetch all seasons for a series.
 */
export async function fetchSeasons(
  server: EmbyServer,
  seriesId: string,
  signal?: AbortSignal,
  bypassCache = false,
): Promise<EmbyItemMetadata[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:${server.userId}:seasons:${seriesId}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const query = new URLSearchParams({
      UserId: server.userId,
      Fields: "ItemCounts,PrimaryImageAspectRatio,Overview,UserData",
    });

    const url = `${base}/Shows/${encodeURIComponent(seriesId)}/Seasons?${query.toString()}`;
    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch seasons: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as EmbyItemsResponse<EmbyItemMetadata>;
    return data.Items || [];
  });
}

/**
 * Fetch episodes for a series, optionally filtered by seasonId and limit.
 */
export async function fetchEpisodes(
  server: EmbyServer,
  seriesId: string,
  seasonId?: string,
  signal?: AbortSignal,
  bypassCache = false,
  limit?: number,
): Promise<EmbyItemMetadata[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:${server.userId}:episodes:${seriesId}:${seasonId || "all"}${limit ? `:${limit}` : ""}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const query = new URLSearchParams({
      UserId: server.userId,
      Fields:
        "Overview,PrimaryImageAspectRatio,SeriesName,SeasonId,SeriesId,ParentIndexNumber,IndexNumber,MediaSources,MediaStreams,ImageTags,UserData,RunTimeTicks",
    });

    if (seasonId) {
      query.set("seasonId", seasonId);
    }
    if (limit) {
      query.set("Limit", String(limit));
    }

    const url = `${base}/Shows/${encodeURIComponent(seriesId)}/Episodes?${query.toString()}`;
    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch episodes: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as EmbyItemsResponse<EmbyItemMetadata>;
    return data.Items || [];
  });
}

/**
 * Fetch authenticated server system information (version, updates, OS).
 */
export async function fetchServerSystemInfo(server: EmbyServer, signal?: AbortSignal, bypassCache = false): Promise<EmbySystemInfo> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:system_info`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const url = `${base}/System/Info`;
    const response = await fetch(url, {
      signal,
      headers: buildAuthHeaders(server.accessToken, {
        Accept: "application/json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system info: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as EmbySystemInfo;
  });
}

/**
 * Mark an item as played (POST) or unplayed (DELETE) in Emby.
 */
export async function setItemPlayedStatus(server: EmbyServer, itemId: string, played: boolean): Promise<EmbyUserData> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const url = `${base}/Users/${encodeURIComponent(server.userId)}/PlayedItems/${encodeURIComponent(itemId)}`;

  const response = await fetch(url, {
    method: played ? "POST" : "DELETE",
    headers: buildAuthHeaders(server.accessToken, {
      Accept: "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update played status: ${response.status} ${response.statusText}`);
  }

  clearLibraryCache();

  const text = await response.text();
  try {
    return text ? (JSON.parse(text) as EmbyUserData) : { Played: played };
  } catch {
    return { Played: played };
  }
}

export interface EmbyScanTaskStatus {
  /** "Idle" | "Running" | "Cancelling" */
  state: string;
  progress: number | null;
  lastEndTime?: string;
  lastStatus?: string;
}

/**
 * Trigger a scan of all media libraries (admin only). Returns immediately; the scan runs server-side.
 */
export async function startLibraryScan(server: EmbyServer): Promise<void> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const response = await fetch(`${base}/Library/Refresh`, {
    method: "POST",
    headers: buildAuthHeaders(server.accessToken, { Accept: "application/json" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start library scan: ${response.status} ${response.statusText}`);
  }
}

/**
 * Read the state of the "Scan media library" scheduled task (admin only).
 */
export async function fetchLibraryScanStatus(server: EmbyServer, signal?: AbortSignal): Promise<EmbyScanTaskStatus | null> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const response = await fetch(`${base}/ScheduledTasks?IsHidden=false`, {
    signal,
    headers: buildAuthHeaders(server.accessToken, { Accept: "application/json" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scheduled tasks: ${response.status} ${response.statusText}`);
  }

  const tasks = (await response.json()) as Array<{
    Key?: string;
    State?: string;
    CurrentProgressPercentage?: number;
    LastExecutionResult?: { EndTimeUtc?: string; Status?: string };
  }>;
  const task = tasks.find((t) => t.Key === "RefreshLibrary");
  if (!task) return null;

  return {
    state: task.State ?? "Idle",
    progress: typeof task.CurrentProgressPercentage === "number" ? task.CurrentProgressPercentage : null,
    lastEndTime: task.LastExecutionResult?.EndTimeUtc,
    lastStatus: task.LastExecutionResult?.Status,
  };
}
