import type { EmbyItemMetadata } from "@shared";
import { IconCheck } from "@tabler/icons-react";
import { ConfirmModal } from "./ui/ConfirmModal";
import { DropdownMenu } from "./ui/DropdownMenu";

export interface PlayedConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: EmbyItemMetadata;
  isPlayed: boolean;
  isLoading?: boolean;
}

export function PlayedConfirmModal({ opened, onClose, onConfirm, item, isPlayed, isLoading = false }: PlayedConfirmModalProps) {
  if (!opened) return null;

  const isSeries = item.Type === "Series";
  const name = item.Name || (isSeries ? "this series" : "this item");
  const actionText = isPlayed ? "unplayed" : "played";

  return (
    <ConfirmModal
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isPlayed ? "Mark as unplayed" : "Mark as played"}
      message={
        isSeries
          ? `Are you sure you want to mark "${name}" and all its episodes as ${actionText}?`
          : `Are you sure you want to mark "${name}" as ${actionText}?`
      }
      confirmLabel={isPlayed ? "Mark as unplayed" : "Mark as played"}
      confirmVariant={isPlayed ? "danger" : "primary"}
      isLoading={isLoading}
    />
  );
}

export interface TogglePlayedMenuItemProps {
  isPlayed: boolean;
  isUpdating?: boolean;
  onSelect: () => void;
}

export function TogglePlayedMenuItem({ isPlayed, isUpdating = false, onSelect }: TogglePlayedMenuItemProps) {
  return (
    <DropdownMenu.Item icon={<IconCheck size={16} />} disabled={isUpdating} onSelect={onSelect}>
      {isPlayed ? "Mark as unplayed" : "Mark as played"}
    </DropdownMenu.Item>
  );
}
