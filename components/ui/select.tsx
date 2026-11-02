"use client";

import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/movie-utils";
import { useField } from "./input";
import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  /** Convenience: render options from data. Children are used when omitted. */
  options?: SelectOption[];
  size?: "sm" | "md";
}

/** Styled native <select>. Works inside <Field> (auto label wiring) or standalone with aria-label. */
export function Select({ options, size = "md", className, id, children, ...rest }: SelectProps) {
  const field = useField();
  return (
    <div className={cx(styles.wrap, size === "sm" && styles.sm, className)}>
      <select
        id={id ?? field?.id}
        aria-invalid={field?.invalid || undefined}
        aria-describedby={field?.describedBy}
        className={styles.select}
        {...rest}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className={styles.chevron} aria-hidden />
    </div>
  );
}
