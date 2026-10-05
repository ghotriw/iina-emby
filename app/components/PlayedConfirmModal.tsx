import type { EmbyItemMetadata } from "@shared";
import { IconCheck, IconEyeOff } from "@tabler/icons-react";
import { ConfirmModal } from "./ui/ConfirmModal";
import { DropdownMenu } from "./ui/DropdownMenu";

export interface PlayedConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: EmbyItemMetadata;
  action?: "played" | "unplayed";
  isPlayed?: boolean;
  isLoading?: boolean;
}

export function PlayedConfirmModal({ opened, onClose, onConfirm, item, action, isPlayed, isLoading = false }: PlayedConfirmModalProps) {
  if (!opened) return null;

  const targetAction: "played" | "unplayed" = action ?? (isPlayed ? "unplayed" : "played");
  const isMarkingPlayed = targetAction === "played";

  const isSeries = item.Type === "Series";
  const name = item.Name || (isSeries ? "this series" : "this item");
  const actionText = isMarkingPlayed ? "played" : "unplayed";

  return (
    <ConfirmModal
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isMarkingPlayed ? "Mark as played" : "Mark as unplayed"}
      message={
        isSeries
          ? `Are you sure you want to mark "${name}" and all its episodes as ${actionText}?`
          : `Are you sure you want to mark "${name}" as ${actionText}?`
      }
      confirmLabel={isMarkingPlayed ? "Mark as played" : "Mark as unplayed"}
      confirmVariant={isMarkingPlayed ? "primary" : "danger"}
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
    <DropdownMenu.Item icon={isPlayed ? <IconEyeOff size={16} /> : <IconCheck size={16} />} disabled={isUpdating} onSelect={onSelect}>
      {isPlayed ? "Mark as unplayed" : "Mark as played"}
    </DropdownMenu.Item>
  );
}

export interface MarkPlayedMenuItemProps {
  isUpdating?: boolean;
  onSelect: () => void;
}

export function MarkPlayedMenuItem({ isUpdating = false, onSelect }: MarkPlayedMenuItemProps) {
  return (
    <DropdownMenu.Item icon={<IconCheck size={16} />} disabled={isUpdating} onSelect={onSelect}>
      Mark as played
    </DropdownMenu.Item>
  );
}

export function MarkUnplayedMenuItem({ isUpdating = false, onSelect }: MarkPlayedMenuItemProps) {
  return (
    <DropdownMenu.Item icon={<IconEyeOff size={16} />} disabled={isUpdating} onSelect={onSelect}>
      Mark as unplayed
    </DropdownMenu.Item>
  );
}

export interface PlayStatusMenuItemsProps {
  canMarkPlayed: boolean;
  canMarkUnplayed: boolean;
  isUpdating?: boolean;
  onRequestMarkPlayed: () => void;
  onRequestMarkUnplayed: () => void;
}

export function PlayStatusMenuItems({
  canMarkPlayed,
  canMarkUnplayed,
  isUpdating = false,
  onRequestMarkPlayed,
  onRequestMarkUnplayed,
}: PlayStatusMenuItemsProps) {
  return (
    <>
      {canMarkPlayed && <MarkPlayedMenuItem isUpdating={isUpdating} onSelect={onRequestMarkPlayed} />}
      {canMarkUnplayed && <MarkUnplayedMenuItem isUpdating={isUpdating} onSelect={onRequestMarkUnplayed} />}
    </>
  );
}
