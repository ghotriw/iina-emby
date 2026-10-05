import type React from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: () => void;
  glyph?: string;
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({ children, onClick, glyph, iconOnly = false, disabled, className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.button} ${iconOnly ? styles.iconButton : ""} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
      {glyph && <span className={styles.glyph}>{glyph}</span>}
    </button>
  );
}
