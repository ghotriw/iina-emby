export interface EmbyImageUrlOptions {
  imageType?: "Primary" | "Backdrop" | "Thumb" | "Banner" | "Logo";
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  tag?: string;
  accessToken?: string;
}

export function getEmbyImageUrl(serverUrl: string, itemId: string, options?: EmbyImageUrlOptions): string {
  const cleanServer = serverUrl.replace(/\/+$/, "");
  const type = options?.imageType || "Primary";
  const params = new URLSearchParams();

  if (options?.maxWidth) params.set("maxWidth", String(options.maxWidth));
  if (options?.maxHeight) params.set("maxHeight", String(options.maxHeight));
  if (options?.quality) params.set("quality", String(options.quality));
  if (options?.tag) params.set("tag", options.tag);
  if (options?.accessToken) params.set("api_key", options.accessToken);

  const query = params.toString();
  return `${cleanServer}/Items/${encodeURIComponent(itemId)}/Images/${type}${query ? `?${query}` : ""}`;
}

export interface EmbyItemImageInfo {
  Id: string;
  SeriesId?: string;
  ImageTags?: Record<string, string>;
  BackdropImageTags?: string[];
  ParentThumbItemId?: string;
  ParentThumbImageTag?: string;
  ParentBackdropItemId?: string;
  ParentBackdropImageTags?: string[];
  SeriesPrimaryImageTag?: string;
  [key: string]: unknown;
}

export interface ItemImageUrlOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  accessToken?: string;
  /**
   * Priority strategy:
   * - "thumb": Favors landscape 16:9 images (Thumb -> Backdrop -> Parent Backdrop/Thumb -> Primary).
   *   Ideal for Continue Watching and horizontal media cards.
   * - "primary": Favors the item's primary image first (Primary -> Thumb -> Backdrop -> Parent images).
   *   Ideal for series detail page episodes or posters.
   */
  prefer?: "thumb" | "primary";
}

/**
 * Resolves the best available image URL for an Emby item with configurable priority and fallback hierarchy:
 * - "thumb" priority (default for cards/Continue Watching): Thumb -> Backdrop -> Parent Backdrop -> Parent Thumb -> Primary
 * - "primary" priority (for series detail view): Primary -> Thumb -> Backdrop -> Parent Backdrop/Thumb
 */
export function getItemImageUrl(serverUrl: string, item: EmbyItemImageInfo, options?: ItemImageUrlOptions): string | undefined {
  const cleanServer = serverUrl.replace(/\/+$/, "");
  const prefer = options?.prefer || "thumb";

  const { prefer: _, ...imageOptions } = options || {};

  if (prefer === "thumb") {
    // 1. Item Thumb (16:9 landscape)
    if (item.ImageTags?.Thumb) {
      return getEmbyImageUrl(cleanServer, item.Id, {
        imageType: "Thumb",
        tag: item.ImageTags.Thumb,
        ...imageOptions,
      });
    }

    // 2. Item Backdrop (16:9 widescreen)
    if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
      return getEmbyImageUrl(cleanServer, item.Id, {
        imageType: "Backdrop",
        tag: item.BackdropImageTags[0],
        ...imageOptions,
      });
    }

    // 3. Parent Series Backdrop for episodes
    if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length > 0) {
      return getEmbyImageUrl(cleanServer, item.ParentBackdropItemId, {
        imageType: "Backdrop",
        tag: item.ParentBackdropImageTags[0],
        ...imageOptions,
      });
    }

    // 4. Parent Series Thumb for episodes
    if (item.ParentThumbItemId && item.ParentThumbImageTag) {
      return getEmbyImageUrl(cleanServer, item.ParentThumbItemId, {
        imageType: "Thumb",
        tag: item.ParentThumbImageTag,
        ...imageOptions,
      });
    }

    // 5. Item Primary (fallback)
    if (item.ImageTags?.Primary) {
      return getEmbyImageUrl(cleanServer, item.Id, {
        imageType: "Primary",
        tag: item.ImageTags.Primary,
        ...imageOptions,
      });
    }

    // 6. Series Primary (fallback)
    if (item.SeriesId && item.SeriesPrimaryImageTag) {
      return getEmbyImageUrl(cleanServer, item.SeriesId, {
        imageType: "Primary",
        tag: item.SeriesPrimaryImageTag,
        ...imageOptions,
      });
    }

    return undefined;
  }

  // prefer === "primary" (e.g. series detail episode view or poster)
  // 1. Item Primary
  if (item.ImageTags?.Primary) {
    return getEmbyImageUrl(cleanServer, item.Id, {
      imageType: "Primary",
      tag: item.ImageTags.Primary,
      ...imageOptions,
    });
  }

  // 2. Item Thumb
  if (item.ImageTags?.Thumb) {
    return getEmbyImageUrl(cleanServer, item.Id, {
      imageType: "Thumb",
      tag: item.ImageTags.Thumb,
      ...imageOptions,
    });
  }

  // 3. Item Backdrop
  if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
    return getEmbyImageUrl(cleanServer, item.Id, {
      imageType: "Backdrop",
      tag: item.BackdropImageTags[0],
      ...imageOptions,
    });
  }

  // 4. Parent Backdrop
  if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length > 0) {
    return getEmbyImageUrl(cleanServer, item.ParentBackdropItemId, {
      imageType: "Backdrop",
      tag: item.ParentBackdropImageTags[0],
      ...imageOptions,
    });
  }

  // 5. Parent Thumb
  if (item.ParentThumbItemId && item.ParentThumbImageTag) {
    return getEmbyImageUrl(cleanServer, item.ParentThumbItemId, {
      imageType: "Thumb",
      tag: item.ParentThumbImageTag,
      ...imageOptions,
    });
  }

  // 6. Series Primary
  if (item.SeriesId && item.SeriesPrimaryImageTag) {
    return getEmbyImageUrl(cleanServer, item.SeriesId, {
      imageType: "Primary",
      tag: item.SeriesPrimaryImageTag,
      ...imageOptions,
    });
  }

  return undefined;
}
