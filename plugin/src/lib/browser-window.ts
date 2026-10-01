import type { DebugLogger } from "./debug-log";
import type { WebviewBridgeDeps } from "./webview-bridge";
import { registerBridgeHandlers, sendInitialBridgeState } from "./webview-bridge";

export interface BrowserWindowDeps {
  core?: typeof iina.core;
  sidebar?: typeof iina.sidebar;
  standaloneWindow: typeof iina.standaloneWindow;
  preferences: typeof iina.preferences;
  bridgeDeps: WebviewBridgeDeps;
  log: DebugLogger;
}

export function createBrowserWindowManager({ core, sidebar, standaloneWindow, preferences, bridgeDeps, log }: BrowserWindowDeps) {
  function openEmbyStandaloneWindow(): void {
    try {
      log("Creating standalone Emby browser window");

      // Load the React SPA HTML in standalone window
      standaloneWindow.loadFile("build/client/index.html");

      // Restore previously saved window dimensions or use default 520x720
      const savedWidth = preferences.get("standalone_window_width") as number | undefined;
      const savedHeight = preferences.get("standalone_window_height") as number | undefined;
      const width = typeof savedWidth === "number" && savedWidth >= 320 ? savedWidth : 520;
      const height = typeof savedHeight === "number" && savedHeight >= 400 ? savedHeight : 720;

      // setFrame takes (w, h, x, y). Passing null for x and y preserves position
      standaloneWindow.setFrame(width, height, null, null);

      const saWithProps = standaloneWindow as unknown as {
        setProperty?: (props: Record<string, unknown>) => void;
      };
      if (typeof saWithProps.setProperty === "function") {
        saWithProps.setProperty({
          title: "Emby Browser",
          resizable: true,
          hudWindow: true,
          fullSizeContentView: true,
          enableWebInspector: true,
        });
      }

      // Listen for window resize events from the webview to persist size
      standaloneWindow.onMessage("save-window-size", (data?: { width?: number; height?: number }) => {
        if (data?.width && data?.height && data.width >= 320 && data.height >= 400) {
          const w = Math.round(data.width);
          const h = Math.round(data.height);
          preferences.set("standalone_window_width", w);
          preferences.set("standalone_window_height", h);
          preferences.sync();
          log(`Saved standalone window size: ${w}x${h}`);
        }
      });

      // Register bridge handlers with auto-close on media play
      registerBridgeHandlers(standaloneWindow, bridgeDeps, { closeOnPlay: true });

      // Open the window
      standaloneWindow.open();

      // Send window context and initial data after delay
      setTimeout(() => {
        standaloneWindow.postMessage("window-context", { isStandalone: true });
        sendInitialBridgeState(standaloneWindow, bridgeDeps);
      }, 800);

      log("Standalone Emby browser window opened successfully");
      const sessionData = bridgeDeps.getStoredEmbySession();
      if (core) {
        if (sessionData) {
          core.osd(`Emby Browser opened in standalone window\nServer: ${sessionData.serverUrl.replace(/^https?:\/\//, "")}`);
        } else {
          core.osd("Emby Browser opened in standalone window\nPlease login to access your media");
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error(`Failed to create standalone window: ${errorMsg}`);
    }
  }

  function showEmbyBrowser(): void {
    log("Attempting to show Emby browser");

    // The sidebar lives inside the player window, so it is only useful while that
    // window is on screen. sidebar.show() cannot be used to detect that: it only
    // throws while the window has never been loaded, and IINA keeps window.loaded
    // true after the window is closed. Showing it then succeeds silently on an
    // invisible window and the browser appears to do nothing until IINA restarts.
    let windowAvailable = false;
    if (core) {
      try {
        windowAvailable = Boolean(core.window && core.window.loaded && core.window.visible);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`Could not read window state: ${errorMsg}`);
      }
    }

    if (windowAvailable && sidebar && typeof sidebar.show === "function") {
      try {
        sidebar.show();
        log("Sidebar shown successfully");
        return;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`Direct sidebar.show() failed: ${errorMsg}`);
      }
    } else {
      log(`No visible player window (windowAvailable=${windowAvailable}), using standalone`);
    }

    openEmbyStandaloneWindow();
  }

  function initSidebar(): void {
    if (!sidebar) return;
    sidebar.loadFile("build/client/index.html");
    registerBridgeHandlers(sidebar, bridgeDeps);
    setTimeout(() => {
      sidebar.postMessage("window-context", { isStandalone: false });
      sendInitialBridgeState(sidebar, bridgeDeps);
    }, 500);
  }

  return {
    openEmbyStandaloneWindow,
    showEmbyBrowser,
    initSidebar,
  };
}
