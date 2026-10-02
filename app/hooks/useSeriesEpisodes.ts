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

export function useSeriesEpisodes(activeServer: EmbyServer | null, item?: EmbyItemMetadata): UseSeriesEpisodesResult {
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

    const controller = new AbortController();

    fetchNextUp(activeServer, item.Id, controller.signal)
      .then((ep) => {
        if (!controller.signal.aborted) {
          setNextUpEpisode(ep);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        console.error("Failed to load next-up episode:", err);
      });

    return () => {
      controller.abort();
    };
  }, [activeServer, item]);

  // 2. Fetch seasons for series
  useEffect(() => {
    if (!activeServer || !item || item.Type !== "Series") {
      setSeasons([]);
      setSelectedSeasonId(null);
      return;
    }

    const controller = new AbortController();

    fetchSeasons(activeServer, item.Id, controller.signal)
      .then((seasonList) => {
        if (controller.signal.aborted) return;
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
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        console.error("Failed to load seasons:", err);
      });

    return () => {
      controller.abort();
    };
  }, [activeServer, item, nextUpEpisode?.SeasonId]);

  // 3. Fetch episodes when selected season changes
  useEffect(() => {
    if (!activeServer || !item || item.Type !== "Series" || !selectedSeasonId) {
      setEpisodes([]);
      setIsEpisodesLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsEpisodesLoading(true);

    fetchEpisodes(activeServer, item.Id, selectedSeasonId, controller.signal)
      .then((epList) => {
        if (controller.signal.aborted) return;
        setEpisodes(epList);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        console.error("Failed to load episodes for season:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsEpisodesLoading(false);
        }
      });

    return () => {
      controller.abort();
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
