import { describe, expect, it } from "vitest";
import { cleanServerUrl, isSameEmbyHost, sanitizeStreamUrl } from "./url";

describe("url utils", () => {
  describe("cleanServerUrl", () => {
    it("handles empty or invalid inputs", () => {
      expect(cleanServerUrl("")).toBe("");
      expect(cleanServerUrl(null)).toBe("");
      expect(cleanServerUrl(undefined)).toBe("");
    });

    it("adds http scheme if missing", () => {
      expect(cleanServerUrl("localhost:8096")).toBe("http://localhost:8096");
      expect(cleanServerUrl("192.168.1.100:8096/")).toBe("http://192.168.1.100:8096");
    });

    it("strips trailing slashes and /web paths", () => {
      expect(cleanServerUrl("http://myemby.local:8096/web/index.html")).toBe("http://myemby.local:8096");
      expect(cleanServerUrl("http://myemby.local:8096/web")).toBe("http://myemby.local:8096");
      expect(cleanServerUrl("https://emby.example.com/")).toBe("https://emby.example.com");
    });

    it("strips basic auth credentials", () => {
      expect(cleanServerUrl("http://user:pass@localhost:8096")).toBe("http://localhost:8096");
    });
  });

  describe("isSameEmbyHost", () => {
    it("compares hosts ignoring protocol and trailing slashes", () => {
      expect(isSameEmbyHost("http://localhost:8096", "https://localhost:8096/")).toBe(true);
      expect(isSameEmbyHost("http://emby.local:8096", "http://emby.local:8096/emby")).toBe(true);
      expect(isSameEmbyHost("http://server1:8096", "http://server2:8096")).toBe(false);
      expect(isSameEmbyHost("", null)).toBe(false);
    });
  });

  describe("sanitizeStreamUrl", () => {
    it("normalizes ApiKey to api_key", () => {
      expect(sanitizeStreamUrl("http://localhost:8096/Videos/123/stream?ApiKey=testtoken")).toBe(
        "http://localhost:8096/Videos/123/stream?api_key=testtoken",
      );
    });

    it("strips credentials from stream url", () => {
      expect(sanitizeStreamUrl("http://admin:secret@localhost:8096/Videos/123/stream?api_key=tok")).toBe(
        "http://localhost:8096/Videos/123/stream?api_key=tok",
      );
    });
  });
});
