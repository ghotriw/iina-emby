import type { ClientIdentity } from "./types/emby";

export const CLIENT_NAME = "IINA Emby Plugin";
export const DEVICE_NAME = "IINA";
export const CLIENT_VERSION = "0.1.0";

export const DEFAULT_CLIENT_IDENTITY: ClientIdentity = {
  clientName: CLIENT_NAME,
  deviceName: DEVICE_NAME,
  deviceId: "iina-emby",
  version: CLIENT_VERSION,
};
