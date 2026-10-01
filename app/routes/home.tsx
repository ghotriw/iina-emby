import { Button } from "@mantine/core";
import { IconServer } from "@tabler/icons-react";
import { Navigate, useNavigate } from "react-router";
import { ContinueWatching } from "../components/ContinueWatching";
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
  const { sections } = useLibrarySections(activeServer);

  // Wait for IINA bridge to report servers list before redirecting
  if (isLoading) {
    return null;
  }

  // If no server is connected or configured, redirect directly to servers page
  if (servers.length === 0 || !activeServer) {
    return <Navigate to="/servers" replace />;
  }

  return (
    <div className={styles.container}>
      {/* Native macOS toolbar header */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.serverBadge}>
            <span className={styles.activeDot} />
            <span className={styles.serverName}>{activeServer.serverName || "Emby"}</span>
            {activeServer.username && (
              <span className={styles.userName}>({activeServer.username})</span>
            )}
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconServer size={14} />}
            onClick={() => navigate("/servers")}
            className={styles.switchServerBtn}
          >
            Switch Server
          </Button>
        </div>
      </header>

      {/* Main shelves content */}
      <main className={styles.content}>
        {/* 1. Continue Watching shelf */}
        <ContinueWatching server={activeServer} onPlayMedia={playMedia} />

        {/* 2. Library shelves (Movies, TV shows, etc.) */}
        {sections.map(({ view, items }) => (
          <LibraryShelf
            key={view.Id}
            view={view}
            items={items}
            server={activeServer}
          />
        ))}
      </main>
    </div>
  );
}
