import { useCallback } from "react";

export type PopoverPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export interface UsePopoverPositionOptions {
  triggerRef: React.RefObject<HTMLElement | null>;
  popoverRef: React.RefObject<HTMLElement | null>;
  placement?: PopoverPlacement;
  /** Gap between trigger and popover in px. Defaults to 6. */
  offset?: number;
  /** Minimum padding to viewport edges in px. Defaults to 8. */
  viewportPadding?: number;
}

export function usePopoverPosition({
  triggerRef,
  popoverRef,
  placement = "bottom-end",
  offset = 6,
  viewportPadding = 8,
}: UsePopoverPositionOptions) {
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const tr = trigger.getBoundingClientRect();
    const mr = popover.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let [side, align] = placement.split("-") as ["bottom" | "top", "start" | "end"];

    // Flip vertically if there's not enough room.
    if (side === "bottom" && tr.bottom + offset + mr.height > vh && tr.top - offset - mr.height >= 0) {
      side = "top";
    } else if (side === "top" && tr.top - offset - mr.height < 0 && tr.bottom + offset + mr.height <= vh) {
      side = "bottom";
    }

    let top = side === "bottom" ? tr.bottom + offset : tr.top - offset - mr.height;
    let left = align === "start" ? tr.left : tr.right - mr.width;

    left = Math.min(Math.max(left, viewportPadding), vw - mr.width - viewportPadding);
    top = Math.min(Math.max(top, viewportPadding), vh - mr.height - viewportPadding);

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.dataset.side = side;
  }, [triggerRef, popoverRef, placement, offset, viewportPadding]);

  return { updatePosition };
}
