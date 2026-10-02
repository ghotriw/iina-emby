import type { ClientIdentity } from "./types/emby";

declare const __PLUGIN_VERSION__: string | undefined;

export const CLIENT_NAME = "IINA Emby Plugin";
export const DEVICE_NAME = "IINA";
export const CLIENT_VERSION = typeof __PLUGIN_VERSION__ !== "undefined" ? __PLUGIN_VERSION__ : "0.1.0";

export const DEFAULT_CLIENT_IDENTITY: ClientIdentity = {
  clientName: CLIENT_NAME,
  deviceName: DEVICE_NAME,
  deviceId: "iina-emby",
  version: CLIENT_VERSION,
};
