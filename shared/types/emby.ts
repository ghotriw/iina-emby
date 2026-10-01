/**
 * Shared Emby Types & Data Models
 */

export interface EmbyServer {
  id: string;
  serverUrl: string;
  serverName: string;
  accessToken: string;
  userId: string;
  username: string;
  addedAt?: number;
  updatedAt?: number;
}

export interface EmbyUser {
  Id: string;
  Name: string;
  ServerId?: string;
  HasPassword?: boolean;
}

export interface EmbySystemInfo {
  ServerName?: string;
  Version?: string;
  Id?: string;
}

export interface ClientIdentity {
  clientName: string;
  deviceName: string;
  deviceId: string;
  version: string;
}

export interface ParsedEmbyUrl {
  serverBase: string;
  itemId: string;
  apiKey: string;
}

export interface EmbyUserData {
  PlaybackPositionTicks?: number;
  PlayCount?: number;
  IsFavorite?: boolean;
  Played?: boolean;
  Key?: string;
  [key: string]: unknown;
}

export interface EmbyMediaStream {
  Type?: "Audio" | "Video" | "Subtitle" | string;
  Codec?: string;
  Language?: string;
  DisplayTitle?: string;
  IsTextSubtitleStream?: boolean;
  IsExternal?: boolean;
  DeliveryUrl?: string;
  Index?: number;
  Path?: string;
  [key: string]: unknown;
}

export interface EmbyMediaSource {
  Id?: string;
  Name?: string;
  Path?: string;
  Protocol?: string;
  MediaStreams?: EmbyMediaStream[];
  RunTimeTicks?: number;
  [key: string]: unknown;
}

export interface EmbyItemMetadata {
  Id: string;
  Name?: string;
  Type?: "Movie" | "Episode" | "Series" | "Season" | string;
  SeriesId?: string;
  SeasonId?: string;
  SeriesName?: string;
  ParentIndexNumber?: number;
  IndexNumber?: number;
  ProductionYear?: number;
  RunTimeTicks?: number;
  UserData?: EmbyUserData;
  MediaSources?: EmbyMediaSource[];
  [key: string]: unknown;
}

export interface EmbyPlaybackInfo {
  PlaySessionId?: string;
  MediaSources?: EmbyMediaSource[];
  [key: string]: unknown;
}

export interface EmbySeasonItem {
  Id: string;
  Name?: string;
  IndexNumber?: number;
  [key: string]: unknown;
}

export interface EmbyItemsResponse<T> {
  Items?: T[];
  TotalRecordCount?: number;
}
