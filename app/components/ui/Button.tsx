import type React from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: () => void;
  glyph?: string;
  iconOnly?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  glyph,
  iconOnly = false,
  size = "md",
  variant = "default",
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClass = variant === "primary" ? styles.buttonPrimary : variant === "danger" ? styles.buttonDanger : "";
  const glyphClass = glyph ? styles.hasGlyph : "";

  return (
    <button
      type={type}
      className={`
        ${styles.button}
        ${size === "sm" ? styles.buttonSm : ""}
        ${iconOnly ? styles.iconButton : ""}
        ${variantClass}
        ${glyphClass}
        ${className}
      `.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
      {glyph && <span className={styles.glyph}>{glyph}</span>}
    </button>
  );
}
