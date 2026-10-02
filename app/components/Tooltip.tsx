import type React from "react";
import classes from "./Tooltip.module.css";

export interface TooltipProps {
  label: React.ReactNode;
  children: React.ReactElement;
}

export function Tooltip({ label, children }: TooltipProps) {
  if (!label) return children;

  return (
    <span className={classes.wrapper}>
      {children}
      <span className={classes.tooltip} role="tooltip">
        {label}
      </span>
    </span>
  );
}
