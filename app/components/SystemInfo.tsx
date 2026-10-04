import type { EmbySystemInfo, EmbyUser } from "@shared";
import {
  IconAlertCircle,
  IconArrowUpCircle,
  IconCheck,
  IconDeviceDesktop,
  IconFolder,
  IconLock,
  IconNetwork,
  IconPlayerPlay,
  IconServer,
  IconShieldCheck,
  IconSubtask,
  IconUser,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "~/components/ui";
import { useIINABridge } from "~/hooks/useIINABridge";
import { fetchCurrentUser } from "~/lib/emby-auth-client";
import { fetchServerSystemInfo } from "~/lib/emby-library-client";
import styles from "./SystemInfo.module.css";
import { SystemInfoRow } from "./SystemInfoRow";
import { Button } from "./ui/Button";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function SystemInfo() {
  const { activeServer } = useIINABridge();

  const [systemInfo, setSystemInfo] = useState<EmbySystemInfo | null>(null);
  const [userInfo, setUserInfo] = useState<EmbyUser | null>(activeServer?.user || null);
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
        const [sysInfo, fetchedUser] = await Promise.all([
          fetchServerSystemInfo(activeServer, undefined, bypassCache),
          fetchCurrentUser(activeServer),
        ]);

        setSystemInfo(sysInfo);
        if (fetchedUser) {
          setUserInfo(fetchedUser);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken],
  );

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInfo(true);
  };

  const isAdministrator = Boolean(userInfo?.Policy?.IsAdministrator);
  const canDelete = Boolean(userInfo?.Policy?.EnableContentDeletion);
  const canDownload = Boolean(userInfo?.Policy?.EnableContentDownloading);
  const canTranscode = Boolean(
    userInfo?.Policy?.EnableVideoPlaybackTranscoding || userInfo?.Policy?.EnableAudioPlaybackTranscoding,
  );
  const autoPlayNext = userInfo?.Configuration?.EnableNextEpisodeAutoPlay;
  const subtitleMode = userInfo?.Configuration?.SubtitleMode;
  const introSkip = userInfo?.Configuration?.IntroSkipMode;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to load server info" mb="md">
          {error}
        </Alert>
      )}

      {/* 1. Server Details */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Server Information</h2>

        <div className={styles.card}>
          <SystemInfoRow
            icon={<IconServer size={18} />}
            label="Server Name"
            loading={isLoading}
            value={systemInfo?.ServerName || activeServer?.serverName || "Emby Server"}
          />

          <SystemInfoRow
            icon={<IconServer size={18} />}
            label="Version"
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

          {(isLoading || systemInfo?.OperatingSystem || systemInfo?.OperatingSystemDisplayName) && (
            <SystemInfoRow
              icon={<IconDeviceDesktop size={18} />}
              label="Operating System"
              loading={isLoading}
              skeletonWidth="40%"
              value={
                systemInfo?.OperatingSystemDisplayName && systemInfo.OperatingSystemDisplayName !== systemInfo.OperatingSystem
                  ? `${systemInfo.OperatingSystem} (${systemInfo.OperatingSystemDisplayName})`
                  : systemInfo?.OperatingSystem || "—"
              }
            />
          )}

          {systemInfo?.ProgramDataPath && (
            <SystemInfoRow
              icon={<IconFolder size={18} />}
              label="Data Path"
              loading={isLoading}
              value={systemInfo.ProgramDataPath}
              title={systemInfo.ProgramDataPath}
            />
          )}

          {systemInfo?.TranscodingTempPath && (
            <SystemInfoRow
              icon={<IconFolder size={18} />}
              label="Transcoding Path"
              loading={isLoading}
              value={systemInfo.TranscodingTempPath}
              title={systemInfo.TranscodingTempPath}
            />
          )}
        </div>
      </section>

      {/* 2. Network & Endpoints */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Network & Connectivity</h2>

        <div className={styles.card}>
          <SystemInfoRow
            icon={<IconNetwork size={18} />}
            label="Connected URL"
            value={activeServer?.serverUrl || "—"}
            title={activeServer?.serverUrl}
          />

          {(isLoading || systemInfo?.LocalAddress) && (
            <SystemInfoRow
              label="Local Address"
              loading={isLoading}
              value={systemInfo?.LocalAddress || "—"}
              title={systemInfo?.LocalAddress}
            />
          )}

          {(isLoading || systemInfo?.WanAddress) && (
            <SystemInfoRow
              label="WAN Address"
              loading={isLoading}
              value={systemInfo?.WanAddress || "—"}
              title={systemInfo?.WanAddress}
            />
          )}

          {systemInfo?.WebSocketPortNumber && (
            <SystemInfoRow
              label="WebSocket Port"
              loading={isLoading}
              value={String(systemInfo.WebSocketPortNumber)}
            />
          )}
        </div>
      </section>

      {/* 3. User & Permissions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>User Account & Privileges</h2>

        <div className={styles.card}>
          <SystemInfoRow
            icon={<IconUser size={18} />}
            label="Username"
            loading={isLoading && !userInfo}
            value={userInfo?.Name || activeServer?.username || "—"}
          >
            {isAdministrator ? (
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                <IconShieldCheck size={13} />
                Admin
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeInfo}`}>User</span>
            )}
          </SystemInfoRow>

          <SystemInfoRow
            icon={<IconLock size={18} />}
            label="Administrative Role"
            loading={isLoading && !userInfo}
            value={isAdministrator ? "Full Administrator" : "Standard User"}
          />

          <SystemInfoRow
            label="Media Permissions"
            loading={isLoading && !userInfo}
            value={
              isAdministrator
                ? "Full Manage & Delete Access"
                : canDelete
                  ? "Allowed to Delete Media"
                  : canDownload
                    ? "Download & Playback"
                    : "Playback Only"
            }
          />

          <SystemInfoRow
            label="Transcoding"
            loading={isLoading && !userInfo}
            value={canTranscode ? "Enabled" : "Direct Play Only"}
          />

          {userInfo?.DateCreated && (
            <SystemInfoRow
              label="Account Created"
              loading={isLoading && !userInfo}
              value={formatDate(userInfo.DateCreated)}
            />
          )}

          {userInfo?.LastActivityDate && (
            <SystemInfoRow
              label="Last Activity"
              loading={isLoading && !userInfo}
              value={formatDate(userInfo.LastActivityDate)}
            />
          )}
        </div>
      </section>

      {/* 4. Playback & Library Preferences */}
      {(userInfo?.Configuration || isLoading) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Emby User Preferences</h2>

          <div className={styles.card}>
            <SystemInfoRow
              icon={<IconPlayerPlay size={18} />}
              label="Auto Play Next Episode"
              loading={isLoading && !userInfo}
              value={autoPlayNext !== undefined ? (autoPlayNext ? "Enabled" : "Disabled") : "—"}
            />

            {subtitleMode && (
              <SystemInfoRow
                icon={<IconSubtask size={18} />}
                label="Subtitle Mode"
                loading={isLoading && !userInfo}
                value={subtitleMode}
              />
            )}

            {introSkip && (
              <SystemInfoRow
                label="Intro Skip Mode"
                loading={isLoading && !userInfo}
                value={introSkip}
              />
            )}

            {userInfo?.Configuration?.ResumeRewindSeconds !== undefined && (
              <SystemInfoRow
                label="Resume Rewind"
                loading={isLoading && !userInfo}
                value={`${userInfo.Configuration.ResumeRewindSeconds}s`}
              />
            )}
          </div>
        </section>
      )}

      <div>
        <Button onClick={handleRefresh} glyph="⌘R" disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
