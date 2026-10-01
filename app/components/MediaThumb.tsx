import React, { useState } from "react";
import { IconMovie, IconPlayerPlay } from "@tabler/icons-react";
import { formatDuration, formatTimeProgress, ticksToSeconds } from "@shared";
import classes from "./MediaThumb.module.css";

export interface MediaThumbProps {
  /** Primary title (e.g. series name or movie name) */
  title: string;
  /** Secondary subtitle (e.g. "S02 - E02 - A Bear in the Wolf's Clothing") */
  subtitle?: string;
  /** Image preview URL (poster / backdrop / episode thumb) */
  imageUrl?: string;
  /** Playback position in ticks (Emby UserData.PlaybackPositionTicks) */
  playbackPositionTicks?: number | null;
  /** Total runtime in ticks (Emby RunTimeTicks) */
  runTimeTicks?: number | null;
  /** Explicit playback position in seconds (optional alternative to ticks) */
  playbackPositionSeconds?: number | null;
  /** Explicit total runtime in seconds (optional alternative to ticks) */
  totalDurationSeconds?: number | null;
  /** Custom aspect ratio, defaults to 16/9 */
  aspectRatio?: number;
  /** Custom container width (e.g. 260 or "100%") */
  width?: number | string;
  /** Custom className */
  className?: string;
  /** Play or click callback */
  onPlay?: () => void;
  onClick?: () => void;
}

export function MediaThumb({
  title,
  subtitle,
  imageUrl,
  playbackPositionTicks,
  runTimeTicks,
  playbackPositionSeconds,
  totalDurationSeconds,
  aspectRatio = 16 / 9,
  width,
  className,
  onPlay,
  onClick,
}: MediaThumbProps) {
  const [imageError, setImageError] = useState(false);

  const currentSec =
    typeof playbackPositionSeconds === "number"
      ? playbackPositionSeconds
      : ticksToSeconds(playbackPositionTicks);

  const totalSec =
    typeof totalDurationSeconds === "number"
      ? totalDurationSeconds
      : ticksToSeconds(runTimeTicks);

  const hasProgress = totalSec > 0 && currentSec > 0;
  const progressPercent = hasProgress
    ? Math.min(100, Math.max(0, (currentSec / totalSec) * 100))
    : 0;

  const timeLabel = hasProgress
    ? formatTimeProgress(currentSec, totalSec)
    : totalSec > 0
      ? formatDuration(totalSec)
      : null;

  const handleClick = () => {
    if (onPlay) {
      onPlay();
    } else if (onClick) {
      onClick();
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
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={title}
            className={classes.image}
            loading="lazy"
            onError={() => setImageError(true)}
          />
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
            <div
              className={classes.progressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
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
