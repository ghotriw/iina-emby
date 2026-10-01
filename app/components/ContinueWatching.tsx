import { ActionIcon, Alert, Skeleton, Stack } from "@mantine/core";
import { type EmbyServer, formatEpisodeSubtitle, getItemImageUrl, type PlayMediaPayload } from "@shared";
import { IconAlertCircle, IconReload } from "@tabler/icons-react";
import { useContinueWatching } from "../hooks/useContinueWatching";
import { buildStreamUrl } from "../lib/emby-library-client";
import { MediaShelf } from "./MediaShelf";
import { MediaThumb } from "./MediaThumb";

export interface ContinueWatchingProps {
  server: EmbyServer;
  onPlayMedia: (payload: PlayMediaPayload) => void;
}

export function ContinueWatching({ server, onPlayMedia }: ContinueWatchingProps) {
  const { items: resumeItems, loading, error, refresh } = useContinueWatching(server);

  const rightSection = (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="sm"
      onClick={() => refresh()}
      loading={loading}
      title="Refresh"
      aria-label="Refresh continue watching items"
    >
      <IconReload size={16} />
    </ActionIcon>
  );

  return (
    <div>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error loading items" color="red" variant="light" mb="md">
          {error}
        </Alert>
      )}

      <MediaShelf
        title="Continue Watching"
        rightSection={rightSection}
        itemWidth={260}
        emptyText={!loading ? "No in-progress movies or episodes right now." : undefined}
      >
        {loading && resumeItems.length === 0
          ? [1, 2, 3, 4].map((i) => (
              <Stack key={i} gap="xs">
                <Skeleton height={146} radius="md" />
                <Skeleton height={14} width="80%" />
                <Skeleton height={12} width="50%" />
              </Stack>
            ))
          : resumeItems.map((item) => {
              const isEpisode = item.Type === "Episode";
              const title = isEpisode ? item.SeriesName || item.Name || "Episode" : item.Name || "Movie";
              const subtitle = isEpisode
                ? formatEpisodeSubtitle(item.ParentIndexNumber, item.IndexNumber, item.Name)
                : item.ProductionYear
                  ? String(item.ProductionYear)
                  : undefined;

              const imageUrl = getItemImageUrl(server.serverUrl, item, {
                prefer: "thumb",
                maxWidth: 600,
                quality: 90,
                accessToken: server.accessToken,
              });

              const fullPlayTitle = isEpisode
                ? `${item.SeriesName || ""} - ${formatEpisodeSubtitle(item.ParentIndexNumber, item.IndexNumber, item.Name)}`
                : item.Name || "";

              const handlePlay = () => {
                onPlayMedia({
                  streamUrl: buildStreamUrl(server, item.Id),
                  title: fullPlayTitle,
                  startPositionTicks: item.UserData?.PlaybackPositionTicks,
                });
              };

              return (
                <MediaThumb
                  key={item.Id}
                  title={title}
                  subtitle={subtitle}
                  imageUrl={imageUrl}
                  playbackPositionTicks={item.UserData?.PlaybackPositionTicks}
                  runTimeTicks={item.RunTimeTicks}
                  onPlay={handlePlay}
                />
              );
            })}
      </MediaShelf>
    </div>
  );
}
