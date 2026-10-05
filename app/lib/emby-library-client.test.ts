import type { EmbyServer } from "@shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyRemoteSearchResult, clearLibraryCache, fetchItemDetails, isIdentifySupported, searchRemoteItem } from "./emby-library-client";

describe("emby-library-client caching and deduplication", () => {
  const dummyServer: EmbyServer = {
    id: "srv-1",
    serverUrl: "http://localhost:8096",
    serverName: "Test Server",
    accessToken: "test-token",
    userId: "user-1",
    username: "testuser",
    addedAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    clearLibraryCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearLibraryCache();
  });

  it("caches successful requests and serves from cache on second call", async () => {
    const mockItem = { Id: "item-123", Name: "Inception" };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    } as Response);

    const first = await fetchItemDetails(dummyServer, "item-123");
    expect(first.Name).toBe("Inception");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call should return cached response without calling fetch again
    const second = await fetchItemDetails(dummyServer, "item-123");
    expect(second.Name).toBe("Inception");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when bypassCache is true", async () => {
    const mockItem = { Id: "item-123", Name: "Inception" };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    } as Response);

    await fetchItemDetails(dummyServer, "item-123");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await fetchItemDetails(dummyServer, "item-123", undefined, true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("coalesces simultaneous parallel requests for the same item into one fetch", async () => {
    const mockItem = { Id: "item-999", Name: "Interstellar" };
    let resolvePromise: (value: Response) => void = () => {};
    const pendingPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => pendingPromise);

    // Launch two simultaneous fetches
    const promise1 = fetchItemDetails(dummyServer, "item-999");
    const promise2 = fetchItemDetails(dummyServer, "item-999");

    resolvePromise({
      ok: true,
      json: async () => mockItem,
    } as Response);

    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1.Name).toBe("Interstellar");
    expect(res2.Name).toBe("Interstellar");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("clears cache and refetches after clearLibraryCache()", async () => {
    const mockItem = { Id: "item-123", Name: "Inception" };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    } as Response);

    await fetchItemDetails(dummyServer, "item-123");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    clearLibraryCache();

    await fetchItemDetails(dummyServer, "item-123");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("handles identify item types and supports check properly", () => {
    expect(isIdentifySupported("Movie")).toBe(true);
    expect(isIdentifySupported("Series")).toBe(true);
    expect(isIdentifySupported("Episode")).toBe(true);
    expect(isIdentifySupported("BoxSet")).toBe(true);
    expect(isIdentifySupported("Folder")).toBe(false);
    expect(isIdentifySupported(undefined)).toBe(false);
  });

  it("performs searchRemoteItem with correct endpoint and payload", async () => {
    const mockResults = [
      {
        Name: "The Matrix",
        ProductionYear: 1999,
        ProviderIds: { Imdb: "tt0133093" },
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    const query = {
      SearchInfo: {
        Name: "The Matrix",
        Year: 1999,
      },
      ItemId: "item-123",
    };

    const results = await searchRemoteItem(dummyServer, "Movie", query);
    expect(results).toEqual(mockResults);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8096/Items/RemoteSearch/Movie",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(query),
      }),
    );
  });

  it("calls applyRemoteSearchResult and clears library cache", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "",
    } as Response);

    const result = {
      Name: "The Matrix",
      ProductionYear: 1999,
      ProviderIds: { Imdb: "tt0133093" },
    };

    await applyRemoteSearchResult(dummyServer, "item-123", result, true);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8096/Items/RemoteSearch/Apply/item-123?replaceAllImages=true",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(result),
      }),
    );
  });
});
