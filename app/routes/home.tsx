import { Alert } from "@mantine/core";
import { IconAlertCircle, IconChevronLeft, IconReload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { ContinueWatching, type ContinueWatchingHandle } from "../components/ContinueWatching";
import { GlassButton, GlassElement } from "../components/GlassElement";
import { LibraryShelf, LibraryShelfSkeleton } from "../components/LibraryShelf";
import { useIINABridge } from "../hooks/useIINABridge";
import { useLibrarySections } from "../hooks/useLibrarySections";
import styles from "./home.module.css";

export function meta() {
  return [{ title: "Home - IINA Emby" }, { name: "description", content: "Emby Media Browser" }];
}

export default function HomeRoute() {
  const navigate = useNavigate();
  const { activeServer, servers, isLoading, playMedia } = useIINABridge();
  const { sections, isLoading: isSectionsLoading, error: sectionsError, reload } = useLibrarySections(activeServer);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const continueWatchingRef = useRef<ContinueWatchingHandle | null>(null);

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
    try {
      await Promise.allSettled([reload(), continueWatchingRef.current?.refresh()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top navigation bar on common background */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <GlassElement
            variant="glass"
            shape="circle"
            size="sm"
            isIconOnly
            onClick={handleBack}
            title="Servers"
            aria-label="Back to servers"
          >
            <IconChevronLeft size={18} />
          </GlassElement>

          <GlassElement
            as="div"
            variant="glass"
            shape="pill"
            size="sm"
            interactive={false}
            leftSection={<span className={styles.activeDot} />}
            className={styles.serverBadge}
          >
            <span className={styles.serverName}>{activeServer.serverName || "Emby"}</span>
            {activeServer.username && <span className={styles.userName}>({activeServer.username})</span>}
          </GlassElement>
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
        <ContinueWatching ref={continueWatchingRef} server={activeServer} onPlayMedia={playMedia} />

        {sectionsError && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error loading libraries" color="red" variant="light" mb="md" mx="1.5rem">
            {sectionsError.message}
          </Alert>
        )}

        {/* Library shelves (Movies, TV shows, etc.) */}
        {sections.length === 0 && isSectionsLoading ? (
          <>
            <LibraryShelfSkeleton shelfId="init-1" titleWidth={100} />
            <LibraryShelfSkeleton shelfId="init-2" titleWidth={120} />
          </>
        ) : (
          sections.map(({ view, items, isLoading: isShelfLoading }) => (
            <LibraryShelf key={view.Id} view={view} items={items} server={activeServer} isLoading={isShelfLoading} />
          ))
        )}
      </main>
    </div>
  );
}
