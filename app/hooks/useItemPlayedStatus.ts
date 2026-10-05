import type { EmbyItemMetadata, EmbyServer, EmbyUserData } from "@shared";
import { useCallback, useEffect, useState } from "react";
import { setItemPlayedStatus } from "../lib/emby-library-client";

export interface UseItemPlayedStatusOptions {
  item: EmbyItemMetadata;
  server: EmbyServer;
  onUserDataChange?: (item: EmbyItemMetadata, userData: EmbyUserData) => void;
}

export function getItemPlayedMenuState(item: EmbyItemMetadata, userData?: EmbyUserData) {
  const currentData = userData ?? item.UserData;
  const isPlayed = Boolean(currentData?.Played);
  const unplayedCount =
    currentData?.UnplayedItemCount && currentData.UnplayedItemCount > 0
      ? currentData.UnplayedItemCount
      : null;
  const playbackPositionTicks = currentData?.PlaybackPositionTicks;

  const totalEpisodes = item.ChildCount ?? item.RecursiveItemCount;
  const hasSeriesProgress =
    item.Type === "Series" &&
    typeof currentData?.UnplayedItemCount === "number" &&
    typeof totalEpisodes === "number" &&
    totalEpisodes > 0 &&
    currentData.UnplayedItemCount < totalEpisodes;

  const hasProgress = Boolean(
    (playbackPositionTicks && playbackPositionTicks > 0) ||
    (typeof currentData?.PlayedPercentage === "number" && currentData.PlayedPercentage > 0) ||
    hasSeriesProgress
  );

  const canMarkPlayed = !isPlayed;
  const canMarkUnplayed = isPlayed || hasProgress;

  return {
    isPlayed,
    unplayedCount,
    playbackPositionTicks,
    hasProgress,
    canMarkPlayed,
    canMarkUnplayed,
  };
}

export function useItemPlayedStatus({ item, server, onUserDataChange }: UseItemPlayedStatusOptions) {
  const [userData, setUserData] = useState<EmbyUserData | undefined>(item.UserData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<"played" | "unplayed" | null>(null);

  useEffect(() => {
    setUserData(item.UserData);
  }, [item.Id, item.UserData]);

  const { isPlayed, unplayedCount, playbackPositionTicks, hasProgress, canMarkPlayed, canMarkUnplayed } =
    getItemPlayedMenuState(item, userData);

  const setPlayedStatus = useCallback(
    async (targetPlayed: boolean) => {
      if (isUpdating) return;
      const prevUserData = userData;

      // Optimistic update: reset playback ticks and percentages when explicitly setting played/unplayed
      setUserData((prev) => ({
        ...prev,
        Played: targetPlayed,
        UnplayedItemCount: targetPlayed ? 0 : (item.ChildCount ?? item.RecursiveItemCount ?? prev?.UnplayedItemCount),
        PlaybackPositionTicks: 0,
        PlayedPercentage: targetPlayed ? 100 : 0,
      }));
      setIsUpdating(true);

      try {
        const updated = await setItemPlayedStatus(server, item.Id, targetPlayed);
        setUserData((prev) => ({ ...prev, ...updated }));
        onUserDataChange?.(item, updated);
      } catch (err) {
        console.error("Failed to update played status", err);
        setUserData(prevUserData);
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, userData, server, item, onUserDataChange]
  );

  const requestMarkPlayed = useCallback(() => {
    setPendingAction("played");
  }, []);

  const requestMarkUnplayed = useCallback(() => {
    setPendingAction("unplayed");
  }, []);

  const requestTogglePlayed = useCallback(() => {
    setPendingAction(isPlayed ? "unplayed" : "played");
  }, [isPlayed]);

  const cancelTogglePlayed = useCallback(() => {
    setPendingAction(null);
  }, []);

  const confirmTogglePlayed = useCallback(async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    try {
      await setPlayedStatus(action === "played");
    } finally {
      setPendingAction(null);
    }
  }, [pendingAction, setPlayedStatus]);

  const togglePlayed = useCallback(async () => {
    await setPlayedStatus(!isPlayed);
  }, [setPlayedStatus, isPlayed]);

  return {
    userData,
    isPlayed,
    unplayedCount,
    playbackPositionTicks,
    hasProgress,
    canMarkPlayed,
    canMarkUnplayed,
    pendingAction,
    isUpdating,
    setPlayedStatus,
    togglePlayed,
    isConfirmOpen: pendingAction !== null,
    requestMarkPlayed,
    requestMarkUnplayed,
    requestTogglePlayed,
    cancelTogglePlayed,
    confirmTogglePlayed,
  };
}
