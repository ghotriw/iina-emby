import type { EmbyServer } from "@shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildWebSocketUrl, embyWebSocket, onItemUpdated, onLibraryChanged, onUserDataChanged } from "./emby-websocket-client";

class MockWebSocket {
  public static instances: MockWebSocket[] = [];
  public static OPEN = 1;
  public static CONNECTING = 0;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public url: string;
  public readyState = MockWebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((error: unknown) => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  public open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  public send(msg: string) {
    this.sentMessages.push(msg);
  }

  public close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  public emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe("emby-websocket-client", () => {
  const dummyServer: EmbyServer = {
    id: "test-server-1",
    serverName: "Home Emby",
    serverUrl: "http://localhost:8096",
    accessToken: "test-token-xyz",
    userId: "user-456",
    username: "testuser",
    addedAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    embyWebSocket.disconnect();
  });

  afterEach(() => {
    embyWebSocket.disconnect();
    vi.unstubAllGlobals();
  });

  it("builds correct WebSocket URL with ws: and parameters", () => {
    const url = buildWebSocketUrl(dummyServer, "custom-device");
    expect(url).toBe("ws://localhost:8096/embywebsocket?api_key=test-token-xyz&deviceId=custom-device");

    const httpsServer: EmbyServer = {
      ...dummyServer,
      serverUrl: "https://emby.example.com/emby/",
    };
    const secureUrl = buildWebSocketUrl(httpsServer);
    expect(secureUrl).toBe("wss://emby.example.com/emby/embywebsocket?api_key=test-token-xyz&deviceId=iina-emby-react");
  });

  it("connects and sends subscription messages on open", () => {
    embyWebSocket.connect(dummyServer);

    expect(MockWebSocket.instances).toHaveLength(1);
    const ws = MockWebSocket.instances[0];

    ws.open();
    expect(ws.sentMessages).toContain(JSON.stringify({ MessageType: "LibraryChangedStart" }));
    expect(ws.sentMessages).toContain(JSON.stringify({ MessageType: "UserDataChangedStart" }));
  });

  it("dispatches LibraryChanged and item specific listeners", () => {
    embyWebSocket.connect(dummyServer);
    const ws = MockWebSocket.instances[0];
    ws.open();

    const libraryListener = vi.fn();
    const itemListener = vi.fn();
    const otherItemListener = vi.fn();

    const unsubLib = onLibraryChanged(libraryListener);
    const unsubItem = onItemUpdated("movie-123", itemListener);
    const unsubOther = onItemUpdated("other-456", otherItemListener);

    ws.emitMessage({
      MessageType: "LibraryChanged",
      Data: {
        ItemsUpdated: ["movie-123"],
      },
    });

    expect(libraryListener).toHaveBeenCalledWith(
      expect.objectContaining({
        ItemsUpdated: ["movie-123"],
      }),
    );
    expect(itemListener).toHaveBeenCalledTimes(1);
    expect(otherItemListener).not.toHaveBeenCalled();

    unsubLib();
    unsubItem();
    unsubOther();
  });

  it("dispatches UserDataChanged to relevant item listeners", () => {
    embyWebSocket.connect(dummyServer);
    const ws = MockWebSocket.instances[0];
    ws.open();

    const userDataListener = vi.fn();
    const itemListener = vi.fn();

    const unsubUser = onUserDataChanged(userDataListener);
    const unsubItem = onItemUpdated("series-789", itemListener);

    ws.emitMessage({
      MessageType: "UserDataChanged",
      Data: {
        UserId: "user-456",
        UserDataList: [
          {
            ItemId: "series-789",
            Played: true,
          },
        ],
      },
    });

    expect(userDataListener).toHaveBeenCalledTimes(1);
    expect(itemListener).toHaveBeenCalledTimes(1);

    unsubUser();
    unsubItem();
  });

  it("replies to KeepAlive from server", () => {
    embyWebSocket.connect(dummyServer);
    const ws = MockWebSocket.instances[0];
    ws.open();

    ws.emitMessage({ MessageType: "KeepAlive" });

    expect(ws.sentMessages).toContain(JSON.stringify({ MessageType: "KeepAlive" }));
  });
});
