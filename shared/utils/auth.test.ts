import { describe, expect, it } from "vitest";
import { buildAuthorizationHeader, buildEmbyHeaders } from "./auth";

describe("auth utils", () => {
  it("builds authorization header with defaults", () => {
    const header = buildAuthorizationHeader();
    expect(header).toContain('Client="IINA Emby Plugin"');
    expect(header).toContain('DeviceId="iina-emby"');
    expect(header).not.toContain("Token=");
  });

  it("includes token when provided", () => {
    const header = buildAuthorizationHeader({ deviceId: "my-mac" }, "token123");
    expect(header).toContain('DeviceId="my-mac"');
    expect(header).toContain('Token="token123"');
  });

  it("builds complete headers map with X-Emby-Token", () => {
    const headers = buildEmbyHeaders({ clientName: "TestClient" }, "secret-key", { "Custom-Header": "Value" });
    expect(headers.Authorization).toContain('Client="TestClient"');
    expect(headers["X-Emby-Authorization"]).toBe(headers.Authorization);
    expect(headers["X-Emby-Token"]).toBe("secret-key");
    expect(headers["X-Emby-Client"]).toBe("TestClient");
    expect(headers["Custom-Header"]).toBe("Value");
    expect(headers.Accept).toBe("application/json");
  });
});
