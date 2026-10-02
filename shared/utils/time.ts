export const TICKS_PER_SECOND = 10_000_000;

export function ticksToSeconds(ticks?: number | null): number {
  if (!ticks || typeof ticks !== "number" || ticks < 0) {
    return 0;
  }
  return Math.floor(ticks / TICKS_PER_SECOND);
}

export function secondsToTicks(seconds?: number | null): number {
  if (!seconds || typeof seconds !== "number" || seconds < 0) {
    return 0;
  }
  return Math.floor(seconds * TICKS_PER_SECOND);
}

export function formatDuration(totalSeconds?: number | null): string {
  if (!totalSeconds || typeof totalSeconds !== "number" || totalSeconds <= 0) {
    return "0:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formattedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const formattedMinutes = String(minutes).padStart(2, "0");
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${minutes}:${formattedSeconds}`;
}

export function formatTimeProgress(currentSeconds?: number | null, totalSeconds?: number | null): string {
  const current = formatDuration(currentSeconds);
  const total = formatDuration(totalSeconds);
  return `${current} / ${total}`;
}

export function formatEpisodeCode(seasonNum?: number | null, episodeNum?: number | null): string {
  const s = typeof seasonNum === "number" && seasonNum > 0 ? String(seasonNum).padStart(2, "0") : "01";
  const e = typeof episodeNum === "number" && episodeNum > 0 ? String(episodeNum).padStart(2, "0") : "01";
  return `S${s}E${e}`;
}

export function formatFullEpisodeTitle(
  seriesName?: string | null,
  seasonNum?: number | null,
  episodeNum?: number | null,
  episodeName?: string | null,
): string {
  const code = formatEpisodeCode(seasonNum, episodeNum);
  const title = episodeName || "Episode";
  return seriesName ? `${seriesName} ${code} - ${title}` : `${code} - ${title}`;
}

export function formatEpisodeSubtitle(seasonNum?: number | null, episodeNum?: number | null, episodeName?: string | null): string {
  const parts: string[] = [];

  if (typeof seasonNum === "number" && seasonNum > 0) {
    parts.push(`S${String(seasonNum).padStart(2, "0")}`);
  }
  if (typeof episodeNum === "number" && episodeNum > 0) {
    parts.push(`E${String(episodeNum).padStart(2, "0")}`);
  }

  const prefix = parts.join(" - ");
  if (prefix && episodeName) {
    return `${prefix} - ${episodeName}`;
  }
  if (prefix) {
    return prefix;
  }
  return episodeName || "";
}
