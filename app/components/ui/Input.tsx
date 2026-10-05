import type React from "react";
import { forwardRef } from "react";
import styles from "./Input.module.css";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md";
  error?: boolean | string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", error = false, leftSection, rightSection, className = "", wrapperClassName = "", disabled, ...props },
  ref,
) {
  const isError = Boolean(error);

  return (
    <div
      className={`
        ${styles.inputWrapper}
        ${size === "sm" ? styles.inputWrapperSm : ""}
        ${isError ? styles.inputWrapperError : ""}
        ${disabled ? styles.inputWrapperDisabled : ""}
        ${wrapperClassName}
      `.trim()}
    >
      {leftSection && <span className={styles.leftSection}>{leftSection}</span>}
      <input ref={ref} disabled={disabled} className={`${styles.input} ${className}`.trim()} {...props} />
      {rightSection && <span className={styles.rightSection}>{rightSection}</span>}
    </div>
  );
});
