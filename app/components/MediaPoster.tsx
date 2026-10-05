import type { EmbyItemMetadata, EmbyServer, EmbyUserData, RemoteSearchResult } from "@shared";
import { getItemImageUrl } from "@shared";
import { IconCheck, IconDots, IconFingerprint, IconInfoCircle, IconMovie } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useItemPlayedStatus } from "../hooks/useItemPlayedStatus";
import { isIdentifySupported } from "../lib/emby-library-client";
import { IdentifyModal } from "./IdentifyModal";
import classes from "./MediaPoster.module.css";
import { PlayedConfirmModal, TogglePlayedMenuItem } from "./PlayedConfirmModal";
import { DropdownMenu } from "./ui/DropdownMenu";
import { Skeleton } from "./ui/Skeleton";

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
  onUserDataChange?: (item: EmbyItemMetadata, userData: EmbyUserData) => void;
  onIdentifySuccess?: (item: EmbyItemMetadata, result?: RemoteSearchResult) => void;
  className?: string;
}

export function MediaPoster({ item, server, onClick, onUserDataChange, onIdentifySuccess, className }: MediaPosterProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isIdentifyOpen, setIsIdentifyOpen] = useState(false);
  const canIdentify = Boolean(server.user?.Policy?.IsAdministrator) && isIdentifySupported(item.Type);

  const { isPlayed, unplayedCount, isUpdating, isConfirmOpen, requestTogglePlayed, cancelTogglePlayed, confirmTogglePlayed } =
    useItemPlayedStatus({
      item,
      server,
      onUserDataChange,
    });

  const isSyncing = Boolean(item.isIdentifying);
  const pendingImg = item.pendingImageUrl as string | undefined;

  const imageUrl = !imgError
    ? pendingImg ||
      getItemImageUrl(server.serverUrl, item, {
        prefer: "primary",
        maxWidth: 280,
        maxHeight: 420,
        quality: 85,
        accessToken: server.accessToken,
      })
    : undefined;

  const rating = typeof item.CommunityRating === "number" && item.CommunityRating > 0 ? item.CommunityRating.toFixed(1) : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(item);
      return;
    }
    navigate(`/item/${item.Id}`, { state: { item } });
  };

  return (
    <div className={`${classes.card} ${className || ""}`}>
      <button type="button" className={classes.cardButton} onClick={handleClick} aria-label={`View ${item.Name || "Media"}`}></button>
      <div className={classes.posterWrapper}>
        {imageUrl ? (
          <img src={imageUrl} alt={item.Name || "Media"} className={classes.image} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className={classes.placeholder}>
            <IconMovie size={36} />
          </div>
        )}

        {/* Top-Left: Syncing badge when background metadata identification is pending */}
        {isSyncing && (
          <div className={classes.syncingBadge} title="Metadata is syncing with server...">
            <span className={classes.syncDot} />
            <span>Syncing</span>
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

        <DropdownMenu
          trigger={(props) => (
            <button type="button" className={classes.menuBtn} aria-label="More actions" {...props}>
              <IconDots size={14} stroke={2.5} />
            </button>
          )}
        >
          <DropdownMenu.Item icon={<IconInfoCircle size={16} />} onSelect={() => navigate(`/item/${item.Id}`, { state: { item } })}>
            Details
          </DropdownMenu.Item>
          {canIdentify && (
            <DropdownMenu.Item icon={<IconFingerprint size={16} />} onSelect={() => setIsIdentifyOpen(true)}>
              Identify
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Divider />
          <TogglePlayedMenuItem isPlayed={isPlayed} isUpdating={isUpdating} onSelect={requestTogglePlayed} />
        </DropdownMenu>
      </div>

      <div className={classes.meta}>
        <span className={classes.title} title={item.Name}>
          {item.Name || "Untitled"}
        </span>
        {item.ProductionYear ? <span className={classes.year}>{item.ProductionYear}</span> : null}
      </div>

      {isConfirmOpen && (
        <PlayedConfirmModal
          opened={isConfirmOpen}
          onClose={cancelTogglePlayed}
          onConfirm={confirmTogglePlayed}
          item={item}
          isPlayed={isPlayed}
          isLoading={isUpdating}
        />
      )}

      {canIdentify && isIdentifyOpen && (
        <IdentifyModal
          opened={isIdentifyOpen}
          onClose={() => setIsIdentifyOpen(false)}
          item={item}
          server={server}
          onSuccess={(result) => {
            console.log(`[MediaPoster] IdentifyModal completed for item: "${item.Name}" (${item.Id}) with:`, result);
            if (onIdentifySuccess) {
              onIdentifySuccess(item, result);
            } else if (onUserDataChange) {
              onUserDataChange(item, item.UserData || {});
            }
          }}
        />
      )}
    </div>
  );
}
