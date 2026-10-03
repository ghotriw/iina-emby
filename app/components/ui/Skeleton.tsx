import type React from "react";
import classes from "./Skeleton.module.css";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: number | string;
  width?: number | string;
  radius?: "xs" | "sm" | "md" | "lg" | "xl" | number | string;
  circle?: boolean;
}

const RADIUS_MAP: Record<string, string> = {
  xs: "0.125rem",
  sm: "var(--radius-m, 0.375rem)",
  md: "var(--radius-l, 0.5rem)",
  lg: "0.75rem",
  xl: "1rem",
};

export function Skeleton({ height, width, radius, circle, className, style, ...rest }: SkeletonProps) {
  const computedRadius = circle
    ? "50%"
    : typeof radius === "string" && RADIUS_MAP[radius]
      ? RADIUS_MAP[radius]
      : typeof radius === "number"
        ? `${radius}px`
        : radius;

  return (
    <div
      className={`${classes.skeleton} ${circle ? classes.circle : ""} ${className || ""}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
        borderRadius: computedRadius,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}
