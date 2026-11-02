"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { cx } from "@/lib/movie-utils";
import styles from "./toast.module.css";

export type ToastTone = "default" | "success" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss. Default 5000 (8000 when an action is present). */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const regionRef = useRef<HTMLElement>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = nextId.current++;
    setItems((list) => [...list, { ...opts, id }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  // Keep the region in the top layer (above open <dialog>s) whenever toasts are showing.
  useEffect(() => {
    const el = regionRef.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (items.length) {
        if (el.matches(":popover-open")) el.hidePopover();
        el.showPopover();
      } else if (el.matches(":popover-open")) {
        el.hidePopover();
      }
    } catch {
      /* popover unsupported — region still renders fixed-positioned */
    }
  }, [items]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section ref={regionRef} popover="manual" aria-label="Notifications" className={styles.region}>
        <ol role="list" className={styles.list} aria-live="polite" aria-relevant="additions">
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const { id, title, description, tone = "default", action } = item;
  const duration = item.duration ?? (action ? 8000 : 5000);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);

  useEffect(() => {
    if (paused || duration <= 0) return;
    const startedAt = Date.now();
    const t = window.setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, duration, id, onDismiss]);

  const Icon = tone === "success" ? CircleCheck : tone === "danger" ? CircleAlert : null;

  return (
    <li
      className={cx(styles.toast, styles[tone])}
      role={tone === "danger" ? "alert" : "status"}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ "--_duration": `${duration}ms` } as React.CSSProperties}
      data-paused={paused || undefined}
    >
      {Icon ? <Icon className={styles.icon} aria-hidden /> : <span className={styles.dot} aria-hidden />}
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
        >
          {action.label}
        </button>
      ) : null}
      <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => onDismiss(id)}>
        <X aria-hidden />
      </button>
      {duration > 0 ? <span className={styles.timer} aria-hidden /> : null}
    </li>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
