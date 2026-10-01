/**
 * IINA Emby Plugin - Global Entry
 * Persistent background script that runs independently of player windows.
 * Manages the standalone browser window, listens for reopen requests, and coordinates playback.
 */

import { createBrowserWindowManager } from "./lib/browser-window";
import { createDebugLogger } from "./lib/debug-log";
import { createEmbyApi } from "./lib/emby-api";
import { createServerSessionStore } from "./lib/server-session-store";
import type { PlayMediaListMessage, PlayMediaMessage, WebviewBridgeDeps } from "./lib/webview-bridge";

const { global, console, preferences, standaloneWindow, utils, http, menu } = iina;

const debugLog = createDebugLogger(preferences, console);

debugLog("Emby Plugin Global Entry loaded");
console.log("[iina-emby] Global Entry initialized");

// Shared API and Session Store
const { getClientIdentity } = createEmbyApi({
  http,
  preferences,
  log: debugLog,
});

const {
  loadStoredServers,
  getActiveServerId,
  setActiveServerId,
  addOrUpdateServer,
  removeServer,
  switchActiveServer,
  getStoredEmbySession,
  clearEmbySession,
} = createServerSessionStore({
  preferences,
  standaloneWindow,
  log: debugLog,
});

// Track registered player windows
let activePlayerCount = 0;

global.onMessage("player-registered", () => {
  activePlayerCount++;
  debugLog("Player instance registered, active count:", activePlayerCount);
});

global.onMessage("player-unregistered", () => {
  activePlayerCount = Math.max(0, activePlayerCount - 1);
  debugLog("Player instance unregistered, active count:", activePlayerCount);
});

/**
 * Handle media playback initiated from the standalone browser window
 */
function handleGlobalPlayMedia(data?: PlayMediaMessage): void {
  if (!data?.streamUrl) return;

  const openInNewWindow = preferences.get("open_in_new_window");
  debugLog("Global entry handleGlobalPlayMedia:", {
    title: data.title,
    streamUrl: data.streamUrl,
    activePlayerCount,
    openInNewWindow,
  });

  if (activePlayerCount > 0 && !openInNewWindow) {
    debugLog("Forwarding play-media to active player instance");
    global.postMessage(null, "play-media-command", data);
  } else {
    debugLog("Creating new player instance for playback");
    try {
      const playerId = global.createPlayerInstance({
        url: data.streamUrl,
        label: `emby-${Date.now()}`,
        enablePlugins: true,
        disableWindowAnimation: false,
      });
      debugLog(`Created player instance ${playerId} for: ${data.title}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      debugLog.error("Failed to create player instance: " + errorMsg);
    }
  }
}

function handleGlobalPlayMediaList(data?: PlayMediaListMessage): void {
  if (activePlayerCount > 0) {
    debugLog("Forwarding play-media-list to active player instance");
    global.postMessage(null, "play-media-list-command", data);
  } else {
    const firstItem = data?.items?.[0];
    if (firstItem) {
      handleGlobalPlayMedia(firstItem);
    }
  }
}

const bridgeDeps: WebviewBridgeDeps = {
  utils,
  log: debugLog,
  getClientIdentity,
  getStoredEmbySession,
  clearEmbySession,
  loadStoredServers,
  getActiveServerId,
  setActiveServerId,
  addOrUpdateServer,
  removeServer,
  switchActiveServer,
  onPlayMedia: handleGlobalPlayMedia,
  onPlayMediaList: handleGlobalPlayMediaList,
};

const { openEmbyStandaloneWindow, showEmbyBrowser } = createBrowserWindowManager({
  standaloneWindow,
  preferences,
  bridgeDeps,
  log: debugLog,
});

// Reopen standalone browser when requested by any player window closing or finishing playback
global.onMessage("reopen-browser", () => {
  console.log("[iina-emby] Global entry received reopen-browser request, opening standalone browser");
  debugLog("Global entry opening standalone Emby browser");
  openEmbyStandaloneWindow();
});

// Global menu item so users can open the Emby browser even when 0 player windows exist
menu.addItem(
  menu.item("Show Emby Browser", showEmbyBrowser, {
    keyBinding: "Meta+Shift+e",
  }),
);

interface CreatePlayerData {
  url?: string;
  title?: string;
}

// Backward compatibility: create-player requests from player entries
global.onMessage("create-player", (data: CreatePlayerData, player?: string) => {
  debugLog("Global entry received create-player message", {
    hasData: Boolean(data),
    url: data?.url,
    title: data?.title,
  });

  try {
    const { url, title } = data;
    if (!url) {
      throw new Error("No URL provided in create-player data");
    }

    const playerId = global.createPlayerInstance({
      url,
      label: `emby-${Date.now()}`,
      enablePlugins: true,
      disableWindowAnimation: false,
    });

    debugLog(`Created new player instance ${playerId} for: ${title}`);

    if (player !== undefined) {
      global.postMessage(player, "player-created", {
        playerId,
        title,
        url,
      });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    debugLog.error(`Error creating player instance: ${errorMsg}`);

    if (player !== undefined) {
      global.postMessage(player, "player-creation-failed", {
        error: errorMsg,
        url: data?.url,
      });
    }
  }
});

debugLog("Global entry message listeners registered");
