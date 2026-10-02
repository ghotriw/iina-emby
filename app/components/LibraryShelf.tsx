import { Skeleton } from "@mantine/core";
import type { EmbyItemMetadata, EmbyServer, EmbyView } from "@shared";
import { MediaPoster } from "./MediaPoster";
import { MediaShelf } from "./MediaShelf";

export interface LibraryShelfProps {
  view: EmbyView;
  items: EmbyItemMetadata[];
  server: EmbyServer;
  isLoading?: boolean;
}

export function LibraryShelf({ view, items, server, isLoading }: LibraryShelfProps) {
  if (isLoading) {
    return (
      <MediaShelf title={view.Name} itemWidth={140} gap={14}>
        {Array.from({ length: 5 }).map((_) => (
          <div key={`skeleton-${view.Id}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton height={210} radius={10} />
            <Skeleton height={14} width="80%" radius={4} />
            <Skeleton height={12} width="40%" radius={4} />
          </div>
        ))}
      </MediaShelf>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <MediaShelf title={view.Name} itemWidth={140} gap={14}>
      {items.map((item) => (
        <MediaPoster key={item.Id} item={item} server={server} />
      ))}
    </MediaShelf>
  );
}
