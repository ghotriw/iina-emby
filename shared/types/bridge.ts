import type { ClientIdentity, EmbyServer } from "./emby";

export interface StoredSessionPayload {
  serverUrl: string;
  accessToken: string;
  serverId?: string;
  serverName?: string;
  userId?: string;
  username?: string;
}

export interface ServersListPayload {
  servers: EmbyServer[];
  activeServerId: string | null;
}

export interface PlayMediaPayload {
  streamUrl: string;
  title?: string;
  [key: string]: unknown;
}

export interface PlayMediaListPayload {
  items: PlayMediaPayload[];
  [key: string]: unknown;
}

export interface StoreSessionPayload {
  serverUrl: string;
  accessToken: string;
  serverName?: string;
  userId?: string;
  username?: string;
  [key: string]: unknown;
}

export interface ServerIdPayload {
  serverId: string;
  [key: string]: unknown;
}

export interface OpenExternalUrlPayload {
  url: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Messages sent from IINA plugin to WebView (inbound to React)
 */
export interface BridgeInboundMap {
  "client-identity": ClientIdentity;
  "servers-list": ServersListPayload;
  "servers-updated": ServersListPayload;
  "session-data": StoredSessionPayload | null;
  "session-available": StoredSessionPayload;
}

/**
 * Messages sent from WebView to IINA plugin (outbound from React)
 */
export interface BridgeOutboundMap {
  "get-client-identity": undefined;
  "get-servers": undefined;
  "get-session": undefined;
  "clear-session": undefined;
  "store-session": StoreSessionPayload;
  "switch-server": ServerIdPayload;
  "remove-server": ServerIdPayload;
  "play-media": PlayMediaPayload;
  "play-media-list": PlayMediaListPayload;
  "open-external-url": OpenExternalUrlPayload;
}

export interface TypedIinaBridge {
  postMessage<K extends keyof BridgeOutboundMap>(
    name: K,
    ...args: BridgeOutboundMap[K] extends undefined ? [data?: undefined] : [data: BridgeOutboundMap[K]]
  ): void;
  postMessage(name: string, data?: unknown): void;

  onMessage<K extends keyof BridgeInboundMap>(name: K, callback: (data: BridgeInboundMap[K]) => void): void;
  onMessage(name: string, callback: (data: unknown) => void): void;
}
