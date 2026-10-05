import type { EmbyServer } from "@shared";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";
import { authenticateByName } from "../lib/emby-auth-client";
import styles from "./ServerConnectForm.module.css";
import { Alert } from "./ui";

export interface ServerConnectFormProps {
  isFirstServer?: boolean;
  initialServer?: EmbyServer | null;
  onSuccess: (server: EmbyServer) => void;
  onCancel?: () => void;
}

export function ServerConnectForm({ isFirstServer = false, initialServer, onSuccess, onCancel }: ServerConnectFormProps) {
  const [serverUrl, setServerUrl] = useState(initialServer?.serverUrl ?? "");
  const [username, setUsername] = useState(initialServer?.username ?? "");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialServer) {
      setServerUrl(initialServer.serverUrl);
      setUsername(initialServer.username);
      setPassword("");
      setError(null);
    } else {
      setServerUrl("");
      setUsername("");
      setPassword("");
      setError(null);
    }
  }, [initialServer]);

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
      setPassword("");
      const serverToSave: EmbyServer = initialServer
        ? {
            ...result.server,
            id: initialServer.id,
            addedAt: initialServer.addedAt ?? result.server.addedAt,
            updatedAt: Date.now(),
          }
        : result.server;
      onSuccess(serverToSave);
    } else {
      setError(result.error || "Connection failed");
    }
  };

  const formTitle = initialServer ? "Edit Emby Server" : isFirstServer ? "Connect to Emby" : "Add Emby Server";

  const submitLabel = isLoading ? (initialServer ? "Saving..." : "Connecting...") : initialServer ? "Save Changes" : "Connect";

  return (
    <div className={styles.formPanel}>
      <form onSubmit={handleConnect}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 className={styles.formTitle}>{formTitle}</h3>

          {error && (
            <Alert
              icon={<IconAlertCircle size={15} />}
              title="Connection Error"
              styles={{
                root: {
                  backgroundColor: "var(--danger-bg)",
                  borderColor: "var(--danger-border)",
                  padding: "0.375rem 0.625rem",
                  borderRadius: "var(--radius-m)",
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
            {onCancel && (
              <button type="button" className={styles.macCancelBtn} onClick={onCancel} disabled={isLoading}>
                Cancel
              </button>
            )}
            <button type="submit" className={styles.macPrimaryBtn} disabled={isLoading}>
              {!isLoading && <IconCheck size={14} />}
              {submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
