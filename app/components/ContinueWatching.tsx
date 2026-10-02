import { Alert } from "@mantine/core";
import type { EmbyServer, PlayMediaPayload } from "@shared";
import { IconAlertCircle } from "@tabler/icons-react";
import { forwardRef, useImperativeHandle } from "react";
import { useContinueWatching } from "../hooks/useContinueWatching";
import { MediaShelf } from "./MediaShelf";
import { MediaThumb, MediaThumbSkeleton } from "./MediaThumb";

export interface ContinueWatchingProps {
  server: EmbyServer;
  onPlayMedia: (payload: PlayMediaPayload) => void;
}

export interface ContinueWatchingHandle {
  refresh: () => Promise<void>;
}

export const ContinueWatching = forwardRef<ContinueWatchingHandle, ContinueWatchingProps>(({ server, onPlayMedia }, ref) => {
  const { items: resumeItems, loading, error, refresh } = useContinueWatching(server);

  useImperativeHandle(
    ref,
    () => ({
      refresh,
    }),
    [refresh],
  );

  return (
    <div>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error loading items" color="red" variant="light" mb="md" mx="1.5rem">
          {error}
        </Alert>
      )}

      <MediaShelf
        title="Continue Watching"
        itemWidth={260}
        emptyText={!loading ? "No in-progress movies or episodes right now." : undefined}
      >
        {loading && resumeItems.length === 0
          ? [1, 2, 3, 4].map((id) => <MediaThumbSkeleton key={id} />)
          : resumeItems.map((item) => <MediaThumb key={item.Id} item={item} server={server} onPlay={onPlayMedia} />)}
      </MediaShelf>
    </div>
  );
});

ContinueWatching.displayName = "ContinueWatching";
