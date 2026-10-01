import type { EmbyItemMetadata, EmbyMediaStream } from "@shared";
import { getEmbyImageUrl, getItemImageUrl } from "@shared";
import { IconChevronLeft, IconHome, IconPlayerPlayFilled } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useIINABridge } from "../hooks/useIINABridge";
import { buildStreamUrl, fetchItemDetails, fetchNextUp } from "../lib/emby-library-client";
import styles from "./item.module.css";

export function meta() {
  return [{ title: "Details - IINA Emby" }];
}

function formatDuration(ticks?: number): string | null {
  if (!ticks || ticks <= 0) return null;
  const totalMinutes = Math.round(ticks / (10000000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

function formatPremiereDate(isoDate?: string): string | null {
  if (!isoDate) return null;
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatResumeTime(ticks?: number): string | null {
  if (!ticks || ticks <= 0) return null;
  const totalSeconds = Math.floor(ticks / 10000000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ItemDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeServer, playMedia } = useIINABridge();

  const stateItem = location.state?.item as EmbyItemMetadata | undefined;
  const [item, setItem] = useState<EmbyItemMetadata | undefined>(stateItem);
  const [nextUpEpisode, setNextUpEpisode] = useState<EmbyItemMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!activeServer || !id) return;

    let isCancelled = false;

    // Fetch full item details
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

  // If item is a series, fetch its next up episode
  useEffect(() => {
    if (!activeServer || !item || item.Type !== "Series") return;

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

  if (!activeServer) {
    return null;
  }

  // The active playable target (episode if Series has NextUp, or the item itself)
  const targetItem = nextUpEpisode || item;

  // Backdrop image (favor Backdrop from item, fallback to parent or Primary)
  const backdropUrl = item
    ? getItemImageUrl(activeServer.serverUrl, item, {
        prefer: "thumb",
        maxWidth: 1920,
        accessToken: activeServer.accessToken,
      })
    : undefined;

  // Logo: check item's ImageTags.Logo
  const logoTag = item?.ImageTags?.Logo;
  const logoUrl =
    !logoError && logoTag && item
      ? getEmbyImageUrl(activeServer.serverUrl, item.Id, {
          imageType: "Logo",
          maxWidth: 600,
          tag: logoTag,
          accessToken: activeServer.accessToken,
        })
      : undefined;

  // Star rating
  const rating = typeof item?.CommunityRating === "number" && item.CommunityRating > 0 ? item.CommunityRating.toFixed(1) : null;

  // Official certification rating (e.g. R, TV-MA, PG-13)
  const officialRating = (item?.OfficialRating as string | undefined) || null;

  // Genres
  const genresList: string[] =
    Array.isArray(item?.Genres) && item.Genres.length > 0
      ? (item.Genres as string[])
      : Array.isArray(item?.GenreItems)
        ? (item.GenreItems as Array<{ Name: string }>).map((g) => g.Name)
        : [];
  const genresText = genresList.join(" · ");

  // Technical specs
  const activeMediaStreams: EmbyMediaStream[] = Array.isArray(targetItem?.MediaStreams)
    ? (targetItem.MediaStreams as EmbyMediaStream[])
    : [];
  const videoStream = activeMediaStreams.find((s) => s.Type === "Video");
  const mediaSource = targetItem?.MediaSources?.[0];

  const durationText = formatDuration(targetItem?.RunTimeTicks || item?.RunTimeTicks);
  const premiereDateText = formatPremiereDate(
    typeof targetItem?.PremiereDate === "string"
      ? targetItem.PremiereDate
      : typeof item?.PremiereDate === "string"
        ? item.PremiereDate
        : undefined,
  );

  let resolutionBadge: string | null = null;
  if (videoStream?.Width && videoStream.Width >= 3800) {
    resolutionBadge = "4K";
  } else if (videoStream?.Width && videoStream.Width >= 1900) {
    resolutionBadge = "1080p";
  } else if (videoStream?.Width && videoStream.Width >= 1200) {
    resolutionBadge = "720p";
  }

  let hdrBadge: string | null = null;
  const subType = videoStream?.ExtendedVideoSubType as string | undefined;
  if (subType === "DoviProfile81" || subType?.includes("Dovi")) {
    hdrBadge = "DV(P8.1)";
  } else if (videoStream?.VideoRange === "DolbyVision") {
    hdrBadge = "Dolby Vision";
  } else if (videoStream?.VideoRange === "HDR" || String(videoStream?.VideoRange).includes("HDR")) {
    hdrBadge = "HDR";
  }

  let fpsBadge: string | null = null;
  const fps = (videoStream?.RealFrameRate as number | undefined) || (videoStream?.AverageFrameRate as number | undefined);
  if (fps && fps > 0) {
    fpsBadge = `${Math.round(fps)}FPS`;
  }

  let sizeBadge: string | null = null;
  const fileSize = mediaSource?.Size as number | undefined;
  if (fileSize && fileSize > 0) {
    sizeBadge = `${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}G`;
  }

  // Resume position
  const resumeTicks = targetItem?.UserData?.PlaybackPositionTicks || item?.UserData?.PlaybackPositionTicks;
  const resumeTimeClock = formatResumeTime(resumeTicks);

  // Overview / Synopsis with optional prefix (e.g. "[The Agency (2024) · Seasons 2/1 · Episode 2]")
  let overviewPrefix: string | null = null;
  if (item?.Type === "Series" && nextUpEpisode) {
    const sNum = nextUpEpisode.ParentIndexNumber ?? 1;
    const eNum = nextUpEpisode.IndexNumber ?? 1;
    overviewPrefix = `[${item.Name || "Series"} · Seasons ${sNum}/${sNum} · Episode ${eNum}]`;
  } else if (item?.Name) {
    overviewPrefix = `[${item.Name}]`;
  }

  const overviewText: string = String(targetItem?.Overview || item?.Overview || "");

  // Playback execution
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
        startPositionTicks: resumeTicks,
      });
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Ambient Blurred Backdrop providing dominant background color */}
      {backdropUrl ? (
        <div className={styles.ambientBackdrop} aria-hidden="true">
          <img src={backdropUrl} alt="" className={styles.ambientImage} />
          <div className={styles.ambientOverlay} />
        </div>
      ) : null}

      {/* Top Crisp Backdrop with bottom gradient transparency mask */}
      {backdropUrl ? (
        <div className={styles.backdropContainer}>
          <img src={backdropUrl} alt={item?.Name || "Backdrop"} className={styles.backdropImage} />
        </div>
      ) : null}

      {/* Top Floating Navigation */}
      <header className={styles.topNav}>
        <div className={styles.navPill}>
          <button type="button" className={styles.navButton} onClick={() => navigate(-1)} aria-label="Back" title="Back">
            <IconChevronLeft size={20} />
          </button>
          <button type="button" className={styles.navButton} onClick={() => navigate("/")} aria-label="Home" title="Home">
            <IconHome size={18} />
          </button>
        </div>
      </header>

      {/* Hero Bottom Layout */}
      <main className={styles.heroContent}>
        <div className={styles.row}>
          <div className={styles.leftColumn}>
            <div className={styles.logoWrapper}>
              {logoUrl ? (
                <img src={logoUrl} alt={item?.Name || "Logo"} className={styles.logoImage} onError={() => setLogoError(true)} />
              ) : (
                <h1 className={styles.titleFallback}>{item?.Name || "Media"}</h1>
              )}
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.leftColumn}>
            <button type="button" className={styles.playButton} onClick={handlePlay} disabled={isPlaying} aria-label="Play">
              <IconPlayerPlayFilled size={18} />
              <span>Play{resumeTimeClock ? ` ${resumeTimeClock}` : ""}</span>
            </button>
          </div>

          {/* Right Column: Rating, Genres, Technical Specs, Overview */}
          <div className={styles.rightColumn}>
            {/* Row 1: Star Rating, Official Rating, Genres */}
            <div className={styles.ratingGenresRow}>
              {rating ? (
                <span className={styles.starRating}>
                  <span className={styles.starIcon}>★</span>
                  <span>{rating}</span>
                </span>
              ) : null}

              {officialRating ? <span className={styles.officialRatingBadge}>{officialRating}</span> : null}

              {genresText ? <span className={styles.genres}>{genresText}</span> : null}
            </div>

            {/* Row 2: Duration, Release Date, Specs */}
            <div className={styles.specsRow}>
              {durationText ? <span className={styles.specBadge}>{durationText}</span> : null}
              {premiereDateText ? <span className={styles.specBadge}>{premiereDateText}</span> : null}
              {resolutionBadge ? <span className={styles.specBadge}>{resolutionBadge}</span> : null}
              {hdrBadge ? <span className={styles.specBadge}>{hdrBadge}</span> : null}
              {fpsBadge ? <span className={styles.specBadge}>{fpsBadge}</span> : null}
              {sizeBadge ? <span className={styles.specBadge}>{sizeBadge}</span> : null}
            </div>

            {/* Row 3: Overview with prefix */}
            {overviewText ? (
              <p className={styles.overview}>
                {overviewPrefix ? <strong className={styles.overviewPrefix}>{overviewPrefix} </strong> : null}
                {overviewText}
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
