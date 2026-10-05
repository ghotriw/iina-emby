import { type EmbyItemMetadata, formatFullEpisodeTitle } from "@shared";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { EpisodeDetailModal } from "../components/EpisodeDetailModal";
import { ItemHero } from "../components/ItemHero";
import { SeriesEpisodesShelf } from "../components/SeriesEpisodesShelf";
import { useIINABridge, useOnPlaybackProgressUpdated, useOnWindowReopen } from "../hooks/useIINABridge";
import { useSeriesEpisodes } from "../hooks/useSeriesEpisodes";
import { buildStreamUrl, clearLibraryCache, fetchItemDetails } from "../lib/emby-library-client";
import styles from "./item.module.css";

export function meta() {
  return [{ title: "Details - IINA Emby" }];
}

export default function ItemDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeServer, playMedia } = useIINABridge();

  const stateItem = location.state?.item as EmbyItemMetadata | undefined;
  const [item, setItem] = useState<EmbyItemMetadata | undefined>(stateItem);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detailEpisode, setDetailEpisode] = useState<EmbyItemMetadata | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    clearLibraryCache();
    setReloadNonce((prev) => prev + 1);
    // Short visual indicator for refresh button
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  useOnWindowReopen(() => {
    handleRefresh();
  });

  // Automatically refresh when player reports progress back to Emby
  useOnPlaybackProgressUpdated(() => {
    clearLibraryCache();
    setReloadNonce((prev) => prev + 1);
  });

  // Fetch full item details
  useEffect(() => {
    if (!activeServer || !id) return;

    const controller = new AbortController();

    fetchItemDetails(activeServer, id, controller.signal)
      .then((details) => {
        if (!controller.signal.aborted) {
          setItem(details);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        console.error("Failed to load full item details:", err);
      });

    return () => {
      controller.abort();
    };
  }, [activeServer?.id, activeServer?.serverUrl, activeServer?.accessToken, activeServer?.userId, id, reloadNonce]);

  // Series next-up, seasons, and episodes management
  const { isSeries, nextUpEpisode, seasons, selectedSeasonId, setSelectedSeasonId, episodes, isEpisodesLoading } = useSeriesEpisodes(
    activeServer,
    item,
  );

  if (!activeServer) {
    return null;
  }

  const playTarget = isSeries ? nextUpEpisode || episodes[0] : item;

  // Main hero playback execution
  const handlePlay = () => {
    if (!playTarget || isPlaying) return;

    // Safety guard: NEVER try to stream a Series container directly
    if (playTarget.Type === "Series") {
      console.warn("Cannot stream a Series container directly without an episode");
      return;
    }

    try {
      setIsPlaying(true);

      let playTitle = playTarget.Name || "Media";
      if (item?.Type === "Series") {
        playTitle = formatFullEpisodeTitle(item.Name, playTarget.ParentIndexNumber ?? 1, playTarget.IndexNumber, playTarget.Name);
      }

      playMedia({
        title: playTitle,
        streamUrl: buildStreamUrl(activeServer, playTarget.Id),
        startPositionTicks: playTarget.UserData?.PlaybackPositionTicks,
      });
    } finally {
      setIsPlaying(false);
    }
  };

  // Episode card playback execution
  const handlePlayEpisode = (ep: EmbyItemMetadata) => {
    const playTitle = formatFullEpisodeTitle(item?.Name, ep.ParentIndexNumber, ep.IndexNumber, ep.Name);

    playMedia({
      title: playTitle,
      streamUrl: buildStreamUrl(activeServer, ep.Id),
      startPositionTicks: ep.UserData?.PlaybackPositionTicks,
    });
  };

  return (
    <div className={styles.container}>
      <ItemHero
        item={item}
        nextUpEpisode={nextUpEpisode}
        activeServer={activeServer}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onBack={() => navigate(-1)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {isSeries && (
        <SeriesEpisodesShelf
          activeServer={activeServer}
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          onSelectSeason={(seasonId) => setSelectedSeasonId(seasonId)}
          episodes={episodes}
          isLoading={isEpisodesLoading}
          onPlayEpisode={handlePlayEpisode}
          onEpisodeClick={setDetailEpisode}
        />
      )}

      <EpisodeDetailModal episode={detailEpisode} onClose={() => setDetailEpisode(null)} />
    </div>
  );
}
