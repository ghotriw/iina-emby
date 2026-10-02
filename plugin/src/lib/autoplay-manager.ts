import { type EmbyItemMetadata, type EmbyItemsResponse, type EmbySeasonItem, formatFullEpisodeTitle } from "@shared";
import type { DebugLogger } from "./debug-log";

export interface AutoplayManagerDeps {
  http: typeof iina.http;
  mpv: typeof iina.mpv;
  core: typeof iina.core;
  preferences: typeof iina.preferences;
  buildEmbyHeaders: (apiKey?: string, extraHeaders?: Record<string, string>) => Record<string, string>;
  fetchItemMetadata: (serverBase: string, itemId: string, apiKey: string) => Promise<EmbyItemMetadata>;
  log: DebugLogger;
}

export interface SeriesEpisode {
  id: string;
  name: string;
  indexNumber: number;
  duration?: number;
  playUrl: string;
  seasonNumber?: number;
}

export interface SeriesInfo {
  seriesId: string;
  seasonId: string;
  seriesName: string;
  seasonNumber: number;
  currentEpisodeNumber: number;
}

export function createAutoplayManager({ http, mpv, core, preferences, buildEmbyHeaders, fetchItemMetadata, log }: AutoplayManagerDeps) {
  let lastProcessedEpisodeId: string | null = null;
  let lastProcessedSeriesId: string | null = null;
  let autoplayRequestCounter = 0;
  let autoplayQueued = false;

  async function fetchSeriesEpisodes(serverBase: string, seriesId: string, seasonId: string, apiKey: string): Promise<SeriesEpisode[]> {
    try {
      log(`Fetching episodes for series: ${seriesId}, season: ${seasonId}`);

      const queryParams = [
        `seasonId=${encodeURIComponent(seasonId)}`,
        `fields=${encodeURIComponent("MediaSources,Path,LocationType,IsFolder")}`,
      ].join("&");

      const response = await http.get(`${serverBase}/Shows/${seriesId}/Episodes?${queryParams}&api_key=${apiKey}`, {
        headers: buildEmbyHeaders(apiKey, {
          Accept: "application/json",
        }),
      });

      if (!response.data) {
        throw new Error("No data received from Emby API");
      }

      const episodeData: EmbyItemsResponse<EmbyItemMetadata> =
        typeof response.data === "string" ? JSON.parse(response.data) : response.data;

      if (!episodeData?.Items) {
        log("No episodes found in response");
        return [];
      }

      const episodes: SeriesEpisode[] = episodeData.Items.filter((episode: EmbyItemMetadata) =>
        Boolean(episode.MediaSources && episode.MediaSources.length > 0 && episode.Id),
      ).map((episode: EmbyItemMetadata) => ({
        id: episode.Id,
        name: episode.Name || "",
        indexNumber: Number(episode.IndexNumber) || 0,
        duration: episode.RunTimeTicks,
        playUrl: `${serverBase}/Videos/${episode.Id}/stream?static=true&api_key=${apiKey}`,
      }));

      episodes.sort((left, right) => left.indexNumber - right.indexNumber);

      log(`Fetched ${episodes.length} episodes from series: ${episodes.map((episode) => `E${episode.indexNumber}`).join(", ")}`);
      return episodes;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`Error fetching series episodes: ${errorMsg}`);
      return [];
    }
  }

  async function getSeriesInfoFromEpisode(serverBase: string, episodeId: string, apiKey: string): Promise<SeriesInfo | null> {
    try {
      log(`Getting series info from episode: ${episodeId}`);

      const metadata = await fetchItemMetadata(serverBase, episodeId, apiKey);

      if (metadata.Type !== "Episode") {
        log(`Item ${episodeId} is not an episode, it's a ${metadata.Type}`);
        return null;
      }

      const seriesId = metadata.SeriesId;
      const seasonId = metadata.SeasonId;
      const seriesName = metadata.SeriesName || "";
      const parsedSeasonNumber = Number(metadata.ParentIndexNumber ?? 1);
      const seasonNumber = Number.isFinite(parsedSeasonNumber) ? parsedSeasonNumber : 1;
      const episodeIndexNumber = Number(metadata.IndexNumber) || 0;

      if (!seriesId || !seasonId) {
        log(`Missing series info - SeriesId: ${seriesId}, SeasonId: ${seasonId}`);
        return null;
      }

      log(
        `Series info: SeriesName=${seriesName}, SeriesId=${seriesId}, SeasonId=${seasonId}, SeasonNumber=${seasonNumber}, EpisodeNumber=${episodeIndexNumber}`,
      );

      return {
        seriesId,
        seasonId,
        seriesName,
        seasonNumber,
        currentEpisodeNumber: episodeIndexNumber,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`Error getting series info from episode: ${errorMsg}`);
      return null;
    }
  }

  async function resolveNextEpisode(
    serverBase: string,
    seriesId: string,
    seasonId: string,
    currentEpisodeNumber: number,
    apiKey: string,
  ): Promise<SeriesEpisode | null> {
    try {
      const episodes = await fetchSeriesEpisodes(serverBase, seriesId, seasonId, apiKey);
      const currentEpNum = Number(currentEpisodeNumber);
      const nextEpisode = episodes.find((episode) => episode.indexNumber > currentEpNum);

      if (nextEpisode) {
        log(`Found next episode in current season: E${nextEpisode.indexNumber} - ${nextEpisode.name}`);
        return nextEpisode;
      }

      log("No next episode in current season, checking next season...");

      const seasonsResponse = await http.get(`${serverBase}/Shows/${seriesId}/Seasons?api_key=${apiKey}`, {
        headers: buildEmbyHeaders(apiKey, { Accept: "application/json" }),
      });

      if (!seasonsResponse.data) return null;

      const seasonsData: EmbyItemsResponse<EmbySeasonItem> =
        typeof seasonsResponse.data === "string" ? JSON.parse(seasonsResponse.data) : seasonsResponse.data;

      if (!seasonsData?.Items || seasonsData.Items.length === 0) return null;

      const sortedSeasons = seasonsData.Items.filter(
        (season: EmbySeasonItem): season is EmbySeasonItem & { IndexNumber: number } =>
          season.IndexNumber !== null && season.IndexNumber !== undefined,
      ).sort((left, right) => (left.IndexNumber || 0) - (right.IndexNumber || 0));

      const currentSeasonIndex = sortedSeasons.findIndex((season) => season.Id === seasonId);
      if (currentSeasonIndex === -1 || currentSeasonIndex >= sortedSeasons.length - 1) {
        log("No next season available — end of series");
        return null;
      }

      const nextSeason = sortedSeasons[currentSeasonIndex + 1];
      log(`Found next season: ${nextSeason.Name} (S${nextSeason.IndexNumber})`);

      const nextSeasonEpisodes = await fetchSeriesEpisodes(serverBase, seriesId, nextSeason.Id, apiKey);

      if (nextSeasonEpisodes.length === 0) {
        log("Next season has no episodes");
        return null;
      }

      const firstEpisode = nextSeasonEpisodes[0];
      log(`Found first episode of next season: S${nextSeason.IndexNumber}E${firstEpisode.indexNumber} - ${firstEpisode.name}`);

      firstEpisode.seasonNumber = nextSeason.IndexNumber;

      return firstEpisode;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`Error resolving next episode: ${errorMsg}`);
      return null;
    }
  }

  function queueNextEpisode(nextEpisode: SeriesEpisode, seriesName: string, seasonNumber: number) {
    try {
      const episodeTitle = formatFullEpisodeTitle(seriesName, seasonNumber, nextEpisode.indexNumber, nextEpisode.name);

      log(`Queuing next episode: ${episodeTitle}`);

      try {
        const playlistCount = Number(mpv.getNumber("playlist-count") || 0);
        const currentPos = Number(mpv.getNumber("playlist-pos"));

        if (!Number.isFinite(currentPos) || currentPos < 0) {
          log(`Skipping playlist cleanup due to invalid playlist-pos=${currentPos}, playlist-count=${playlistCount}`);
        } else if (playlistCount > currentPos + 1) {
          for (let i = playlistCount - 1; i > currentPos; i--) {
            try {
              mpv.command("playlist-remove", [String(i)]);
            } catch {
              // Ignore removal errors
            }
          }
          log(`Cleaned ${playlistCount - currentPos - 1} stale playlist entries`);
        }
      } catch {
        log("Could not clean playlist (non-critical)");
      }

      mpv.command("loadfile", [nextEpisode.playUrl, "insert-next", "-1", `force-media-title=${episodeTitle}`]);

      autoplayQueued = true;

      log(`Queued next episode: ${episodeTitle}`);

      if (preferences.get("show_notifications")) {
        core.osd(`Up next: ${episodeTitle}`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`Error queuing next episode: ${errorMsg}`);
    }
  }

  function setupAutoplayForEpisode(serverBase: string, episodeId: string, apiKey: string) {
    if (lastProcessedEpisodeId === episodeId) {
      log(`Episode ${episodeId} already being processed, skipping duplicate setup`);
      return;
    }

    lastProcessedEpisodeId = episodeId;
    autoplayQueued = false;

    autoplayRequestCounter++;
    const thisRequestId = autoplayRequestCounter;

    (async () => {
      try {
        log(`Setting up autoplay for episode: ${episodeId} (request #${thisRequestId})`);

        const seriesInfo = await getSeriesInfoFromEpisode(serverBase, episodeId, apiKey);

        if (thisRequestId !== autoplayRequestCounter) {
          log(`Autoplay request #${thisRequestId} is stale (current: #${autoplayRequestCounter}), aborting`);
          return;
        }

        if (!seriesInfo) {
          log("Could not get series info, autoplay not available");
          return;
        }

        log(
          `Got series info: series=${seriesInfo.seriesId}, season=${seriesInfo.seasonId}, seasonNum=${seriesInfo.seasonNumber}, currentEp=${seriesInfo.currentEpisodeNumber}`,
        );

        if (lastProcessedSeriesId !== seriesInfo.seriesId) {
          log(`Series changed from ${lastProcessedSeriesId} to ${seriesInfo.seriesId}`);
          lastProcessedSeriesId = seriesInfo.seriesId;
        }

        const nextEpisode = await resolveNextEpisode(
          serverBase,
          seriesInfo.seriesId,
          seriesInfo.seasonId,
          seriesInfo.currentEpisodeNumber,
          apiKey,
        );

        if (thisRequestId !== autoplayRequestCounter) {
          log(`Autoplay request #${thisRequestId} is stale after resolve, aborting`);
          return;
        }

        if (!nextEpisode) {
          log("No next episode found — end of series");
          return;
        }

        const seasonNum = nextEpisode.seasonNumber ?? seriesInfo.seasonNumber;
        queueNextEpisode(nextEpisode, seriesInfo.seriesName, seasonNum);

        log(`Autoplay setup complete — queued next episode: ${nextEpisode.name}`);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`Error setting up autoplay: ${errorMsg}`);
      }
    })();
  }

  function resetForNewFile(episodeId?: string | null) {
    if (!episodeId || lastProcessedEpisodeId !== episodeId) {
      lastProcessedEpisodeId = null;
    }
    autoplayQueued = false;
  }

  function clearQueuedFlag() {
    autoplayQueued = false;
  }

  function isQueued(): boolean {
    return autoplayQueued;
  }

  return {
    setupAutoplayForEpisode,
    resetForNewFile,
    clearQueuedFlag,
    isQueued,
  };
}
