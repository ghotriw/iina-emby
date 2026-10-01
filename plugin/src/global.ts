/**
 * IINA Emby Plugin - Global Entry
 * Handles creating new player instances for separate windows
 */

import { createDebugLogger } from "./lib/debug-log";

const { global, console, preferences } = iina;

const debugLog = createDebugLogger(preferences, console);

debugLog("Emby Plugin Global Entry loaded");

interface CreatePlayerData {
  url?: string;
  title?: string;
}

// Listen for messages from main entries to create new instances
global.onMessage("create-player", (data: CreatePlayerData, player?: string) => {
  debugLog("Global entry received create-player message", {
    hasData: !!data,
    url: data?.url,
    title: data?.title,
  });

  try {
    const { url, title } = data;

    if (!url) {
      throw new Error("No URL provided in create-player data");
    }

    // Create a new player instance with the media URL
    const playerId = global.createPlayerInstance({
      url: url,
      label: `emby-${Date.now()}`, // Unique label
      enablePlugins: false, // Disable other plugins for cleaner experience
      disableWindowAnimation: false, // Keep animations for better UX
    });

    debugLog(`Created new player instance ${playerId} for: ${title}`);

    // Send confirmation back to the requesting player
    if (player !== undefined) {
      global.postMessage(player, "player-created", {
        playerId: playerId,
        title: title,
        url: url,
      });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    debugLog(`Error creating player instance: ${errorMsg}`);

    // Send error back to requesting player
    if (player !== undefined) {
      global.postMessage(player, "player-creation-failed", {
        error: errorMsg,
        url: data?.url,
      });
    }
  }
});

debugLog("Global entry message listeners registered");
