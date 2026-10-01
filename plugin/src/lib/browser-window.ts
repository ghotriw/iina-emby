import type { DebugLogger } from "./debug-log";
import type { WebviewBridgeDeps } from "./webview-bridge";
import { registerBridgeHandlers, sendInitialBridgeState } from "./webview-bridge";

export interface BrowserWindowDeps {
  core: typeof iina.core;
  sidebar?: typeof iina.sidebar;
  standaloneWindow: typeof iina.standaloneWindow;
  bridgeDeps: WebviewBridgeDeps;
  log: DebugLogger;
}

export function createBrowserWindowManager({ core, sidebar, standaloneWindow, bridgeDeps, log }: BrowserWindowDeps) {
  function openEmbyStandaloneWindow(): void {
    try {
      log("Creating standalone Emby browser window");

      // Load the React SPA HTML in standalone window
      standaloneWindow.loadFile("build/client/index.html");

      // Set window properties. setFrame takes four numbers (width, height, x, y)
      // and setProperty a single object; anything else is silently ignored.
      standaloneWindow.setFrame(400, 600, 100, 100);
      const saWithProps = standaloneWindow as unknown as {
        setProperty?: (props: Record<string, unknown>) => void;
      };
      if (typeof saWithProps.setProperty === "function") {
        saWithProps.setProperty({
          title: "Emby Browser",
          resizable: true,
          enableWebInspector: true,
        });
      }

      // Register bridge handlers with auto-close on media play
      registerBridgeHandlers(standaloneWindow, bridgeDeps, { closeOnPlay: true });

      // Open the window
      standaloneWindow.open();

      // Send initial data after delay
      setTimeout(() => {
        sendInitialBridgeState(standaloneWindow, bridgeDeps);
      }, 1000);

      log("Standalone Emby browser window opened successfully");
      const sessionData = bridgeDeps.getStoredEmbySession();
      if (sessionData) {
        core.osd(`Emby Browser opened in standalone window\nServer: ${sessionData.serverUrl.replace(/^https?:\/\//, "")}`);
      } else {
        core.osd("Emby Browser opened in standalone window\nPlease login to access your media");
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
    try {
      windowAvailable = Boolean(core.window && core.window.loaded && core.window.visible);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`Could not read window state: ${errorMsg}`);
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
      sendInitialBridgeState(sidebar, bridgeDeps);
    }, 500);
  }

  return {
    showEmbyBrowser,
    openEmbyStandaloneWindow,
    initSidebar,
  };
}
