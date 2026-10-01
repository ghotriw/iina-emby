import type { EmbyServer, PlayMediaPayload, TypedIinaBridge } from "@shared";
import { useCallback, useEffect, useState } from "react";
import { setClientIdentity } from "../lib/emby-auth-client";

declare global {
  interface Window {
    iina?: TypedIinaBridge;
  }
}

const LOCAL_STORAGE_SERVERS_KEY = "emby_saved_servers";
const LOCAL_STORAGE_ACTIVE_KEY = "emby_active_server_id";

export function useIINABridge() {
  const [servers, setServers] = useState<EmbyServer[]>(() => {
    if (typeof window !== "undefined" && window?.iina?.postMessage) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_SERVERS_KEY);
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_KEY);
      } catch {
        // Ignore
      }
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
    if (typeof window !== "undefined" && window?.iina?.postMessage) {
      return null;
    }
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
  });

  const [isIinaAvailable, setIsIinaAvailable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

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
    const hasIina = typeof window !== "undefined" && Boolean(window?.iina?.postMessage);
    setIsIinaAvailable(hasIina);

    if (hasIina && window.iina) {
      window.iina.onMessage("window-context", (data) => {
        if (data && typeof data.isStandalone === "boolean") {
          setIsStandalone(data.isStandalone);
        }
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
      });

      window.iina.onMessage("servers-updated", (data) => {
        if (data && Array.isArray(data.servers)) {
          setServers(data.servers);
          if (data.activeServerId !== undefined) {
            setActiveServerId(data.activeServerId);
          }
        }
      });

      // Request identity and servers list on mount
      window.iina.postMessage("get-client-identity");
      window.iina.postMessage("get-servers");
    }
  }, []);

  // Persist standalone window size changes
  useEffect(() => {
    if (!isIinaAvailable || !isStandalone || typeof window === "undefined") {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width >= 320 && height >= 400 && window.iina?.postMessage) {
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

  return {
    servers,
    activeServer,
    activeServerId,
    isIinaAvailable,
    isStandalone,
    saveServer,
    selectServer,
    removeServer,
    playMedia,
  };
}
