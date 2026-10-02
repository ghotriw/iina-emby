import { IconChevronDown } from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import classes from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  data: (string | SelectOption)[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  allowDeselect?: boolean;
  className?: string;
  placeholder?: string;
  comboboxProps?: Record<string, unknown>;
}

export function Select({ data, value, onChange, allowDeselect = false, className, placeholder = "Select..." }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = data.map((item) => (typeof item === "string" ? { value: item, label: item } : item));

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    if (allowDeselect && optValue === value) {
      onChange?.(null);
    } else {
      onChange?.(optValue);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`${classes.container} ${className || ""}`}>
      <button
        type="button"
        className={classes.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={classes.value}>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={`${classes.chevron} ${isOpen ? classes.chevronOpen : ""}`}>
          <IconChevronDown size={14} stroke={2} />
        </span>
      </button>

      {isOpen && (
        <div className={classes.dropdown} role="listbox">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${classes.option} ${isSelected ? classes.optionSelected : ""}`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
