import { Skeleton } from "./Skeleton";
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
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { buildStreamUrl } from "../lib/emby-library-client";
import glassStyles from "./GlassElement.module.css";
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
  title?: string;
  subtitle?: string;
  subtitleLines?: number;
}

export function MediaThumb({
  item,
  server,
  onPlay,
  onClick,
  aspectRatio = 16 / 9,
  width,
  className,
  title: customTitle,
  subtitle: customSubtitle,
  subtitleLines,
}: MediaThumbProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const isEpisode = item.Type === "Episode";
  const defaultTitle = isEpisode ? item.SeriesName || item.Name || "Episode" : item.Name || "Movie";
  const title = customTitle ?? defaultTitle;

  const defaultSubtitle = isEpisode
    ? formatEpisodeSubtitle(item.ParentIndexNumber, item.IndexNumber, item.Name)
    : item.ProductionYear
      ? String(item.ProductionYear)
      : undefined;
  const subtitle = customSubtitle !== undefined ? customSubtitle : defaultSubtitle;

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

  const fullPlayTitle = customTitle
    ? customTitle
    : isEpisode
      ? `${item.SeriesName || ""} - ${formatEpisodeSubtitle(item.ParentIndexNumber, item.IndexNumber, item.Name)}`
      : item.Name || "";

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay({
        streamUrl: buildStreamUrl(server, item.Id),
        title: fullPlayTitle,
        startPositionTicks: item.UserData?.PlaybackPositionTicks,
      });
    }
  };

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(item);
      return;
    }
    const targetId = item.Type === "Episode" && item.SeriesId ? item.SeriesId : item.Id;
    navigate(`/item/${targetId}`, {
      state: targetId === item.Id ? { item } : undefined,
    });
  };

  return (
    <div className={`${classes.card} ${className || ""}`} style={{ width: width || "100%" }}>
      <button
        type="button"
        className={classes.preview}
        style={{ aspectRatio }}
        onClick={handlePlayClick}
        aria-label={`Play ${fullPlayTitle}`}
        title={`Play ${fullPlayTitle}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className={classes.image} loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className={classes.placeholder}>
            <IconMovie size={38} stroke={1.5} />
          </div>
        )}

        {/* Hover play button with liquid glass effect */}
        <div className={classes.hoverOverlay} aria-hidden="true">
          <span className={`${glassStyles.button} ${glassStyles.variantGlass} ${glassStyles.shapeCircle} ${glassStyles.iconLg}`}>
            <span className={glassStyles.lens} />
            <span className={glassStyles.content}>
              <IconPlayerPlay size={22} fill="currentColor" stroke={0} />
            </span>
          </span>
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
      </button>

      {/* Title & subtitle below preview */}
      <button
        type="button"
        className={classes.meta}
        onClick={handleDetailClick}
        aria-label={`View details for ${title}`}
        title={subtitle ? `${title} • ${subtitle}` : title}
      >
        <div className={classes.title}>{title}</div>
        {subtitle && (
          <div
            className={`${classes.subtitle} ${subtitleLines ? classes.subtitleClamped : ""}`}
            style={subtitleLines ? { WebkitLineClamp: subtitleLines } : undefined}
          >
            {subtitle}
          </div>
        )}
      </button>
    </div>
  );
}
