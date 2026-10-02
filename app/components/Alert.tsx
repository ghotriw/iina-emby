import type React from "react";
import classes from "./Alert.module.css";

export interface AlertProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  mb?: string | number;
  mx?: string | number;
  styles?: {
    root?: React.CSSProperties;
    message?: React.CSSProperties;
    title?: React.CSSProperties;
  };
  className?: string;
  style?: React.CSSProperties;
}

const SPACING_MAP: Record<string, string> = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

function resolveSpacing(val?: string | number): string | undefined {
  if (val === undefined) return undefined;
  if (typeof val === "number") return `${val}px`;
  return SPACING_MAP[val] || val;
}

export function Alert({ icon, title, children, mb, mx, styles, className, style }: AlertProps) {
  const marginBottom = resolveSpacing(mb);
  const marginHorizontal = resolveSpacing(mx);

  return (
    <div
      className={`${classes.alert} ${className || ""}`}
      style={{
        ...(marginBottom ? { marginBottom } : {}),
        ...(marginHorizontal ? { marginLeft: marginHorizontal, marginRight: marginHorizontal } : {}),
        ...style,
        ...styles?.root,
      }}
      role="alert"
    >
      {icon && <div className={classes.icon}>{icon}</div>}
      <div className={classes.body}>
        {title && (
          <div className={classes.title} style={styles?.title}>
            {title}
          </div>
        )}
        {children && (
          <div className={classes.message} style={styles?.message}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
