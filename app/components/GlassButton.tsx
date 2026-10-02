import type React from "react";
import { forwardRef, useCallback, useRef } from "react";
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
}

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
      className,
      children,
      type = "button",
      disabled,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = useRef<HTMLButtonElement | null>(null);
    const rectRef = useRef<DOMRect | null>(null);
    const rafIdRef = useRef<number | null>(null);

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    const setCursorProps = (clientX: number, clientY: number, r: DOMRect) => {
      const el = innerRef.current;
      if (!el || r.width === 0 || r.height === 0) return;

      const x = clientX - r.left;
      const y = clientY - r.top;
      const dx = x - r.width / 2;
      const dy = y - r.height / 2;
      const angle = (Math.atan2(dx, -dy) * 180) / Math.PI + 180;

      el.style.setProperty("--mx", `${((x / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((y / r.height) * 100).toFixed(1)}%`);
      el.style.setProperty("--rim-angle", `${angle.toFixed(0)}deg`);
    };

    const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled && innerRef.current) {
        const r = innerRef.current.getBoundingClientRect();
        rectRef.current = r;
        setCursorProps(e.clientX, e.clientY, r);
      }
      onPointerEnter?.(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled && innerRef.current) {
        let r = rectRef.current;
        if (!r) {
          r = innerRef.current.getBoundingClientRect();
          rectRef.current = r;
        }

        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            const currentRect = rectRef.current;
            if (currentRect) {
              setCursorProps(clientX, clientY, currentRect);
            }
          });
        }
      }
      onPointerMove?.(e);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      rectRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      onPointerLeave?.(e);
    };

    const variantClass =
      variant === "primary" ? styles.variantPrimary : variant === "ghost" ? styles.variantGhost : styles.variantGlass;

    const shapeClass =
      shape === "circle" ? styles.shapeCircle : shape === "rounded" ? styles.shapeRounded : styles.shapePill;

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
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={setRefs}
        type={type}
        disabled={disabled}
        className={classNames}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <span className={styles.lens} aria-hidden="true" />
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
