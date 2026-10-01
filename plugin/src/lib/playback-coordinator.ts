import { sanitizeStreamUrl } from "@shared";
import type { DebugLogger } from "./debug-log";
import type { PlayMediaListMessage, PlayMediaMessage } from "./webview-bridge";

export interface PlaylistItem {
  streamUrl: string;
  title?: string;
  [key: string]: unknown;
}

export interface PendingPlaylistQueue {
  items: PlaylistItem[];
  at: number;
  itemId: string | null;
}

export interface GlobalPlayerCreatedMessage {
  playerId?: string | number;
  title?: string;
  url?: string;
}

export interface GlobalPlayerFailedMessage {
  error?: string;
  url?: string;
}

export interface PlaybackCoordinatorDeps {
  core: typeof iina.core;
  mpv: typeof iina.mpv;
  preferences: typeof iina.preferences;
  global?: typeof iina.global;
  getCurrentPlaybackSession: () => unknown;
  clearQueuedFlag: () => void;
  log: DebugLogger;
}

const REPLACEMENT_GUARD_MS = 10000;
const PENDING_QUEUE_TTL_MS = 60000;

export function createPlaybackCoordinator({
  core,
  mpv,
  preferences,
  global: iinaGlobal,
  getCurrentPlaybackSession,
  clearQueuedFlag,
  log,
}: PlaybackCoordinatorDeps) {
  // Guard to prevent spurious stop reports during a file switch. Stored as a
  // timestamp and expired after REPLACEMENT_GUARD_MS: if the expected end-file
  // never arrives (e.g. core.open failed), a stale guard must not swallow the
  // stop report of the next file that really does finish.
  let replacingPlaybackAt = 0;

  function markReplacingPlayback(): void {
    replacingPlaybackAt = Date.now();
  }

  function consumeReplacementGuard(): boolean {
    if (!replacingPlaybackAt) {
      return false;
    }

    const age = Date.now() - replacingPlaybackAt;
    replacingPlaybackAt = 0;

    if (age > REPLACEMENT_GUARD_MS) {
      log(`Ignoring replacement guard set ${age}ms ago (expired)`);
      return false;
    }

    return true;
  }

  /**
   * Open media in a new IINA instance
   */
  function openInNewInstance(streamUrl: string, title?: string): void {
    if (iinaGlobal && typeof iinaGlobal.postMessage === "function") {
      log("Requesting new player instance from global entry");
      iinaGlobal.postMessage("create-player", { url: streamUrl, title });
    } else {
      log("Global entry not available, opening in current window");
      core.open(streamUrl);
    }
  }

  /**
   * Open media in the current window, replacing what is playing
   */
  function openInCurrentWindow(streamUrl: string, title?: string): void {
    log("Opening media in current window: " + streamUrl);

    // Set replacement guard so end-file handler doesn't send spurious stop
    if (getCurrentPlaybackSession()) {
      markReplacingPlayback();
    }

    // Clear any previous playlist entries to prevent stale titles. IINA's
    // playlist API has no clear(), so use mpv's own command — it drops every
    // entry except the one currently playing, which core.open replaces below.
    try {
      mpv.command("playlist-clear", []);
      // Reset autoplay state when starting new playback
      clearQueuedFlag();
    } catch (clearError: unknown) {
      const errorMsg = clearError instanceof Error ? clearError.message : String(clearError);
      log(`Could not clear playlist before opening: ${errorMsg}`);
    }

    // We use core.open instead of mpv.command('loadfile') because core.open
    // properly triggers IINA's native lifecycle and sleep prevention checks.
    // Set force-media-title BEFORE core.open so mpv uses it when loadfile runs.
    if (title) {
      mpv.set("force-media-title", title);
    }
    core.open(streamUrl);
  }

  // Items waiting to join the playlist behind the one currently being opened.
  let pendingPlaylistQueue: PendingPlaylistQueue | null = null;

  /**
   * Append the items held back by handlePlayMediaList. Called once the first item
   * of the list has actually loaded, so mpv's replacing load cannot discard them.
   */
  function flushPendingPlaylistQueue(fileUrl?: string): void {
    if (!pendingPlaylistQueue) {
      return;
    }

    const { items, at, itemId } = pendingPlaylistQueue;
    pendingPlaylistQueue = null;

    if (Date.now() - at > PENDING_QUEUE_TTL_MS) {
      log("Queued playlist items are stale, not appending them");
      return;
    }

    // Make sure this is the file the list started with. IINA percent-encodes the
    // URL, so compare on the item id rather than the whole string.
    if (itemId && fileUrl && !String(fileUrl).includes(itemId)) {
      log(`Loaded file is not the queued list's first item (${itemId}), dropping the queue`);
      return;
    }

    try {
      // loadfile carries per-file options, so each queued entry keeps its own
      // title instead of showing a raw URL in the playlist.
      for (const item of items) {
        const args: string[] = [item.streamUrl, "append"];
        if (item.title) {
          args.push("-1", `force-media-title=${item.title}`);
        }
        mpv.command("loadfile", args);
      }
      log(`Appended ${items.length} queued item(s) to the playlist`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log("Could not append queued items: " + errorMsg);
    }
  }

  /**
   * Handle a request to play several items in order (e.g. a whole album).
   * A playlist only exists within one window, so this always plays in the
   * current window regardless of the open_in_new_window preference.
   */
  function handlePlayMediaList(message?: PlayMediaListMessage): void {
    const rawItems = message?.items || [];
    const items: PlaylistItem[] = rawItems
      .filter((item): item is PlayMediaMessage & { streamUrl: string } => Boolean(item && item.streamUrl))
      .map((item) => ({
        ...item,
        streamUrl: sanitizeStreamUrl(item.streamUrl) || item.streamUrl,
      }));
    log(`handlePlayMediaList called with ${items.length} playable item(s)`);

    if (items.length === 0) {
      log("No playable items in list");
      core.osd("Nothing to play");
      return;
    }

    const [firstItem, ...queuedItems] = items;

    try {
      if (queuedItems.length > 0) {
        core.osd(`Playing ${items.length} tracks, starting with: ${firstItem.title || ""}`);
      } else {
        core.osd(`Opening: ${firstItem.title || ""}`);
      }

      // The rest can only be appended once the first item has loaded.
      const firstItemId = (String(firstItem.streamUrl).match(/\/(?:Items|Videos|Audio)\/([^/?]+)/) || [])[1] || null;
      pendingPlaylistQueue = queuedItems.length > 0 ? { items: queuedItems, at: Date.now(), itemId: firstItemId } : null;

      openInCurrentWindow(firstItem.streamUrl, firstItem.title);

      log(`Holding ${queuedItems.length} item(s) until the first one loads`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error("Error playing media list: " + errorMsg);
      core.osd("Failed to play tracks");
    }
  }

  /**
   * Handle media playback requests from sidebar
   */
  function handlePlayMedia(message?: PlayMediaMessage): void {
    log("HANDLE PLAY MEDIA CALLED");
    log("handlePlayMedia called with message", {
      title: message?.title,
      streamUrl: message?.streamUrl,
    });
    const streamUrl = sanitizeStreamUrl(message?.streamUrl);
    const title = message?.title;

    if (!streamUrl) {
      log("handlePlayMedia called without streamUrl");
      return;
    }

    log(`Opening media: ${title} - ${streamUrl}`);

    try {
      const openInNewWindow = preferences.get("open_in_new_window");
      log("open_in_new_window preference: " + openInNewWindow);

      if (openInNewWindow) {
        log("Opening media in new instance: " + streamUrl);
        core.osd(`Opening in new window: ${title || ""}`);
        openInNewInstance(streamUrl, title);
      } else {
        core.osd(`Opening: ${title || ""}`);
        openInCurrentWindow(streamUrl, title);
      }

      log("Successfully initiated media opening: " + streamUrl);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error("Error opening media: " + errorMsg);
      core.osd("Failed to open media");

      // No clipboard API is exposed to plugins, so the URL only goes to the log
      log.error(`URL that failed to open: ${streamUrl}`);
    }
  }

  // Register replies from the global entry if available
  if (iinaGlobal && typeof iinaGlobal.onMessage === "function") {
    iinaGlobal.onMessage("player-created", (data: GlobalPlayerCreatedMessage) => {
      log("New player instance created", {
        playerId: data?.playerId,
        title: data?.title,
        url: data?.url,
      });
      if (data?.title) {
        core.osd(`Opened in new window: ${data.title}`);
      }
    });

    iinaGlobal.onMessage("player-creation-failed", (data: GlobalPlayerFailedMessage) => {
      log.error("Failed to create new player instance: " + (data?.error || ""));
      core.osd("Failed to open new window - opening in current window");
      if (data?.url) {
        core.open(data.url);
      }
    });
  }

  return {
    markReplacingPlayback,
    consumeReplacementGuard,
    openInNewInstance,
    openInCurrentWindow,
    flushPendingPlaylistQueue,
    handlePlayMediaList,
    handlePlayMedia,
  };
}
