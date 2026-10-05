import type React from "react";
import { Button } from "./Button";
import styles from "./ConfirmModal.module.css";
import { Modal } from "./Modal";

export interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="22rem"
      closeOnClickOutside={!isLoading}
      closeOnEscape={!isLoading}
      classNames={{
        content: styles.modalContent,
      }}
    >
      <div className={styles.body}>
        {title && <h4 className={styles.title}>{title}</h4>}
        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.actions}>
          <Button size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button size="sm" variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
