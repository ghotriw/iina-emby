import type { EmbyItemMetadata, EmbyServer } from "@shared";
import { getItemImageUrl } from "@shared";
import { IconCheck, IconMovie } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import classes from "./MediaPoster.module.css";
import { Skeleton } from "./Skeleton";

export function MediaPosterSkeleton({ className }: { className?: string }) {
  return (
    <div className={`${classes.card} ${className || ""}`} aria-hidden="true">
      <div className={classes.posterWrapper}>
        <Skeleton height="100%" radius="var(--radius-l)" />
      </div>
      <div className={classes.meta}>
        <span className={classes.title}>
          <Skeleton width="80%" radius="xs">
            <span>&nbsp;</span>
          </Skeleton>
        </span>
        <span className={classes.year}>
          <Skeleton width="40%" radius="xs">
            <span>&nbsp;</span>
          </Skeleton>
        </span>
      </div>
    </div>
  );
}

export interface MediaPosterProps {
  item: EmbyItemMetadata;
  server: EmbyServer;
  onClick?: (item: EmbyItemMetadata) => void;
  className?: string;
}

export function MediaPoster({ item, server, onClick, className }: MediaPosterProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const imageUrl = !imgError
    ? getItemImageUrl(server.serverUrl, item, {
        prefer: "primary",
        maxWidth: 280,
        maxHeight: 420,
        quality: 85,
        accessToken: server.accessToken,
      })
    : undefined;

  const rating = typeof item.CommunityRating === "number" && item.CommunityRating > 0 ? item.CommunityRating.toFixed(1) : null;

  const unplayedCount = item.UserData?.UnplayedItemCount && item.UserData.UnplayedItemCount > 0 ? item.UserData.UnplayedItemCount : null;
  const isPlayed = Boolean(item.UserData?.Played);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(item);
      return;
    }
    navigate(`/item/${item.Id}`, { state: { item } });
  };

  return (
    <button
      type="button"
      className={`${classes.card} ${className || ""}`}
      onClick={handleClick}
      aria-label={`View ${item.Name || "Media"}`}
    >
      <div className={classes.posterWrapper}>
        {imageUrl ? (
          <img src={imageUrl} alt={item.Name || "Media"} className={classes.image} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className={classes.placeholder}>
            <IconMovie size={36} />
          </div>
        )}

        {/* Top-Right: Unplayed Episode Count for Series OR Played Checkmark */}
        {unplayedCount !== null ? (
          <div className={classes.unplayedBadge} title={`${unplayedCount} unplayed episodes`}>
            {unplayedCount}
          </div>
        ) : isPlayed ? (
          <div className={classes.playedBadge} title="Played">
            <IconCheck size={14} stroke={2.5} />
          </div>
        ) : null}

        {/* Bottom-Right: Community Rating */}
        {rating !== null && (
          <div className={classes.ratingBadge} title={`Rating: ${rating}`}>
            {rating}
          </div>
        )}
      </div>

      <div className={classes.meta}>
        <span className={classes.title} title={item.Name}>
          {item.Name || "Untitled"}
        </span>
        {item.ProductionYear ? <span className={classes.year}>{item.ProductionYear}</span> : null}
      </div>
    </button>
  );
}
