import { IconAlertCircle } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { ContinueWatching, type ContinueWatchingHandle } from "../components/ContinueWatching";
import { LibraryShelf, LibraryShelfSkeleton } from "../components/LibraryShelf";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/ui";
import { useIINABridge, useOnPlaybackProgressUpdated, useOnWindowReopen } from "../hooks/useIINABridge";
import { useLibrarySections } from "../hooks/useLibrarySections";
import { clearLibraryCache } from "../lib/emby-library-client";
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

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    clearLibraryCache();
    try {
      await Promise.allSettled([reload(), continueWatchingRef.current?.refresh()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useOnWindowReopen(() => {
    handleRefresh();
  });

  // Automatically refresh continue watching when player updates progress to Emby
  useOnPlaybackProgressUpdated(() => {
    continueWatchingRef.current?.refresh();
  });

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

  return (
    <div className={styles.container}>
      <PageHeader
        onBack={handleBack}
        backTitle="Servers"
        title={activeServer.serverName || "Emby"}
        showActiveDot
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main shelves content */}
      <main className={styles.content}>
        {/* Continue Watching shelf */}
        <ContinueWatching ref={continueWatchingRef} server={activeServer} onPlayMedia={playMedia} />

        {sectionsError && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error loading libraries" mb="md" mx="1.5rem">
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
            <LibraryShelf
              key={view.Id}
              view={view}
              items={items}
              server={activeServer}
              isLoading={isShelfLoading}
              onIdentifySuccess={() => reload()}
            />
          ))
        )}
      </main>
    </div>
  );
}
