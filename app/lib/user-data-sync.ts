import type { EmbyItemMetadata } from "@shared";
import type { LibrarySectionData } from "../hooks/useLibrarySections";
import type { SectionAllData } from "./emby-library-client";
import type { UserDataChangedItem } from "./emby-websocket-client";
import { queryClient } from "./query-client";
import { embyKeys } from "./query-keys";

/**
 * Applies UserData updates (from WebSocket UserDataChanged or Player progress updates)
 * directly into TanStack Query in-memory cache without triggering full network refetches.
 */
export function applyUserDataUpdatesToCache(serverId: string, entries: UserDataChangedItem[]): void {
  if (!serverId || !entries || entries.length === 0) return;

  for (const entry of entries) {
    const itemId = entry.ItemId;
    if (!itemId) continue;

    // Helper to merge incoming UserData fields onto existing UserData
    const mergeUserData = (existingUserData?: Record<string, unknown>) => ({
      ...existingUserData,
      ...entry,
    });

    // 1. Single Item Query: embyKeys.item(serverId, itemId)
    queryClient.setQueryData<EmbyItemMetadata>(embyKeys.item(serverId, itemId), (old) => {
      if (!old) return old;
      return {
        ...old,
        UserData: mergeUserData(old.UserData),
      };
    });

    // 2. Continue Watching shelf: embyKeys.continueWatching(serverId)
    let itemExistedInContinueWatching = false;
    queryClient.setQueryData<EmbyItemMetadata[]>(embyKeys.continueWatching(serverId), (old) => {
      if (!old) return old;

      if (entry.Played === true) {
        // If completed, remove from continue watching shelf
        return old.filter((it) => it.Id !== itemId);
      }

      const target = old.find((it) => it.Id === itemId);
      if (target) {
        itemExistedInContinueWatching = true;
        const updated = {
          ...target,
          UserData: mergeUserData(target.UserData),
        };
        const others = old.filter((it) => it.Id !== itemId);
        // Move the active playing/resumed item to the first position (index 0)
        return [updated, ...others];
      }

      return old;
    });

    // If an item started playing and is not yet in Continue Watching shelf, invalidate shelf once to fetch full card
    if (!itemExistedInContinueWatching && !entry.Played && (entry.PlaybackPositionTicks ?? 0) > 0) {
      queryClient.invalidateQueries({ queryKey: embyKeys.continueWatching(serverId) });
    }

    // 3. Home Library Sections: embyKeys.librarySections(serverId)
    queryClient.setQueryData<LibrarySectionData[]>(embyKeys.librarySections(serverId), (old) => {
      if (!old) return old;
      return old.map((section) => {
        let hasItem = false;
        const nextItems = section.items.map((it) => {
          if (it.Id === itemId) {
            hasItem = true;
            return { ...it, UserData: mergeUserData(it.UserData) };
          }
          return it;
        });

        // Also check if the view itself matches (e.g. unplayed counts)
        const nextView =
          section.view.Id === itemId && typeof entry.UnplayedItemCount === "number"
            ? { ...section.view, UnplayedItemCount: entry.UnplayedItemCount }
            : section.view;

        return hasItem || nextView !== section.view ? { ...section, view: nextView, items: nextItems } : section;
      });
    });

    // 4. Section Grids: matching ["emby", serverId, "section", ...]
    queryClient.setQueriesData<SectionAllData>(
      { queryKey: [...embyKeys.server(serverId), "section"] },
      (old) => {
        if (!old || !old.items) return old;
        let hasItem = false;
        const nextItems = old.items.map((it) => {
          if (it.Id === itemId) {
            hasItem = true;
            return { ...it, UserData: mergeUserData(it.UserData) };
          }
          return it;
        });
        return hasItem ? { ...old, items: nextItems } : old;
      },
    );

    // 5. Series Episodes: matching ["emby", serverId, "episodes", ...]
    queryClient.setQueriesData<EmbyItemMetadata[]>(
      { queryKey: [...embyKeys.server(serverId), "episodes"] },
      (old) => {
        if (!old) return old;
        let hasItem = false;
        const nextItems = old.map((ep) => {
          if (ep.Id === itemId) {
            hasItem = true;
            return { ...ep, UserData: mergeUserData(ep.UserData) };
          }
          return ep;
        });
        return hasItem ? nextItems : old;
      },
    );

    // 6. NextUp: matching ["emby", serverId, "nextUp", ...]
    if (entry.Played === true) {
      // If an episode was completed, the Next Up episode changes to the following one -> invalidate
      queryClient.invalidateQueries({ queryKey: [...embyKeys.server(serverId), "nextUp"] });
    } else {
      queryClient.setQueriesData<EmbyItemMetadata | null>(
        { queryKey: [...embyKeys.server(serverId), "nextUp"] },
        (old) => {
          if (!old || old.Id !== itemId) return old;
          return { ...old, UserData: mergeUserData(old.UserData) };
        },
      );
    }
  }
}
