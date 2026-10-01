import { Modal } from "@mantine/core";
import type React from "react";
import styles from "./ConfirmModal.module.css";

export interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      size="21.5rem"
      closeOnClickOutside={!isLoading}
      closeOnEscape={!isLoading}
      classNames={{
        content: styles.modalContent,
        overlay: styles.modalOverlay,
      }}
      transitionProps={{ transition: "pop", duration: 150 }}
    >
      <div className={styles.body}>
        {title && <h4 className={styles.title}>{title}</h4>}
        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.destructiveBtn}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
