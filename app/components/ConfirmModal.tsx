import { Button, Group, type MantineColor, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type React from "react";

export interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: MantineColor;
  isLoading?: boolean;
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = "Confirm action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmColor = "red",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="sm" closeOnClickOutside={!isLoading} closeOnEscape={!isLoading}>
      <Stack gap="md">
        <Group align="flex-start" wrap="nowrap" gap="sm">
          <ThemeIcon color={confirmColor} variant="light" size="lg" radius="xl">
            <IconAlertTriangle size={20} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        </Group>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button variant="default" onClick={onClose} disabled={isLoading} size="xs">
            {cancelLabel}
          </Button>
          <Button color={confirmColor} onClick={onConfirm} loading={isLoading} size="xs">
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
