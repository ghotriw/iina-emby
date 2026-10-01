import { CLIENT_NAME, CLIENT_VERSION, DEVICE_NAME } from "../constants";
import type { ClientIdentity } from "../types/emby";

/**
 * Builds standard Emby Authorization header format:
 * MediaBrowser Client="...", Device="...", DeviceId="...", Version="..."[, Token="..."]
 */
export function buildAuthorizationHeader(identity?: Partial<ClientIdentity>, token?: string): string {
  const parts = [
    `Client="${identity?.clientName || CLIENT_NAME}"`,
    `Device="${identity?.deviceName || DEVICE_NAME}"`,
    `DeviceId="${identity?.deviceId || "iina-emby"}"`,
    `Version="${identity?.version || CLIENT_VERSION}"`,
  ];
  if (token) {
    parts.push(`Token="${token}"`);
  }
  return `MediaBrowser ${parts.join(", ")}`;
}

/**
 * Builds a complete Emby HTTP headers object including Authorization and X-Emby-* headers.
 */
export function buildEmbyHeaders(
  identity?: Partial<ClientIdentity>,
  token?: string,
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  const auth = buildAuthorizationHeader(identity, token);
  const clientName = identity?.clientName || CLIENT_NAME;
  const deviceName = identity?.deviceName || DEVICE_NAME;
  const deviceId = identity?.deviceId || "iina-emby";
  const version = identity?.version || CLIENT_VERSION;

  const headers: Record<string, string> = {
    Authorization: auth,
    "X-Emby-Authorization": auth,
    "X-Emby-Client": clientName,
    "X-Emby-Device-Name": deviceName,
    "X-Emby-Device-Id": deviceId,
    "X-Emby-Client-Version": version,
    Accept: "application/json",
    ...(extraHeaders || {}),
  };

  if (token) {
    headers["X-Emby-Token"] = token;
  }

  return headers;
}
