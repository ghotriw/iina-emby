import { Skeleton } from "@mantine/core";
import type { EmbyItemMetadata, EmbyServer, EmbyView } from "@shared";
import { MediaPoster, MediaPosterSkeleton } from "./MediaPoster";
import { MediaShelf } from "./MediaShelf";
import shelfClasses from "./MediaShelf.module.css";

export interface LibraryShelfSkeletonProps {
  shelfId?: string | number;
  titleWidth?: number;
}

export function LibraryShelfSkeleton({ shelfId = "skeleton-shelf", titleWidth = 100 }: LibraryShelfSkeletonProps) {
  return (
    <MediaShelf
      title={
        <h3 className={shelfClasses.title}>
          <Skeleton width={titleWidth} radius="xs">
            <span>&nbsp;</span>
          </Skeleton>
        </h3>
      }
      itemWidth={140}
      gap={14}
    >
      {[1, 2, 3, 4, 5].map((id) => (
        <MediaPosterSkeleton key={`${shelfId}-${id}`} />
      ))}
    </MediaShelf>
  );
}

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
        {[1, 2, 3, 4, 5].map((id) => (
          <MediaPosterSkeleton key={`${view.Id}-${id}`} />
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
