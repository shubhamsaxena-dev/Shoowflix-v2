"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./tabs.module.css";

interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts must be rendered inside <Tabs>");
  return ctx;
}

const toId = (base: string, kind: "tab" | "panel", value: string) =>
  `${base}-${kind}-${value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

export interface TabsProps {
  /** Controlled value. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible tabs (WAI-ARIA pattern, automatic activation, roving tabindex).
 *
 * <Tabs defaultValue="overview">
 *   <TabList label="Movie sections"><Tab value="overview">Overview</Tab>…</TabList>
 *   <TabPanel value="overview">…</TabPanel>
 * </Tabs>
 */
export function Tabs({ value: controlled, defaultValue = "", onValueChange, children, className }: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const baseId = useId();
  const select = useCallback(
    (next: string) => {
      if (controlled === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );
  return (
    <TabsContext.Provider value={{ value, select, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({
  label,
  children,
  className,
  variant = "underline",
}: {
  /** Accessible name for the tab list. */
  label: string;
  children: ReactNode;
  className?: string;
  variant?: "underline" | "pill";
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    let next = -1;
    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === -1) return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  };
  return (
    <div role="tablist" aria-label={label} className={cx(styles.list, styles[variant], className)} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

export function Tab({
  value,
  children,
  disabled,
  className,
}: {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const ctx = useTabs();
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={toId(ctx.baseId, "tab", value)}
      aria-selected={selected}
      aria-controls={toId(ctx.baseId, "panel", value)}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      className={cx(styles.tab, className)}
      onClick={() => ctx.select(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({
  value,
  children,
  className,
  /** Keep the panel mounted (hidden) when inactive. */
  keepMounted,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  keepMounted?: boolean;
}) {
  const ctx = useTabs();
  const selected = ctx.value === value;
  if (!selected && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={toId(ctx.baseId, "panel", value)}
      aria-labelledby={toId(ctx.baseId, "tab", value)}
      hidden={!selected}
      tabIndex={0}
      className={cx(styles.panel, className)}
    >
      {children}
    </div>
  );
}
