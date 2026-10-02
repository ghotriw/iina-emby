import type { EmbyItemMetadata, EmbyServer } from "@shared";
import { useEffect, useState } from "react";
import { fetchEpisodes, fetchNextUp, fetchSeasons } from "../lib/emby-library-client";

export interface UseSeriesEpisodesResult {
  isSeries: boolean;
  nextUpEpisode: EmbyItemMetadata | null;
  seasons: EmbyItemMetadata[];
  selectedSeasonId: string | null;
  setSelectedSeasonId: React.Dispatch<React.SetStateAction<string | null>>;
  episodes: EmbyItemMetadata[];
  isEpisodesLoading: boolean;
}

export function useSeriesEpisodes(
  activeServer: EmbyServer | null,
  item?: EmbyItemMetadata,
): UseSeriesEpisodesResult {
  const isSeries = item?.Type === "Series";

  const [nextUpEpisode, setNextUpEpisode] = useState<EmbyItemMetadata | null>(null);
  const [seasons, setSeasons] = useState<EmbyItemMetadata[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<EmbyItemMetadata[]>([]);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);

  // 1. Fetch next-up episode if item is a series
  useEffect(() => {
    if (!activeServer || !item || item.Type !== "Series") {
      setNextUpEpisode(null);
      return;
    }

    let isCancelled = false;

    fetchNextUp(activeServer, item.Id)
      .then((ep) => {
        if (!isCancelled) {
          setNextUpEpisode(ep);
        }
      })
      .catch((err) => {
        console.error("Failed to load next-up episode:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeServer, item]);

  // 2. Fetch seasons for series
  useEffect(() => {
    if (!activeServer || !item || item.Type !== "Series") {
      setSeasons([]);
      setSelectedSeasonId(null);
      return;
    }

    let isCancelled = false;

    fetchSeasons(activeServer, item.Id)
      .then((seasonList) => {
        if (isCancelled) return;
        setSeasons(seasonList);

        if (seasonList.length > 0) {
          setSelectedSeasonId((current) => {
            if (current && seasonList.some((s) => s.Id === current)) return current;
            if (nextUpEpisode?.SeasonId && seasonList.some((s) => s.Id === nextUpEpisode.SeasonId)) {
              return nextUpEpisode.SeasonId;
            }
            return seasonList[0].Id;
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load seasons:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeServer, item, nextUpEpisode?.SeasonId]);

  // 3. Fetch episodes when selected season changes
  useEffect(() => {
    if (!activeServer || !item || item.Type !== "Series" || !selectedSeasonId) {
      setEpisodes([]);
      setIsEpisodesLoading(false);
      return;
    }

    let isCancelled = false;
    setIsEpisodesLoading(true);

    fetchEpisodes(activeServer, item.Id, selectedSeasonId)
      .then((epList) => {
        if (isCancelled) return;
        setEpisodes(epList);
      })
      .catch((err) => {
        console.error("Failed to load episodes for season:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsEpisodesLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeServer, item, selectedSeasonId]);

  return {
    isSeries,
    nextUpEpisode,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    episodes,
    isEpisodesLoading,
  };
}
