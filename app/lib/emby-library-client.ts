import type { EmbyItemMetadata, EmbyItemsResponse, EmbyServer, EmbyView } from "@shared";
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

/**
 * Fetch Continue Watching (Resume) items for the active user from Emby server.
 */
export async function fetchResumeItems(server: EmbyServer, limit = 12, signal?: AbortSignal): Promise<EmbyItemMetadata[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    Limit: String(limit),
    Recursive: "true",
    MediaTypes: "Video",
    Fields:
      "PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear,UserData,SeriesName,SeasonId,SeriesId,ParentIndexNumber,IndexNumber,MediaSources,ImageTags,BackdropImageTags,ParentBackdropItemId,ParentBackdropImageTags,ParentThumbItemId,ParentThumbImageTag,SeriesPrimaryImageTag",
    EnableImageTypes: "Primary,Backdrop,Thumb",
    ImageTypeLimit: "1",
  });

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
  return data.Items || [];
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

  const cacheKey = `${base}:${server.userId}:section:${parentId}:${sortBy}:${sortOrder}:${startIndex}:${limit}:${includeItemTypes}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const query = new URLSearchParams({
      ParentId: parentId,
      Recursive: "true",
      SortBy: sortBy,
      SortOrder: sortOrder,
      StartIndex: String(startIndex),
      Limit: String(limit),
      IncludeItemTypes: includeItemTypes,
      Fields: "CommunityRating,ProductionYear,ImageTags,BackdropImageTags,UserData,PrimaryImageAspectRatio,SeriesName,RunTimeTicks,Overview",
      EnableImageTypes: "Primary,Backdrop,Thumb",
      ImageTypeLimit: "1",
    });

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
 * Fetch episodes for a series, optionally filtered by seasonId.
 */
export async function fetchEpisodes(
  server: EmbyServer,
  seriesId: string,
  seasonId?: string,
  signal?: AbortSignal,
  bypassCache = false,
): Promise<EmbyItemMetadata[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const cacheKey = `${base}:${server.userId}:episodes:${seriesId}:${seasonId || "all"}`;

  return getOrFetchCached(cacheKey, DEFAULT_CACHE_TTL_MS, bypassCache, async () => {
    const query = new URLSearchParams({
      UserId: server.userId,
      Fields:
        "Overview,PrimaryImageAspectRatio,SeriesName,SeasonId,SeriesId,ParentIndexNumber,IndexNumber,MediaSources,MediaStreams,ImageTags,UserData,RunTimeTicks",
    });

    if (seasonId) {
      query.set("seasonId", seasonId);
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
