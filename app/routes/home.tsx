import { IconChevronLeft, IconReload } from "@tabler/icons-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { ContinueWatching } from "../components/ContinueWatching";
import { GlassButton } from "../components/GlassButton";
import { LibraryShelf } from "../components/LibraryShelf";
import { useIINABridge } from "../hooks/useIINABridge";
import { useLibrarySections } from "../hooks/useLibrarySections";
import styles from "./home.module.css";

export function meta() {
  return [{ title: "Home - IINA Emby" }, { name: "description", content: "Emby Media Browser" }];
}

export default function HomeRoute() {
  const navigate = useNavigate();
  const { activeServer, servers, isLoading, playMedia } = useIINABridge();
  const { sections, reload } = useLibrarySections(activeServer);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Wait for IINA bridge to report servers list before redirecting
  if (isLoading) {
    return null;
  }

  // If no server is connected or configured, redirect directly to servers page
  if (servers.length === 0 || !activeServer) {
    return <Navigate to="/servers" replace />;
  }

  const handleBack = () => {
    navigate("/servers");
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top navigation bar on common background */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <GlassButton
            variant="glass"
            shape="circle"
            size="sm"
            isIconOnly
            onClick={handleBack}
            title="Servers"
            aria-label="Back to servers"
          >
            <IconChevronLeft size={18} />
          </GlassButton>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.serverBadge}>
            <span className={styles.activeDot} />
            <span className={styles.serverName}>{activeServer.serverName || "Emby"}</span>
            {activeServer.username && <span className={styles.userName}>({activeServer.username})</span>}
          </div>
        </div>

        <div className={styles.headerRight}>
          <GlassButton
            variant="glass"
            shape="circle"
            size="sm"
            isIconOnly
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
            aria-label="Refresh library"
          >
            <IconReload size={16} className={isRefreshing ? styles.spinning : ""} />
          </GlassButton>
        </div>
      </header>

      {/* Main shelves content */}
      <main className={styles.content}>
        {/* Continue Watching shelf */}
        <ContinueWatching key={refreshKey} server={activeServer} onPlayMedia={playMedia} />

        {/* Library shelves (Movies, TV shows, etc.) */}
        {sections.map(({ view, items }) => (
          <LibraryShelf key={view.Id} view={view} items={items} server={activeServer} />
        ))}
      </main>
    </div>
  );
}
