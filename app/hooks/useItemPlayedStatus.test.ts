import type { EmbyItemMetadata, EmbyUserData } from "@shared";
import { describe, expect, it } from "vitest";
import { getItemPlayedMenuState } from "./useItemPlayedStatus";

describe("getItemPlayedMenuState", () => {
  it("shows only 'Mark as played' for an untouched unplayed item", () => {
    const item: EmbyItemMetadata = {
      Id: "item-1",
      Name: "Untouched Movie",
      Type: "Movie",
      UserData: {
        Played: false,
        PlaybackPositionTicks: 0,
        PlayedPercentage: 0,
      },
    };

    const state = getItemPlayedMenuState(item);
    expect(state.isPlayed).toBe(false);
    expect(state.hasProgress).toBe(false);
    expect(state.canMarkPlayed).toBe(true);
    expect(state.canMarkUnplayed).toBe(false);
  });

  it("shows BOTH 'Mark as played' and 'Mark as unplayed' when item has playback progress", () => {
    const item: EmbyItemMetadata = {
      Id: "item-2",
      Name: "In-Progress Movie",
      Type: "Movie",
      UserData: {
        Played: false,
        PlaybackPositionTicks: 15_000_000,
        PlayedPercentage: 45,
      },
    };

    const state = getItemPlayedMenuState(item);
    expect(state.isPlayed).toBe(false);
    expect(state.hasProgress).toBe(true);
    expect(state.canMarkPlayed).toBe(true);
    expect(state.canMarkUnplayed).toBe(true);
  });

  it("shows BOTH 'Mark as played' and 'Mark as unplayed' when item has PlayedPercentage > 0 even if ticks are 0", () => {
    const item: EmbyItemMetadata = {
      Id: "item-3",
      Name: "Partially Watched Episode",
      Type: "Episode",
      UserData: {
        Played: false,
        PlaybackPositionTicks: 0,
        PlayedPercentage: 30,
      },
    };

    const state = getItemPlayedMenuState(item);
    expect(state.isPlayed).toBe(false);
    expect(state.hasProgress).toBe(true);
    expect(state.canMarkPlayed).toBe(true);
    expect(state.canMarkUnplayed).toBe(true);
  });

  it("shows BOTH 'Mark as played' and 'Mark as unplayed' for a partially watched Series", () => {
    const seriesItem: EmbyItemMetadata = {
      Id: "series-1",
      Name: "Breaking Bad",
      Type: "Series",
      ChildCount: 62,
      UserData: {
        Played: false,
        UnplayedItemCount: 15,
        PlaybackPositionTicks: 0,
      },
    };

    const state = getItemPlayedMenuState(seriesItem);
    expect(state.isPlayed).toBe(false);
    expect(state.hasProgress).toBe(true);
    expect(state.canMarkPlayed).toBe(true);
    expect(state.canMarkUnplayed).toBe(true);
  });

  it("shows only 'Mark as played' for a completely unstarted Series", () => {
    const seriesItem: EmbyItemMetadata = {
      Id: "series-2",
      Name: "New Show",
      Type: "Series",
      ChildCount: 10,
      UserData: {
        Played: false,
        UnplayedItemCount: 10,
        PlaybackPositionTicks: 0,
      },
    };

    const state = getItemPlayedMenuState(seriesItem);
    expect(state.isPlayed).toBe(false);
    expect(state.hasProgress).toBe(false);
    expect(state.canMarkPlayed).toBe(true);
    expect(state.canMarkUnplayed).toBe(false);
  });

  it("shows only 'Mark as unplayed' for a completed/played item", () => {
    const item: EmbyItemMetadata = {
      Id: "item-4",
      Name: "Finished Movie",
      Type: "Movie",
      UserData: {
        Played: true,
        PlaybackPositionTicks: 0,
      },
    };

    const state = getItemPlayedMenuState(item);
    expect(state.isPlayed).toBe(true);
    expect(state.canMarkPlayed).toBe(false);
    expect(state.canMarkUnplayed).toBe(true);
  });

  it("prioritizes provided dynamic userData override over item.UserData", () => {
    const item: EmbyItemMetadata = {
      Id: "item-5",
      Name: "Movie",
      Type: "Movie",
      UserData: {
        Played: false,
        PlaybackPositionTicks: 10_000,
      },
    };

    const overriddenUserData: EmbyUserData = {
      Played: true,
      PlaybackPositionTicks: 0,
    };

    const state = getItemPlayedMenuState(item, overriddenUserData);
    expect(state.isPlayed).toBe(true);
    expect(state.canMarkPlayed).toBe(false);
    expect(state.canMarkUnplayed).toBe(true);
  });
});
