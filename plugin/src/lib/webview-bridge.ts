import type {
  ClientIdentity,
  EmbyServer,
  OpenExternalUrlPayload as OpenExternalUrlMessage,
  PlayMediaListPayload as PlayMediaListMessage,
  PlayMediaPayload as PlayMediaMessage,
  ServerIdPayload as ServerIdMessage,
  StoreSessionPayload as StoreSessionMessage,
} from "@shared";
import type { DebugLogger } from "./debug-log";
import type { StoredSessionData } from "./server-session-store";

export type { OpenExternalUrlMessage, PlayMediaListMessage, PlayMediaMessage, ServerIdMessage, StoreSessionMessage };

export interface WebviewTarget {
  postMessage: (name: string, data?: unknown) => void;
  onMessage: (name: string, callback: (data?: any) => void) => void;
  close?: () => void;
}

export interface WebviewBridgeDeps {
  core?: typeof iina.core;
  utils: typeof iina.utils;
  log: DebugLogger;
  getClientIdentity: () => ClientIdentity;
  getStoredEmbySession: () => StoredSessionData | null;
  clearEmbySession: () => void;
  loadStoredServers: () => EmbyServer[];
  getActiveServerId: () => string | null;
  setActiveServerId: (id: string) => void;
  addOrUpdateServer: (server: Partial<EmbyServer> & { serverUrl: string; accessToken: string }) => EmbyServer | null;
  removeServer: (serverId: string) => void;
  switchActiveServer: (serverId: string) => void;
  onPlayMedia: (data?: PlayMediaMessage) => void;
  onPlayMediaList: (data?: PlayMediaListMessage) => void;
}

export interface SetupBridgeOptions {
  closeOnPlay?: boolean;
}

/**
 * Registers common message handlers on any Webview target (sidebar or standalone window).
 */
export function registerBridgeHandlers(view: WebviewTarget, deps: WebviewBridgeDeps, options?: SetupBridgeOptions): void {
  view.onMessage("get-client-identity", () => {
    view.postMessage("client-identity", deps.getClientIdentity());
  });

  view.onMessage("get-session", () => {
    view.postMessage("session-data", deps.getStoredEmbySession());
  });

  view.onMessage("clear-session", () => {
    deps.clearEmbySession();
  });

  view.onMessage("store-session", (data?: StoreSessionMessage) => {
    if (data?.serverUrl && data?.accessToken) {
      const server = deps.addOrUpdateServer({
        serverUrl: data.serverUrl,
        accessToken: data.accessToken,
        serverName: data.serverName || "",
        userId: data.userId || "",
        username: data.username || "",
      });
      if (server) {
        deps.setActiveServerId(server.id);
        view.postMessage("servers-updated", {
          servers: deps.loadStoredServers(),
          activeServerId: server.id,
        });
      }
    }
  });

  view.onMessage("get-servers", () => {
    const servers = deps.loadStoredServers();
    const activeServerId = deps.getActiveServerId();
    view.postMessage("servers-list", { servers, activeServerId });
  });

  view.onMessage("remove-server", (data?: ServerIdMessage) => {
    if (data?.serverId) {
      deps.removeServer(data.serverId);
    }
  });

  view.onMessage("switch-server", (data?: ServerIdMessage) => {
    if (data?.serverId) {
      deps.switchActiveServer(data.serverId);
    }
  });

  view.onMessage("open-external-url", (data?: OpenExternalUrlMessage) => {
    if (data?.url) {
      deps.log(`Opening external URL: ${data.url}`);
      try {
        const success = deps.utils.open(data.url);
        if (success) {
          deps.log("Successfully opened URL in browser");
          if (data.title) {
            deps.core?.osd(`Opened ${data.title} in browser`);
          } else {
            deps.core?.osd("Opened Emby page in browser");
          }
        } else {
          throw new Error("utils.open returned false");
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        deps.log.error(`Failed to open external URL: ${errorMsg}`);
        deps.core?.osd("Failed to open Emby page in browser");
        deps.log.error(`URL that failed to open: ${data.url}`);
      }
    } else {
      deps.log("Invalid open-external-url message - missing URL");
    }
  });

  view.onMessage("play-media", (data?: PlayMediaMessage) => {
    deps.onPlayMedia(data);
    if (options?.closeOnPlay && typeof view.close === "function") {
      view.close();
    }
  });

  view.onMessage("play-media-list", (data?: PlayMediaListMessage) => {
    deps.onPlayMediaList(data);
    if (options?.closeOnPlay && typeof view.close === "function") {
      view.close();
    }
  });
}

/**
 * Sends initial state to the webview (client identity, servers list, current session).
 */
export function sendInitialBridgeState(view: WebviewTarget, deps: WebviewBridgeDeps): void {
  view.postMessage("client-identity", deps.getClientIdentity());
  const servers = deps.loadStoredServers();
  const activeServerId = deps.getActiveServerId();
  if (servers.length > 0) {
    view.postMessage("servers-list", { servers, activeServerId });
  }
  const sessionData = deps.getStoredEmbySession();
  if (sessionData) {
    view.postMessage("session-available", sessionData);
  }
}
