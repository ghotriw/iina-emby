import type React from "react";
import { forwardRef, useCallback, useRef } from "react";
import styles from "./GlassElement.module.css";

export type GlassElementVariant = "primary" | "glass" | "ghost";
export type GlassElementSize = "sm" | "md" | "lg";
export type GlassElementShape = "pill" | "circle" | "rounded";

export interface GlassElementBaseProps {
  variant?: GlassElementVariant;
  size?: GlassElementSize;
  shape?: GlassElementShape;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  interactive?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
}

export type GlassElementProps<E extends React.ElementType = "button"> = GlassElementBaseProps & {
  as?: E;
} & Omit<React.ComponentPropsWithRef<E>, keyof GlassElementBaseProps | "as">;

export const GlassElement = forwardRef(
  <E extends React.ElementType = "button">(
    {
      as,
      variant = "glass",
      size = "md",
      shape = "pill",
      isIconOnly = false,
      fullWidth = false,
      interactive,
      leftSection,
      rightSection,
      className,
      children,
      disabled,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      ...props
    }: GlassElementProps<E>,
    forwardedRef: React.Ref<HTMLElement>,
  ) => {
    const Component = as || "button";
    const innerRef = useRef<HTMLElement | null>(null);
    const rectRef = useRef<DOMRect | null>(null);
    const rafIdRef = useRef<number | null>(null);

    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
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

    const isInteractive =
      interactive !== undefined
        ? interactive
        : Component === "button" || Component === "a" || Boolean((props as { onClick?: unknown }).onClick);

    const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
      if (!disabled && innerRef.current) {
        const r = innerRef.current.getBoundingClientRect();
        rectRef.current = r;
        setCursorProps(e.clientX, e.clientY, r);
      }
      onPointerEnter?.(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
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

    const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
      rectRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
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
      !isInteractive ? styles.nonInteractive : "",
      variantClass,
      shapeClass,
      sizeClass,
      fullWidth ? styles.fullWidth : "",
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    const componentProps: Record<string, unknown> = {
      ref: setRefs,
      className: classNames,
      onPointerEnter: handlePointerEnter,
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      ...props,
    };

    if (Component === "button") {
      componentProps.type = (props as { type?: string }).type || "button";
      componentProps.disabled = disabled;
    } else if (disabled) {
      componentProps["aria-disabled"] = true;
    }

    return (
      <Component {...componentProps}>
        <span className={styles.lens} aria-hidden="true" />
        <span className={styles.content}>
          {leftSection && <span className={styles.iconWrapper}>{leftSection}</span>}
          {children}
          {rightSection && <span className={styles.iconWrapper}>{rightSection}</span>}
        </span>
      </Component>
    );
  },
);

GlassElement.displayName = "GlassElement";

export const GlassButton = GlassElement;
export type GlassButtonVariant = GlassElementVariant;
export type GlassButtonSize = GlassElementSize;
export type GlassButtonShape = GlassElementShape;
export type GlassButtonProps = GlassElementProps<"button">;
