import type { EmbyItemMetadata, EmbyView } from "@shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { LibrarySectionData } from "../hooks/useLibrarySections";
import { queryClient } from "./query-client";
import { embyKeys } from "./query-keys";
import { applyUserDataUpdatesToCache } from "./user-data-sync";

describe("user-data-sync (applyUserDataUpdatesToCache)", () => {
  const serverId = "srv-1";

  beforeEach(() => {
    queryClient.clear();
  });

  it("updates PlaybackPositionTicks in continueWatching and item in-memory", () => {
    const initialItem: EmbyItemMetadata = {
      Id: "item-10",
      Name: "Movie 1",
      UserData: { PlaybackPositionTicks: 1000 },
    };

    queryClient.setQueryData(embyKeys.continueWatching(serverId), [initialItem]);
    queryClient.setQueryData(embyKeys.item(serverId, "item-10"), initialItem);

    applyUserDataUpdatesToCache(serverId, [
      {
        ItemId: "item-10",
        PlaybackPositionTicks: 50000,
        PlayedPercentage: 25.5,
      },
    ]);

    const updatedShelf = queryClient.getQueryData<EmbyItemMetadata[]>(embyKeys.continueWatching(serverId));
    expect(updatedShelf?.[0].UserData?.PlaybackPositionTicks).toBe(50000);
    expect(updatedShelf?.[0].UserData?.PlayedPercentage).toBe(25.5);

    const updatedItem = queryClient.getQueryData<EmbyItemMetadata>(embyKeys.item(serverId, "item-10"));
    expect(updatedItem?.UserData?.PlaybackPositionTicks).toBe(50000);
  });

  it("moves updated item to the front of continueWatching shelf (index 0)", () => {
    const item1: EmbyItemMetadata = { Id: "item-1", Name: "Movie 1", UserData: { PlaybackPositionTicks: 100 } };
    const item2: EmbyItemMetadata = { Id: "item-2", Name: "Movie 2", UserData: { PlaybackPositionTicks: 200 } };

    queryClient.setQueryData(embyKeys.continueWatching(serverId), [item1, item2]);

    applyUserDataUpdatesToCache(serverId, [
      {
        ItemId: "item-2",
        PlaybackPositionTicks: 5000,
      },
    ]);

    const updatedShelf = queryClient.getQueryData<EmbyItemMetadata[]>(embyKeys.continueWatching(serverId));
    expect(updatedShelf?.[0].Id).toBe("item-2");
    expect(updatedShelf?.[0].UserData?.PlaybackPositionTicks).toBe(5000);
    expect(updatedShelf?.[1].Id).toBe("item-1");
  });

  it("removes item from continueWatching if Played is true", () => {
    const item1: EmbyItemMetadata = { Id: "item-1", Name: "Movie 1", UserData: { Played: false } };
    const item2: EmbyItemMetadata = { Id: "item-2", Name: "Movie 2", UserData: { Played: false } };

    queryClient.setQueryData(embyKeys.continueWatching(serverId), [item1, item2]);

    applyUserDataUpdatesToCache(serverId, [
      {
        ItemId: "item-1",
        Played: true,
      },
    ]);

    const updatedShelf = queryClient.getQueryData<EmbyItemMetadata[]>(embyKeys.continueWatching(serverId));
    expect(updatedShelf).toHaveLength(1);
    expect(updatedShelf?.[0].Id).toBe("item-2");
  });

  it("updates UnplayedItemCount in librarySections for series", () => {
    const view: EmbyView = { Id: "view-1", Name: "TV Shows" };
    const seriesItem: EmbyItemMetadata = {
      Id: "series-99",
      Name: "Great Series",
      Type: "Series",
      UserData: { UnplayedItemCount: 10 },
    };

    const initialSections: LibrarySectionData[] = [
      {
        view,
        items: [seriesItem],
      },
    ];

    queryClient.setQueryData(embyKeys.librarySections(serverId), initialSections);

    applyUserDataUpdatesToCache(serverId, [
      {
        ItemId: "series-99",
        UnplayedItemCount: 9,
      },
    ]);

    const updatedSections = queryClient.getQueryData<LibrarySectionData[]>(embyKeys.librarySections(serverId));
    expect(updatedSections?.[0].items[0].UserData?.UnplayedItemCount).toBe(9);
  });

  it("updates episodes in season query in memory", () => {
    const ep1: EmbyItemMetadata = { Id: "ep-1", Name: "Episode 1", UserData: { PlaybackPositionTicks: 0 } };
    const ep2: EmbyItemMetadata = { Id: "ep-2", Name: "Episode 2", UserData: { PlaybackPositionTicks: 0 } };

    queryClient.setQueryData(embyKeys.seriesEpisodes(serverId, "series-1", "season-1"), [ep1, ep2]);

    applyUserDataUpdatesToCache(serverId, [
      {
        ItemId: "ep-1",
        PlaybackPositionTicks: 123456,
      },
    ]);

    const updatedEpisodes = queryClient.getQueryData<EmbyItemMetadata[]>(
      embyKeys.seriesEpisodes(serverId, "series-1", "season-1"),
    );
    expect(updatedEpisodes?.[0].UserData?.PlaybackPositionTicks).toBe(123456);
    expect(updatedEpisodes?.[1].UserData?.PlaybackPositionTicks).toBe(0);
  });
});
