import type { EmbyItemMetadata, EmbyServer, EmbyUserData } from "@shared";
import { useCallback, useEffect, useState } from "react";
import { setItemPlayedStatus } from "../lib/emby-library-client";

export interface UseItemPlayedStatusOptions {
  item: EmbyItemMetadata;
  server: EmbyServer;
  onUserDataChange?: (item: EmbyItemMetadata, userData: EmbyUserData) => void;
}

export function useItemPlayedStatus({ item, server, onUserDataChange }: UseItemPlayedStatusOptions) {
  const [userData, setUserData] = useState<EmbyUserData | undefined>(item.UserData);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setUserData(item.UserData);
  }, [item.Id, item.UserData]);

  const isPlayed = Boolean(userData?.Played);
  const unplayedCount = userData?.UnplayedItemCount && userData.UnplayedItemCount > 0 ? userData.UnplayedItemCount : null;
  const playbackPositionTicks = userData?.PlaybackPositionTicks;

  const togglePlayed = useCallback(async () => {
    if (isUpdating) return;
    const prevUserData = userData;
    const nextPlayed = !isPlayed;

    // Optimistic update
    setUserData((prev) => ({
      ...prev,
      Played: nextPlayed,
      UnplayedItemCount: nextPlayed ? 0 : prev?.UnplayedItemCount,
      PlaybackPositionTicks: nextPlayed ? 0 : prev?.PlaybackPositionTicks,
    }));
    setIsUpdating(true);

    try {
      const updated = await setItemPlayedStatus(server, item.Id, nextPlayed);
      setUserData((prev) => ({ ...prev, ...updated }));
      onUserDataChange?.(item, updated);
    } catch (err) {
      console.error("Failed to update played status", err);
      setUserData(prevUserData);
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, userData, isPlayed, server, item, onUserDataChange]);

  return {
    userData,
    isPlayed,
    unplayedCount,
    playbackPositionTicks,
    isUpdating,
    togglePlayed,
  };
}
