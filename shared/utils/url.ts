/**
 * Normalizes a server URL by trimming whitespace, ensuring scheme,
 * stripping basic auth credentials, and removing trailing `/web` or `/`.
 */
export function cleanServerUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let cleaned = rawUrl.trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `http://${cleaned}`;
  }
  try {
    const parsed = new URL(cleaned);
    parsed.username = "";
    parsed.password = "";
    cleaned = parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    cleaned = cleaned.replace(/^(https?:\/\/)[^/@]+@/i, "$1");
  }
  return cleaned.replace(/\/web(?:\/.*)?$/i, "").replace(/\/$/, "");
}

/**
 * Compare two Emby base URLs by host and port, ignoring the scheme and any
 * trailing slash, so http/https of the same server still count as one server.
 */
export function isSameEmbyHost(left: string | null | undefined, right: string | null | undefined): boolean {
  const hostOf = (url: string | null | undefined) =>
    String(url || "")
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase();

  const leftHost = hostOf(left);
  return leftHost.length > 0 && leftHost === hostOf(right);
}

/**
 * Sanitizes stream URL: strips auth credentials and normalizes `ApiKey=` to `api_key=`.
 */
export function sanitizeStreamUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  let cleaned = rawUrl.trim();
  try {
    const parsed = new URL(cleaned);
    parsed.username = "";
    parsed.password = "";
    cleaned = parsed.toString();
  } catch {
    cleaned = cleaned.replace(/^(https?:\/\/)[^/@]+@/i, "$1");
  }
  // Emby requires api_key (lowercase)
  cleaned = cleaned.replace(/([?&])ApiKey=/i, "$1api_key=");
  return cleaned;
}
