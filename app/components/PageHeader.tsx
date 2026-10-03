import { IconChevronLeft, IconReload } from "@tabler/icons-react";
import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";
import { GlassElement } from "./ui/GlassElement";

export interface PageHeaderProps {
  onBack?: () => void;
  backTitle?: string;
  title?: ReactNode;
  showActiveDot?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightSection?: ReactNode;
  className?: string;
}

export function PageHeader({
  onBack,
  backTitle = "Back",
  title,
  showActiveDot = false,
  onRefresh,
  isRefreshing = false,
  rightSection,
  className,
}: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${className || ""}`}>
      <div className={styles.headerLeft}>
        {onBack && (
          <GlassElement variant="glass" shape="rounded" size="sm" isIconOnly onClick={onBack} title={backTitle} aria-label={backTitle}>
            <IconChevronLeft size={18} />
          </GlassElement>
        )}

        {title && (
          <GlassElement
            as="div"
            variant="glass"
            shape="rounded"
            size="sm"
            interactive={false}
            leftSection={showActiveDot ? <span className={styles.activeDot} /> : undefined}
            className={styles.badge}
          >
            {typeof title === "string" ? <span className={styles.titleText}>{title}</span> : title}
          </GlassElement>
        )}
      </div>

      <div className={styles.headerRight}>
        {rightSection}

        {onRefresh && (
          <GlassElement
            variant="glass"
            shape="rounded"
            size="sm"
            isIconOnly
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh"
            aria-label="Refresh content"
          >
            <IconReload size={16} className={isRefreshing ? styles.spinning : ""} />
          </GlassElement>
        )}
      </div>
    </header>
  );
}
