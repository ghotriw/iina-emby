import { Alert, Tooltip } from "@mantine/core";
import type { EmbyServer } from "@shared";
import { IconAlertCircle, IconCheck, IconPlus, IconServer, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useIINABridge } from "../hooks/useIINABridge";
import { authenticateByName } from "../lib/emby-auth-client";
import { ConfirmModal } from "./ConfirmModal";
import { IINAEmbyLogo } from "./IINAEmbyLogo";
import styles from "./ServerManagement.module.css";

interface ServerManagementProps {
  onServerSelected?: (serverId: string) => void;
}

export function ServerManagement({ onServerSelected }: ServerManagementProps) {
  const { servers, activeServerId, selectServer, removeServer, saveServer } = useIINABridge();

  const [serverToDelete, setServerToDelete] = useState<EmbyServer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const showForm = isAdding || servers.length === 0;

  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!serverUrl || !username) {
      setError("Server URL and username are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await authenticateByName(serverUrl, username, password);

    setIsLoading(false);

    if (result.success && result.server) {
      saveServer(result.server);
      setIsAdding(false);
      setPassword("");
      if (onServerSelected) {
        onServerSelected(result.server.id);
      }
    } else {
      setError(result.error || "Connection failed");
    }
  };

  const handleSelect = (serverId: string) => {
    selectServer(serverId);
    if (onServerSelected) {
      onServerSelected(serverId);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left sidebar matching IINA welcome window */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarDragRegion} />
        <div className={styles.sidebarContent}>
          <IINAEmbyLogo size={80} />
          <h1 className={styles.sidebarTitle}>IINA</h1>
          <p className={styles.sidebarSubtitle}>Emby Browser</p>
          <span className={styles.sidebarVersion}>v1.0.0</span>
        </div>
      </aside>

      {/* Right content pane */}
      <main className={styles.content}>
        <div className={styles.contentDragRegion} />

        {/* Saved servers section */}
        {servers.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Saved Servers</span>
            </div>

            <div className={styles.serverList}>
              {servers.map((server) => {
                const isActive = server.id === activeServerId;
                return (
                  <button
                    key={server.id}
                    className={`${styles.serverRow} ${isActive ? styles.serverRowActive : ""}`}
                    type="button"
                    tabIndex={0}
                    onClick={() => handleSelect(server.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleSelect(server.id);
                    }}
                  >
                    <div className={styles.serverRowLeft}>
                      <span className={styles.serverRowIcon}>
                        <IconServer size={18} stroke={1.8} />
                      </span>
                      <div className={styles.serverRowDetails}>
                        <div className={styles.serverRowNameRow}>
                          <span className={styles.serverRowName}>{server.serverName || "Emby Server"}</span>
                          {isActive && <span className={styles.activeDot} title="Active Server" />}
                        </div>
                        <span className={styles.serverRowSub}>
                          {server.serverUrl}
                          {server.username ? ` · ${server.username}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className={styles.serverRowActions}>
                      <Tooltip label="Remove server" withArrow>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setServerToDelete(server);
                          }}
                          aria-label="Remove server"
                        >
                          <IconTrash size={17} stroke={1.8} />
                        </button>
                      </Tooltip>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Add server button (placed below saved servers) */}
        {!showForm && servers.length > 0 && (
          <button
            className={styles.actionRow}
            type="button"
            tabIndex={0}
            onClick={() => setIsAdding(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsAdding(true);
            }}
          >
            <div className={styles.actionLeft}>
              <IconPlus size={15} stroke={2.2} />
              <span>Add Another Server...</span>
            </div>
            <span className={styles.shortcutGlyph}>⌘N</span>
          </button>
        )}

        {/* Native macOS Form Sheet/Panel */}
        {showForm && (
          <div className={styles.formPanel}>
            <form onSubmit={handleConnect}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 className={styles.formTitle}>{servers.length === 0 ? "Connect to Emby" : "Add Emby Server"}</h3>

                {error && (
                  <Alert
                    icon={<IconAlertCircle size={15} />}
                    title="Connection Error"
                    color="red"
                    variant="light"
                    styles={{
                      root: {
                        backgroundColor: "rgba(255, 69, 58, 0.12)",
                        borderColor: "rgba(255, 69, 58, 0.3)",
                        padding: "0.375rem 0.625rem",
                        borderRadius: "var(--radius-control)",
                      },
                      message: { fontSize: "var(--font-size-sub)" },
                      title: { fontSize: "var(--font-size-sub)", fontWeight: 600 },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="serverUrl">
                    Server Address
                  </label>
                  <input
                    id="serverUrl"
                    type="url"
                    className={styles.nativeInput}
                    placeholder="http://192.168.1.100:8096"
                    required
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="serverUsername">
                    Username
                  </label>
                  <input
                    id="serverUsername"
                    type="text"
                    className={styles.nativeInput}
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="serverPassword">
                    Password
                  </label>
                  <input
                    id="serverPassword"
                    type="password"
                    className={styles.nativeInput}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formActions}>
                  {servers.length > 0 && (
                    <button type="button" className={styles.macCancelBtn} onClick={() => setIsAdding(false)} disabled={isLoading}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" className={styles.macPrimaryBtn} disabled={isLoading}>
                    {!isLoading && <IconCheck size={14} />}
                    {isLoading ? "Connecting..." : "Connect"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      <ConfirmModal
        opened={serverToDelete !== null}
        onClose={() => setServerToDelete(null)}
        onConfirm={() => {
          if (serverToDelete) {
            removeServer(serverToDelete.id);
            setServerToDelete(null);
          }
        }}
        title="Remove Server"
        message={
          <>
            Are you sure you want to remove{" "}
            <span style={{ fontWeight: 600, color: "var(--macos-text-primary)" }}>{serverToDelete?.serverName || "this server"}</span>? You
            will need to sign in again to reconnect.
          </>
        }
        confirmLabel="Remove"
        confirmColor="red"
      />
    </div>
  );
}
