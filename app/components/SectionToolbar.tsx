import { IconSearch, IconSortAscending, IconSortDescending, IconX } from "@tabler/icons-react";
import type { SectionFilter, SectionSortBy, SectionSortOrder } from "../lib/section-items";
import styles from "./SectionToolbar.module.css";
import { Button } from "./ui/Button";
import { Select, type SelectOption } from "./ui/Select";

export const WATCH_STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "All" },
  { value: "unplayed", label: "Unplayed" },
  { value: "inprogress", label: "In Progress" },
  { value: "played", label: "Played" },
];

export const SORT_CRITERIA_OPTIONS: SelectOption[] = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date Added" },
  { value: "year", label: "Release Year" },
  { value: "rating", label: "Rating" },
];

export interface SectionToolbarProps {
  /** Watch status filter value */
  filter?: SectionFilter;
  /** Callback on watch status filter change */
  onFilterChange?: (filter: SectionFilter) => void;

  /** Title search query */
  searchQuery?: string;
  /** Callback on search query change */
  onSearchQueryChange?: (query: string) => void;

  /** Sort criteria */
  sortBy?: SectionSortBy;
  /** Callback on sort criteria change */
  onSortByChange?: (sort: SectionSortBy) => void;

  /** Sort direction */
  sortOrder?: SectionSortOrder;
  /** Callback on sort direction change */
  onSortOrderChange?: (order: SectionSortOrder) => void;

  className?: string;
}

export function SectionToolbar({
  filter = "all",
  onFilterChange,
  searchQuery = "",
  onSearchQueryChange,
  sortBy = "name",
  onSortByChange,
  sortOrder = "asc",
  onSortOrderChange,
  className,
}: SectionToolbarProps) {
  return (
    <div className={`${styles.toolbar} ${className || ""}`}>
      {/* Left: Watch Status Select */}
      <div className={styles.leftGroup}>
        <Select
          data={WATCH_STATUS_OPTIONS}
          value={filter}
          onChange={(val) => {
            if (val) {
              onFilterChange?.(val as SectionFilter);
            }
          }}
          size="sm"
          placement="bottom-start"
        />
      </div>

      {/* Center: Search by Title */}
      {onSearchQueryChange && (
        <div className={styles.centerGroup}>
          <div className={styles.searchWrapper}>
            <IconSearch size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onSearchQueryChange("");
                }
              }}
              placeholder="Search by title..."
              className={styles.searchInput}
              aria-label="Filter media by title"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => onSearchQueryChange("")}
                aria-label="Clear search"
                title="Clear"
              >
                <IconX size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Right: Sort Criteria Select + Direction Toggle Button */}
      {onSortByChange && (
        <div className={styles.rightGroup}>
          <Select
            data={SORT_CRITERIA_OPTIONS}
            value={sortBy}
            onChange={(val) => {
              if (val) {
                onSortByChange(val as SectionSortBy);
              }
            }}
            size="sm"
            placement="bottom-end"
          />

          {onSortOrderChange && (
            <Button
              iconOnly
              size="sm"
              onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
              title={sortOrder === "asc" ? "Sort ascending (click to invert)" : "Sort descending (click to invert)"}
              aria-label={sortOrder === "asc" ? "Sort ascending, click to sort descending" : "Sort descending, click to sort ascending"}
            >
              {sortOrder === "asc" ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
