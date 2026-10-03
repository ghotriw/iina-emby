import { type EmbyServer, type PlayMediaPayload, type TypedIinaBridge, WINDOW_DIMENSIONS } from "@shared";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { setClientIdentity } from "../lib/emby-auth-client";

declare global {
  interface Window {
    iina?: TypedIinaBridge;
  }
}

const LOCAL_STORAGE_SERVERS_KEY = "emby_saved_servers";
const LOCAL_STORAGE_ACTIVE_KEY = "emby_active_server_id";

export interface IINABridgeContextType {
  servers: EmbyServer[];
  activeServer: EmbyServer | null;
  activeServerId: string | null;
  isIinaAvailable: boolean;
  isStandalone: boolean;
  isLoading: boolean;
  reopenCount: number;
  progressUpdateCount: number;
  saveServer: (server: EmbyServer) => void;
  selectServer: (serverId: string) => void;
  removeServer: (serverId: string) => void;
  playMedia: (payload: PlayMediaPayload) => void;
}

const IINABridgeContext = createContext<IINABridgeContextType | null>(null);

export function IINABridgeProvider({ children }: { children: React.ReactNode }) {
  const hasIina = typeof window !== "undefined" && Boolean(window?.iina?.postMessage);

  const [servers, setServers] = useState<EmbyServer[]>(() => {
    if (hasIina) {
      return [];
    }
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SERVERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeServerId, setActiveServerId] = useState<string | null>(() => {
    if (hasIina) {
      return null;
    }
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
  });

  const [isIinaAvailable, setIsIinaAvailable] = useState<boolean>(hasIina);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => typeof window !== "undefined" && window.innerWidth >= 450);
  const [isLoading, setIsLoading] = useState<boolean>(hasIina);
  const [reopenCount, setReopenCount] = useState<number>(0);
  const [progressUpdateCount, setProgressUpdateCount] = useState<number>(0);

  // Standalone web dev fallback: synchronize servers and active server ID to localStorage only when NOT in IINA
  useEffect(() => {
    if (isIinaAvailable) {
      return;
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_SERVERS_KEY, JSON.stringify(servers));
      if (activeServerId) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, activeServerId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_KEY);
      }
    } catch {
      // Ignore storage quota or disabled localStorage errors
    }
  }, [servers, activeServerId, isIinaAvailable]);

  // Setup IINA bridge listeners on mount
  useEffect(() => {
    setIsIinaAvailable(hasIina);

    if (hasIina && window.iina) {
      window.iina.onMessage("window-context", (data) => {
        if (data && typeof data.isStandalone === "boolean") {
          setIsStandalone(data.isStandalone);
        }
      });

      window.iina.onMessage("window-reopened", () => {
        setReopenCount((prev) => prev + 1);
      });

      window.iina.onMessage("client-identity", (identity) => {
        if (identity) {
          setClientIdentity(identity);
        }
      });

      window.iina.onMessage("servers-list", (data) => {
        if (data && Array.isArray(data.servers)) {
          setServers(data.servers);
          setActiveServerId(data.activeServerId || (data.servers[0]?.id ?? null));
        }
        setIsLoading(false);
      });

      window.iina.onMessage("servers-updated", (data) => {
        if (data && Array.isArray(data.servers)) {
          setServers(data.servers);
          if (data.activeServerId !== undefined) {
            setActiveServerId(data.activeServerId);
          }
        }
        setIsLoading(false);
      });

      window.iina.onMessage("session-available", (data) => {
        if (data?.serverId) {
          const nextId = data.serverId;
          setActiveServerId((prevId) => {
            if (prevId !== nextId) {
              window.iina?.postMessage("get-servers");
              return nextId;
            }
            return prevId;
          });
        }
      });

      window.iina.onMessage("session-cleared", () => {
        setServers([]);
        setActiveServerId(null);
        setIsLoading(false);
      });

      window.iina.onMessage("playback-progress-updated", () => {
        setProgressUpdateCount((prev) => prev + 1);
      });

      // Request window context, identity, and servers list on mount
      window.iina.postMessage("get-window-context");
      window.iina.postMessage("get-client-identity");
      window.iina.postMessage("get-servers");

      // Timeout fallback to stop loading state if IINA takes too long
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    setIsLoading(false);
  }, [hasIina]);

  // Persist standalone window size changes
  useEffect(() => {
    if (!isIinaAvailable || !isStandalone || typeof window === "undefined") {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const width = window.outerWidth || window.innerWidth;
        const height = window.outerHeight || window.innerHeight;
        if (
          width >= WINDOW_DIMENSIONS.MIN_WIDTH &&
          height >= WINDOW_DIMENSIONS.MIN_HEIGHT &&
          window.iina?.postMessage
        ) {
          window.iina.postMessage("save-window-size", { width, height });
        }
      }, 500);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isIinaAvailable, isStandalone]);

  const saveServer = useCallback((server: EmbyServer) => {
    setServers((prev) => {
      const idx = prev.findIndex((s) => s.id === server.id || s.serverUrl === server.serverUrl);
      return idx >= 0 ? [...prev.slice(0, idx), server, ...prev.slice(idx + 1)] : [...prev, server];
    });
    setActiveServerId(server.id);

    if (window?.iina?.postMessage) {
      window.iina.postMessage("store-session", {
        serverUrl: server.serverUrl,
        accessToken: server.accessToken,
        serverName: server.serverName,
        userId: server.userId,
        username: server.username,
      });
    }
  }, []);

  const selectServer = useCallback((serverId: string) => {
    setActiveServerId(serverId);
    if (window?.iina?.postMessage) {
      window.iina.postMessage("switch-server", { serverId });
    }
  }, []);

  const removeServer = useCallback((serverId: string) => {
    setServers((prev) => {
      const updated = prev.filter((s) => s.id !== serverId);
      setActiveServerId((prevActive) => (prevActive === serverId ? (updated[0]?.id ?? null) : prevActive));
      return updated;
    });

    if (window?.iina?.postMessage) {
      window.iina.postMessage("remove-server", { serverId });
    }
  }, []);

  const playMedia = useCallback((payload: PlayMediaPayload) => {
    if (window?.iina?.postMessage) {
      window.iina.postMessage("play-media", payload);
    } else {
      console.log("[Dev Playback] play-media:", payload);
    }
  }, []);

  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0] || null;

  const value: IINABridgeContextType = {
    servers,
    activeServer,
    activeServerId,
    isIinaAvailable,
    isStandalone,
    isLoading,
    reopenCount,
    progressUpdateCount,
    saveServer,
    selectServer,
    removeServer,
    playMedia,
  };

  return <IINABridgeContext.Provider value={value}>{children}</IINABridgeContext.Provider>;
}

export function useIINABridge(): IINABridgeContextType {
  const context = useContext(IINABridgeContext);
  if (!context) {
    throw new Error("useIINABridge must be used within an IINABridgeProvider");
  }
  return context;
}

export function useOnWindowReopen(callback: () => void) {
  const { reopenCount } = useIINABridge();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    callbackRef.current();
  }, [reopenCount]);
}

export function useOnPlaybackProgressUpdated(callback: () => void) {
  const { progressUpdateCount } = useIINABridge();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    callbackRef.current();
  }, [progressUpdateCount]);
}
