import { IconX } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import classes from "./Modal.module.css";

export interface ModalProps {
  opened: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  withCloseButton?: boolean;
  size?: string | number;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  classNames?: {
    content?: string;
    overlay?: string;
  };
}

export function Modal({
  opened,
  onClose,
  children,
  withCloseButton = false,
  size,
  closeOnClickOutside = true,
  closeOnEscape = true,
  classNames,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [opened, closeOnEscape, onClose]);

  if (!opened) return null;

  const widthStyle = size ? (typeof size === "number" ? `${size}px` : size) : "32rem";

  return createPortal(
    <div className={`${classes.overlay} ${classNames?.overlay || ""}`}>
      <div
        className={classes.backdrop}
        onClick={() => {
          if (closeOnClickOutside) onClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={`${classes.content} ${classNames?.content || ""}`.trim()}
        style={{ width: widthStyle }}
        role="dialog"
        aria-modal="true"
      >
        {withCloseButton && (
          <Button iconOnly onClick={onClose} aria-label="Close dialog" title="Close" className={classes.closeButton}>
            <IconX size={15} stroke={2} />
          </Button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
