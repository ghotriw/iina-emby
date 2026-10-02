import type { EmbyItemMetadata } from "@shared";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { EpisodeDetailModal } from "../components/EpisodeDetailModal";
import { ItemHero } from "../components/ItemHero";
import { SeriesEpisodesShelf } from "../components/SeriesEpisodesShelf";
import { useIINABridge } from "../hooks/useIINABridge";
import { useSeriesEpisodes } from "../hooks/useSeriesEpisodes";
import { buildStreamUrl, fetchItemDetails } from "../lib/emby-library-client";
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

  // Fetch full item details
  useEffect(() => {
    if (!activeServer || !id) return;

    let isCancelled = false;

    fetchItemDetails(activeServer, id)
      .then((details) => {
        if (!isCancelled) {
          setItem(details);
        }
      })
      .catch((err) => {
        console.error("Failed to load full item details:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeServer, id]);

  // Series next-up, seasons, and episodes management
  const {
    isSeries,
    nextUpEpisode,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    episodes,
    isEpisodesLoading,
  } = useSeriesEpisodes(activeServer, item);

  if (!activeServer) {
    return null;
  }

  const targetItem = nextUpEpisode || item;

  // Main hero playback execution
  const handlePlay = () => {
    if (!targetItem || isPlaying) return;

    try {
      setIsPlaying(true);

      let playTitle = targetItem.Name || "Media";
      if (item?.Type === "Series" && nextUpEpisode) {
        playTitle = nextUpEpisode.IndexNumber
          ? `${item.Name} - S${nextUpEpisode.ParentIndexNumber ?? 1}E${nextUpEpisode.IndexNumber} - ${nextUpEpisode.Name}`
          : nextUpEpisode.Name || item.Name || "Episode";
      }

      playMedia({
        title: playTitle,
        streamUrl: buildStreamUrl(activeServer, targetItem.Id),
        startPositionTicks:
          targetItem.UserData?.PlaybackPositionTicks || item?.UserData?.PlaybackPositionTicks,
      });
    } finally {
      setIsPlaying(false);
    }
  };

  // Episode card playback execution
  const handlePlayEpisode = (ep: EmbyItemMetadata) => {
    const sNum = ep.ParentIndexNumber !== undefined ? String(ep.ParentIndexNumber).padStart(2, "0") : "01";
    const eNum = ep.IndexNumber !== undefined ? String(ep.IndexNumber).padStart(2, "0") : "01";
    const playTitle = `${item?.Name || "Series"} - S${sNum}E${eNum} - ${ep.Name || "Episode"}`;

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

      <EpisodeDetailModal
        episode={detailEpisode}
        onClose={() => setDetailEpisode(null)}
      />
    </div>
  );
}
