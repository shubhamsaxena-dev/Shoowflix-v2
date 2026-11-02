"use client";

import { Chip } from "@/components/ui/chip";
import { SORTS, type SortKey } from "./catalog";
import styles from "./discovery.module.css";

export function SortChips({ value, onChange }: { value: SortKey; onChange: (key: SortKey) => void }) {
  return (
    <div className={styles.sortChips} role="group" aria-label="Sort films">
      {SORTS.map((s) => (
        <Chip key={s.value} size="sm" pressed={value === s.value} onPressedChange={() => onChange(s.value)}>
          {s.label}
        </Chip>
      ))}
    </div>
  );
}
