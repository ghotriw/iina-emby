import type React from "react";
import { createContext, useCallback, useContext, useId, useLayoutEffect, useRef, useState } from "react";
import { type PopoverPlacement, usePopoverPosition } from "../../hooks/usePopoverPosition";
import classes from "./DropdownMenu.module.css";

export type DropdownMenuPlacement = PopoverPlacement;
export type Placement = DropdownMenuPlacement;

interface TriggerProps {
  ref: React.Ref<HTMLButtonElement>;
  onClick: (e: React.MouseEvent) => void;
  onPointerDown: () => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  "aria-controls": string;
}

export interface DropdownMenuProps {
  /** Render prop for the trigger button — spread the given props onto a <button>. */
  trigger: (props: TriggerProps) => React.ReactElement;
  children: React.ReactNode;
  placement?: DropdownMenuPlacement;
  /** Gap between trigger and menu in px. */
  offset?: number;
  className?: string;
}

const MenuContext = createContext<{ close: () => void } | null>(null);

export function DropdownMenu({ trigger, children, placement = "bottom-end", offset = 6, className }: DropdownMenuProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const openedByKeyboard = useRef(false);
  // Light-dismiss closes the popover on pointerdown, before the trigger click fires.
  // Remember the state so a second click on the trigger closes the menu instead of reopening it.
  const wasOpenOnPointerDown = useRef(false);

  const close = useCallback(() => {
    menuRef.current?.hidePopover();
  }, []);

  const { updatePosition } = usePopoverPosition({
    triggerRef,
    popoverRef: menuRef,
    placement,
    offset,
  });

  // Sync React state with native popover state (light-dismiss, Esc, etc.).
  useLayoutEffect(() => {
    const m = menuRef.current;
    if (!m) return;
    const onToggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (!isOpen) {
        const active = document.activeElement;
        // Don't steal focus if user intentionally clicked another element outside
        if (active && active !== document.body && !m.contains(active)) {
          return;
        }
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    m.addEventListener("toggle", onToggle);
    return () => m.removeEventListener("toggle", onToggle);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const m = menuRef.current;
    // Keyboard open: focus first item. Mouse open: focus the container so arrows still work without highlighting.
    const first = openedByKeyboard.current ? m?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') : null;
    (first ?? m)?.focus({ preventScroll: true });
    const onScrollOrResize = () => close();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition, close]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const m = menuRef.current;
    if (!m) return;
    const wasOpen = wasOpenOnPointerDown.current || m.matches(":popover-open");
    wasOpenOnPointerDown.current = false;
    if (wasOpen) m.hidePopover();
    else {
      openedByKeyboard.current = e.detail === 0;
      m.showPopover();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (e.key === "ArrowDown") next = (idx + 1) % items.length;
    else if (e.key === "ArrowUp") next = idx === -1 ? items.length - 1 : (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Tab") close();
    if (next !== null) {
      e.preventDefault();
      items[next].focus();
    }
  };

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: handleTriggerClick,
        onPointerDown: () => {
          wasOpenOnPointerDown.current = !!menuRef.current?.matches(":popover-open");
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
      })}
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        tabIndex={-1}
        role="menu"
        className={`${classes.menu} ${className || ""}`}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {open && <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>}
      </div>
    </>
  );
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  /** Keep the menu open after selection. */
  keepOpen?: boolean;
}

function Item({ children, onSelect, icon, disabled, danger, keepOpen }: DropdownMenuItemProps) {
  const ctx = useContext(MenuContext);
  const handle = () => {
    if (disabled) return;
    onSelect?.();
    if (!keepOpen) ctx?.close();
  };
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={`${classes.item} ${danger ? classes.danger : ""}`}
      onClick={handle}
    >
      {icon && <span className={classes.icon}>{icon}</span>}
      <span className={classes.label}>{children}</span>
    </button>
  );
}

function Divider() {
  return <hr className={classes.divider} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className={classes.groupLabel}>{children}</div>;
}

DropdownMenu.Item = Item;
DropdownMenu.Divider = Divider;
DropdownMenu.Label = Label;

export const DropdownMenuItem = Item;
export const DropdownMenuDivider = Divider;
export const DropdownMenuLabel = Label;
