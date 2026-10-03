import type { EmbySystemInfo } from "@shared";
import { IconAlertCircle, IconArrowUpCircle, IconCheck, IconDeviceDesktop, IconServer, IconUser } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "~/components/ui";
import { useIINABridge } from "~/hooks/useIINABridge";
import { fetchServerSystemInfo } from "~/lib/emby-library-client";
import styles from "./SystemInfo.module.css";
import { SystemInfoRow } from "./SystemInfoRow";
import { Button } from "./ui/Button";

export function SystemInfo() {
  const { activeServer } = useIINABridge();

  const [systemInfo, setSystemInfo] = useState<EmbySystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(
    async (bypassCache = false) => {
      if (!activeServer) {
        setIsLoading(false);
        return;
      }

      setError(null);
      try {
        const info = await fetchServerSystemInfo(activeServer, undefined, bypassCache);
        console.log(info);
        setSystemInfo(info);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeServer],
  );

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInfo(true);
  };

  return (
    <>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to load server info" mb="md">
          {error}
        </Alert>
      )}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Server</h2>

        <div className={styles.card}>
          <SystemInfoRow
            icon={<IconServer size={18} />}
            label="Server Name"
            loading={isLoading}
            value={systemInfo?.ServerName || activeServer?.serverName || "Emby Server"}
          />

          <SystemInfoRow
            icon={<IconServer size={18} />}
            label="Server Version"
            loading={isLoading}
            skeletonWidth="35%"
            value={systemInfo?.Version || "Unknown"}
          >
            {systemInfo?.HasUpdateAvailable ? (
              <span className={`${styles.badge} ${styles.badgeWarning}`}>
                <IconArrowUpCircle size={13} />
                Update available
              </span>
            ) : systemInfo?.Version ? (
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                <IconCheck size={13} />
                Up to date
              </span>
            ) : null}
          </SystemInfoRow>

          {(isLoading || systemInfo?.OperatingSystem) && (
            <SystemInfoRow
              icon={<IconDeviceDesktop size={18} />}
              label="Operating System"
              loading={isLoading}
              skeletonWidth="40%"
              value={systemInfo?.OperatingSystem}
            />
          )}

          <SystemInfoRow icon={<IconUser size={18} />} label="User" value={activeServer?.username || "—"} />

          <SystemInfoRow label="URL" value={activeServer?.serverUrl || "—"} title={activeServer?.serverUrl} />
        </div>
      </section>

      <Button onClick={handleRefresh} glyph="⌘R">
        Refresh
      </Button>
    </>
  );
}
