import type React from "react";
import { forwardRef } from "react";
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
      ...props
    }: GlassElementProps<E>,
    ref: React.Ref<HTMLElement>,
  ) => {
    const Component = as || "button";
    const isInteractive =
      interactive !== undefined
        ? interactive
        : Component === "button" || Component === "a" || Boolean((props as { onClick?: unknown }).onClick);

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
      isInteractive ? styles.interactive : styles.nonInteractive,
      fullWidth ? styles.fullWidth : "",
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    const componentProps: Record<string, unknown> = {
      ref,
      className: classNames,
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
        {leftSection && <span className={styles.section}>{leftSection}</span>}
        {children}
        {rightSection && <span className={styles.section}>{rightSection}</span>}
      </Component>
    );
  },
);

GlassElement.displayName = "GlassElement";
