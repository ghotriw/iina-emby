import type { EmbyItemMetadata, EmbyItemsResponse, EmbyServer, EmbyView } from "@shared";
import { buildAuthHeaders } from "./emby-auth-client";

/**
 * Fetch Continue Watching (Resume) items for the active user from Emby server.
 */
export async function fetchResumeItems(server: EmbyServer, limit = 12): Promise<EmbyItemMetadata[]> {
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
export async function fetchUserViews(server: EmbyServer): Promise<EmbyView[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const url = `${base}/Users/${encodeURIComponent(server.userId)}/Views`;

  const response = await fetch(url, {
    headers: buildAuthHeaders(server.accessToken, {
      Accept: "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user views: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as EmbyItemsResponse<EmbyView>;
  return data.Items || [];
}

/**
 * Fetch latest items for a specific library (ParentId).
 */
export async function fetchLatestItems(server: EmbyServer, parentId: string, limit = 16): Promise<EmbyItemMetadata[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    ParentId: parentId,
    Limit: String(limit),
    Fields: "CommunityRating,ProductionYear,ImageTags,BackdropImageTags,UserData,PrimaryImageAspectRatio,SeriesName",
    EnableImageTypes: "Primary,Backdrop,Thumb",
    ImageTypeLimit: "1",
  });

  const url = `${base}/Users/${encodeURIComponent(server.userId)}/Items/Latest?${query.toString()}`;
  const response = await fetch(url, {
    headers: buildAuthHeaders(server.accessToken, {
      Accept: "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch latest items for library ${parentId}: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as EmbyItemMetadata[];
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch next up episode for a series.
 */
export async function fetchNextUp(server: EmbyServer, seriesId: string): Promise<EmbyItemMetadata | null> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    SeriesId: seriesId,
    UserId: server.userId,
    Limit: "1",
    Fields: "UserData,MediaSources,MediaStreams,ImageTags,Overview,RunTimeTicks,PremiereDate,ParentIndexNumber,IndexNumber",
  });

  const url = `${base}/Shows/NextUp?${query.toString()}`;
  const response = await fetch(url, {
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
export async function fetchItemDetails(server: EmbyServer, itemId: string): Promise<EmbyItemMetadata> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const url = `${base}/Users/${encodeURIComponent(server.userId)}/Items/${encodeURIComponent(itemId)}`;

  const response = await fetch(url, {
    headers: buildAuthHeaders(server.accessToken, {
      Accept: "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch item details: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as EmbyItemMetadata;
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
export async function fetchItemImages(server: EmbyServer, itemId: string): Promise<EmbyImageInfo[]> {
  const base = server.serverUrl.replace(/\/+$/, "");
  const url = `${base}/Items/${encodeURIComponent(itemId)}/Images?api_key=${encodeURIComponent(server.accessToken)}`;

  try {
    const response = await fetch(url, {
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
