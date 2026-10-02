import { Skeleton } from "@mantine/core";
import {
  type EmbyItemMetadata,
  type EmbyServer,
  formatDuration,
  formatEpisodeSubtitle,
  formatTimeProgress,
  getItemImageUrl,
  type PlayMediaPayload,
  ticksToSeconds,
} from "@shared";
import { IconMovie, IconPlayerPlay } from "@tabler/icons-react";
import { useState } from "react";
import { buildStreamUrl } from "../lib/emby-library-client";
import classes from "./MediaThumb.module.css";

export function MediaThumbSkeleton({ className }: { className?: string }) {
  return (
    <div className={`${classes.card} ${className || ""}`} aria-hidden="true">
      <div className={classes.preview}>
        <Skeleton height="100%" radius="var(--radius-card)" />
      </div>
      <div className={classes.meta}>
        <span className={classes.title}>
          <Skeleton width="75%" radius="xs">
            <span>&nbsp;</span>
          </Skeleton>
        </span>
        <span className={classes.subtitle}>
          <Skeleton width="45%" radius="xs">
            <span>&nbsp;</span>
          </Skeleton>
        </span>
      </div>
    </div>
  );
}

export interface MediaThumbProps {
  item: EmbyItemMetadata;
  server: EmbyServer;
  onPlay?: (payload: PlayMediaPayload) => void;
  onClick?: (item: EmbyItemMetadata) => void;
  aspectRatio?: number;
  width?: number | string;
  className?: string;
}

export function MediaThumb({ item, server, onPlay, onClick, aspectRatio = 16 / 9, width, className }: MediaThumbProps) {
  const [imageError, setImageError] = useState(false);

  const isEpisode = item.Type === "Episode";
  const title = isEpisode ? item.SeriesName || item.Name || "Episode" : item.Name || "Movie";
  const subtitle = isEpisode
    ? formatEpisodeSubtitle(item.ParentIndexNumber, item.IndexNumber, item.Name)
    : item.ProductionYear
      ? String(item.ProductionYear)
      : undefined;

  const imageUrl = !imageError
    ? getItemImageUrl(server.serverUrl, item, {
        prefer: "thumb",
        maxWidth: 520,
        maxHeight: 293,
        quality: 85,
        accessToken: server.accessToken,
      })
    : undefined;

  const currentSec = ticksToSeconds(item.UserData?.PlaybackPositionTicks);
  const totalSec = ticksToSeconds(item.RunTimeTicks);

  const hasProgress = totalSec > 0 && currentSec > 0;
  const progressPercent = hasProgress ? Math.min(100, Math.max(0, (currentSec / totalSec) * 100)) : 0;

  const timeLabel = hasProgress ? formatTimeProgress(currentSec, totalSec) : totalSec > 0 ? formatDuration(totalSec) : null;

  const fullPlayTitle = isEpisode
    ? `${item.SeriesName || ""} - ${formatEpisodeSubtitle(item.ParentIndexNumber, item.IndexNumber, item.Name)}`
    : item.Name || "";

  const handleClick = () => {
    if (onPlay) {
      onPlay({
        streamUrl: buildStreamUrl(server, item.Id),
        title: fullPlayTitle,
        startPositionTicks: item.UserData?.PlaybackPositionTicks,
      });
    } else if (onClick) {
      onClick(item);
    }
  };

  return (
    <button
      type="button"
      className={`${classes.card} ${className || ""}`}
      style={{ width: width || "100%" }}
      onClick={handleClick}
      title={subtitle ? `${title} • ${subtitle}` : title}
    >
      <div className={classes.preview} style={{ aspectRatio }}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className={classes.image} loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className={classes.placeholder}>
            <IconMovie size={38} stroke={1.5} />
          </div>
        )}

        {/* Hover play button */}
        <div className={classes.hoverOverlay}>
          <div className={classes.playButton}>
            <IconPlayerPlay size={20} fill="currentColor" stroke={0} />
          </div>
        </div>

        {/* Scrim gradient & time overlay */}
        {timeLabel && (
          <>
            <div className={classes.scrim} />
            <div className={classes.timeOverlay}>
              <span className={classes.timeText}>{timeLabel}</span>
            </div>
          </>
        )}

        {/* White progress bar at the bottom */}
        {hasProgress && (
          <div className={classes.progressBarTrack}>
            <div className={classes.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Title & subtitle below preview */}
      <div className={classes.meta}>
        <div className={classes.title}>{title}</div>
        {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
      </div>
    </button>
  );
}
