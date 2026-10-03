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

export const WINDOW_DIMENSIONS = {
  DEFAULT_WIDTH: 960,
  DEFAULT_HEIGHT: 680,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 400,
} as const;

export const WINDOW_PREF_KEYS = {
  WIDTH: "standalone_window_width",
  HEIGHT: "standalone_window_height",
} as const;
