import type React from "react";
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./GlassButton.module.css";

export type GlassButtonVariant = "primary" | "glass" | "ghost";
export type GlassButtonSize = "sm" | "md" | "lg";
export type GlassButtonShape = "pill" | "circle" | "rounded";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  shape?: GlassButtonShape;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  /** Refraction strength. 0 — disabled, 1 — default, 2 — strong. */
  refraction?: number;
  /** Chromatic aberration strength at the rim (0–1). Default 0.14. */
  dispersion?: number;
}

/* Feature detection                                                   */

/**
 * `backdrop-filter: url(#svg-filter)` is only supported in Chromium.
 * Safari and Firefox ignore SVG filters in backdrop-filter, so they
 * fall back to standard blur + saturate (see CSS).
 */
function detectRefractionSupport(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isChromium = /Chrome|Chromium|CriOS|Edg\//.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isSafari = /Safari/.test(ua) && !isChromium;
  return isChromium && !isFirefox && !isSafari;
}

/* Displacement map                                                    */

/**
 * Displacement map: R for X, B for Y.
 * Edges follow a gradient (0 -> 255) while center is neutral 128,
 * so the backdrop is distorted only across the bezel band.
 */
function buildDisplacementMap(w: number, h: number, radius: number, bezel: number): string {
  const inner = Math.max(radius - bezel, 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="gx" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/>
    </linearGradient>
    <linearGradient id="gy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#00f"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${(bezel / 2.2).toFixed(2)}"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="#000"/>
  <rect width="${w}" height="${h}" fill="url(#gx)" style="mix-blend-mode:screen"/>
  <rect width="${w}" height="${h}" fill="url(#gy)" style="mix-blend-mode:screen"/>
  <rect x="${bezel}" y="${bezel}" width="${Math.max(w - bezel * 2, 0)}" height="${Math.max(h - bezel * 2, 0)}"
        rx="${inner}" fill="rgb(128,0,128)" filter="url(#soft)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* Component                                                           */

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "glass",
      size = "md",
      shape = "pill",
      isIconOnly = false,
      fullWidth = false,
      leftSection,
      rightSection,
      refraction = 1,
      dispersion = 0.14,
      className,
      children,
      type = "button",
      onPointerMove,
      onPointerLeave,
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = useRef<HTMLButtonElement | null>(null);
    const filterId = `glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

    const [supported, setSupported] = useState(false);
    const [box, setBox] = useState<{ w: number; h: number } | null>(null);

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    useEffect(() => {
      setSupported(detectRefractionSupport());
    }, []);

    // Button size is measured to generate an exact displacement map matching its bounds.
    useEffect(() => {
      const el = innerRef.current;
      if (!el || !supported || refraction <= 0) return;
      const measure = () => {
        const r = el.getBoundingClientRect();
        const w = Math.round(el.offsetWidth || r.width);
        const h = Math.round(el.offsetHeight || r.height);
        setBox((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [supported, refraction]);

    const useRefraction = supported && refraction > 0 && box !== null && box.w > 0 && box.h > 0;

    const filter = useMemo(() => {
      if (!useRefraction || !box) return null;
      const radius = shape === "circle" ? Math.min(box.w, box.h) / 2 : shape === "rounded" ? 12 : box.h / 2;
      const bezel = Math.max(6, Math.min(box.h * 0.42, 16));
      const scale = bezel * 2.4 * refraction;
      return {
        w: box.w,
        h: box.h,
        map: buildDisplacementMap(box.w, box.h, radius, bezel),
        sR: scale * (1 + dispersion),
        sG: scale,
        sB: scale * (1 - dispersion),
      };
    }, [useRefraction, box, shape, refraction, dispersion]);

    /* Specular sheen and rim highlight track the cursor. Written directly to CSS variables
       without triggering React re-renders. */
    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      const el = innerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const dx = x - r.width / 2;
        const dy = y - r.height / 2;
        const angle = (Math.atan2(dx, -dy) * 180) / Math.PI + 180;
        el.style.setProperty("--mx", `${((x / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${((y / r.height) * 100).toFixed(1)}%`);
        el.style.setProperty("--rim-angle", `${angle.toFixed(0)}deg`);
      }
      onPointerMove?.(e);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      const el = innerRef.current;
      if (el) {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
        el.style.removeProperty("--rim-angle");
      }
      onPointerLeave?.(e);
    };

    const variantClass = variant === "primary" ? styles.variantPrimary : variant === "ghost" ? styles.variantGhost : styles.variantGlass;

    const shapeClass = shape === "circle" ? styles.shapeCircle : shape === "rounded" ? styles.shapeRounded : styles.shapePill;

    let sizeClass = styles.sizeMd;
    if (isIconOnly) {
      if (size === "sm") sizeClass = styles.iconSm;
      else if (size === "lg") sizeClass = styles.iconLg;
      else sizeClass = styles.iconMd;
    } else {
      if (size === "sm") sizeClass = styles.sizeSm;
      else if (size === "lg") sizeClass = styles.sizeLg;
    }

    const classNames = [
      styles.button,
      variantClass,
      shapeClass,
      sizeClass,
      fullWidth ? styles.fullWidth : "",
      filter ? styles.refract : "",
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    const lensStyle: React.CSSProperties | undefined = filter
      ? {
          backdropFilter: `url(#${filterId}) blur(var(--lens-blur-r)) saturate(var(--lens-sat))`,
          WebkitBackdropFilter: `url(#${filterId}) blur(var(--lens-blur-r)) saturate(var(--lens-sat))`,
        }
      : undefined;

    return (
      <button
        ref={setRefs}
        type={type}
        className={classNames}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        {filter && (
          <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
            <defs>
              <filter
                id={filterId}
                filterUnits="userSpaceOnUse"
                primitiveUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={filter.w}
                height={filter.h}
                colorInterpolationFilters="sRGB"
              >
                <feImage href={filter.map} x="0" y="0" width={filter.w} height={filter.h} preserveAspectRatio="none" result="map" />

                {/* Displace each color channel with slightly different scale for chromatic edge dispersion */}
                <feDisplacementMap in="SourceGraphic" in2="map" scale={filter.sR} xChannelSelector="R" yChannelSelector="B" result="dR" />
                <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />

                <feDisplacementMap in="SourceGraphic" in2="map" scale={filter.sG} xChannelSelector="R" yChannelSelector="B" result="dG" />
                <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />

                <feDisplacementMap in="SourceGraphic" in2="map" scale={filter.sB} xChannelSelector="R" yChannelSelector="B" result="dB" />
                <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />

                <feBlend in="r" in2="g" mode="screen" result="rg" />
                <feBlend in="rg" in2="b" mode="screen" />
              </filter>
            </defs>
          </svg>
        )}

        <span className={styles.lens} style={lensStyle} aria-hidden="true" />

        <span className={styles.content}>
          {leftSection && <span className={styles.iconWrapper}>{leftSection}</span>}
          {children}
          {rightSection && <span className={styles.iconWrapper}>{rightSection}</span>}
        </span>
      </button>
    );
  },
);

GlassButton.displayName = "GlassButton";
