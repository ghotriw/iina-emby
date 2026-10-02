import type { EmbyItemMetadata, EmbyServer } from "@shared";
import { getEmbyImageUrl, getItemImageUrl } from "@shared";
import { IconChevronLeft, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useState } from "react";
import { formatResumeTime, getMediaBadges } from "../lib/media-formatters";
import { GlassElement } from "./GlassElement";
import styles from "./ItemHero.module.css";

export interface ItemHeroProps {
  item?: EmbyItemMetadata;
  nextUpEpisode?: EmbyItemMetadata | null;
  activeServer: EmbyServer;
  isPlaying?: boolean;
  onPlay: () => void;
  onBack: () => void;
}

export function ItemHero({ item, nextUpEpisode, activeServer, isPlaying = false, onPlay, onBack }: ItemHeroProps) {
  const [logoError, setLogoError] = useState(false);

  // The active playable target (episode if Series has NextUp, or the item itself)
  const targetItem = nextUpEpisode || item;

  // Backdrop image (high-res fanart backdrop priority)
  const backdropUrl = item
    ? getItemImageUrl(activeServer.serverUrl, item, {
        prefer: "backdrop",
        maxWidth: 2560,
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

  // Technical specs & badges
  const { durationText, premiereDateText, resolutionBadge, hdrBadge, fpsBadge, sizeBadge } = getMediaBadges(targetItem, item);

  // Resume position
  const resumeTicks = targetItem?.UserData?.PlaybackPositionTicks || item?.UserData?.PlaybackPositionTicks;
  const resumeTimeClock = formatResumeTime(resumeTicks);

  // Overview / Synopsis with optional prefix
  let overviewPrefix: string | null = null;
  if (item?.Type === "Series" && nextUpEpisode) {
    const sNum = nextUpEpisode.ParentIndexNumber ?? 1;
    const eNum = nextUpEpisode.IndexNumber ?? 1;
    overviewPrefix = `[${item.Name || "Series"} · Seasons ${sNum}/${sNum} · Episode ${eNum}]`;
  } else if (item?.Name) {
    overviewPrefix = `[${item.Name}]`;
  }

  const overviewText: string = String(targetItem?.Overview || item?.Overview || "");

  return (
    <>
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
        <GlassElement variant="glass" shape="rounded" size="md" isIconOnly onClick={onBack} aria-label="Back" title="Back">
          <IconChevronLeft size={22} />
        </GlassElement>
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
            <GlassElement
              variant="primary"
              size="lg"
              shape="rounded"
              fullWidth
              onClick={onPlay}
              disabled={isPlaying}
              aria-label="Play"
              leftSection={<IconPlayerPlayFilled size={18} />}
            >
              <span>Play{resumeTimeClock ? ` ${resumeTimeClock}` : ""}</span>
            </GlassElement>
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
    </>
  );
}
