import type { EmbyItemMetadata, EmbyServer } from "@shared";
import { getItemImageUrl } from "@shared";
import { IconMovie } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import classes from "./MediaPoster.module.css";

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
        maxWidth: 320,
        quality: 85,
        accessToken: server.accessToken,
      })
    : undefined;

  const rating =
    typeof item.CommunityRating === "number" && item.CommunityRating > 0
      ? item.CommunityRating.toFixed(1)
      : null;

  const unplayedCount =
    item.UserData?.UnplayedItemCount && item.UserData.UnplayedItemCount > 0
      ? item.UserData.UnplayedItemCount
      : null;

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
          <img
            src={imageUrl}
            alt={item.Name || "Media"}
            className={classes.image}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={classes.placeholder}>
            <IconMovie size={36} />
          </div>
        )}

        {/* Top-Right: Unplayed Episode Count for Series */}
        {unplayedCount !== null && (
          <div className={classes.unplayedBadge} title={`${unplayedCount} unplayed episodes`}>
            {unplayedCount}
          </div>
        )}

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
