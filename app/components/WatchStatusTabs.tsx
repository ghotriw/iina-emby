import type { SectionFilter } from "../lib/emby-library-client";
import styles from "./WatchStatusTabs.module.css";

export interface FilterTabOption {
  id: SectionFilter;
  label: string;
}

export const WATCH_STATUS_TABS: FilterTabOption[] = [
  { id: "all", label: "All" },
  { id: "unplayed", label: "Unplayed" },
  { id: "inprogress", label: "In Progress" },
  { id: "played", label: "Played" },
];

export interface WatchStatusTabsProps {
  value: SectionFilter;
  onChange: (filter: SectionFilter) => void;
  className?: string;
}

export function WatchStatusTabs({ value, onChange, className }: WatchStatusTabsProps) {
  return (
    <div className={`${styles.toolbar} ${className || ""}`} role="tablist" aria-label="Filter media by watch status">
      {WATCH_STATUS_TABS.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ""}`}
            onClick={() => {
              if (!isActive) {
                onChange(tab.id);
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
