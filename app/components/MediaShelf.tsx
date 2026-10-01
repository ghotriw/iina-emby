import { ActionIcon, Group } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import classes from "./MediaShelf.module.css";

export interface MediaShelfProps {
  /** Optional header title (string or custom React node) */
  title?: ReactNode;
  /** Optional right actions next to the title (e.g. reload button, view all) */
  rightSection?: ReactNode;
  /** Child elements to be rendered horizontally (e.g. MediaThumb cards) */
  children: ReactNode;
  /** Width of each item in pixels or CSS string, default 260 */
  itemWidth?: number | string;
  /** Gap between items in pixels, default 16 */
  gap?: number;
  /** Custom container class */
  className?: string;
  /** Optional message when children are empty */
  emptyText?: string;
}

export function MediaShelf({ title, rightSection, children, itemWidth = 260, gap = 16, className, emptyText }: MediaShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 3);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 3);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(260, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const childCount = React.Children.count(children);
  const showNavArrows = canScrollLeft || canScrollRight;

  return (
    <section className={`${classes.container} ${className || ""}`}>
      {(title || rightSection || showNavArrows) && (
        <div className={classes.header}>
          <div>{typeof title === "string" ? <h3 className={classes.title}>{title}</h3> : title}</div>

          <Group gap={6} align="center">
            {rightSection}
            {showNavArrows && (
              <>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  disabled={!canScrollLeft}
                  onClick={() => handleScroll("left")}
                  aria-label="Scroll left"
                >
                  <IconChevronLeft size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  disabled={!canScrollRight}
                  onClick={() => handleScroll("right")}
                  aria-label="Scroll right"
                >
                  <IconChevronRight size={18} />
                </ActionIcon>
              </>
            )}
          </Group>
        </div>
      )}

      {childCount > 0 ? (
        <div ref={scrollRef} className={classes.scroller} style={{ gap }}>
          {React.Children.map(children, (child) => {
            if (!child) return null;
            return (
              <div className={classes.itemWrapper} style={{ width: itemWidth }}>
                {child}
              </div>
            );
          })}
        </div>
      ) : emptyText ? (
        <div style={{ color: "var(--macos-text-tertiary)", fontSize: "var(--font-size-body)", padding: "0.5rem 0" }}>{emptyText}</div>
      ) : null}
    </section>
  );
}

// Convenient alias
export const MediaRow = MediaShelf;
