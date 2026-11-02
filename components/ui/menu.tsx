"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./menu.module.css";

interface MenuContextValue {
  close: (restoreFocus?: boolean) => void;
}
const MenuContext = createContext<MenuContextValue | null>(null);

export interface MenuProps {
  /** Accessible name for the trigger button (and the menu). */
  label: string;
  /** Contents of the trigger button (icon, avatar, text…). */
  trigger: ReactNode;
  triggerClassName?: string;
  /** Horizontal alignment of the menu relative to the trigger. */
  align?: "start" | "end";
  className?: string;
  children: ReactNode;
}

const GAP = 8;
const getItems = (menu: HTMLElement | null) =>
  Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
const EDGE = 8;

/**
 * Dropdown menu built on the native `popover` attribute (top layer, light-dismiss, Esc).
 * Keyboard: ArrowDown/Enter/Space on the trigger opens and focuses the first item;
 * ArrowUp/ArrowDown/Home/End move between items; Esc/Tab close.
 */
export function Menu({ label, trigger, triggerClassName, align = "start", className, children }: MenuProps) {
  const id = useId();
  const menuId = `menu${id.replace(/:/g, "")}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const items = () => getItems(menuRef.current);

  /** Anchor below the trigger; flip above / clamp horizontally once the menu has a size. */
  const position = useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t || !m) return;
    const r = t.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const mw = m.offsetWidth;
    const mh = m.offsetHeight;
    let left = align === "end" ? r.right - mw : r.left;
    left = Math.min(Math.max(EDGE, left), vw - mw - EDGE);
    let top = r.bottom + GAP;
    if (mh && top + mh > vh - EDGE && r.top - GAP - mh > EDGE) top = r.top - GAP - mh;
    m.style.left = `${Math.round(left)}px`;
    m.style.top = `${Math.round(top)}px`;
  }, [align]);

  useEffect(() => {
    const m = menuRef.current;
    if (!m) return;
    const onBeforeToggle = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open") return;
      // Pre-position from the trigger alone so the first painted frame is already in place.
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      m.style.top = `${Math.round(r.bottom + GAP)}px`;
      m.style.left = align === "end" ? `${Math.max(EDGE, Math.round(r.right - 240))}px` : `${Math.round(r.left)}px`;
    };
    const onToggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (isOpen) {
        position();
        getItems(m)[0]?.focus({ preventScroll: true });
      }
    };
    m.addEventListener("beforetoggle", onBeforeToggle);
    m.addEventListener("toggle", onToggle);
    return () => {
      m.removeEventListener("beforetoggle", onBeforeToggle);
      m.removeEventListener("toggle", onToggle);
    };
  }, [position, align]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => position();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, { capture: true });
    };
  }, [open, position]);

  const close = useCallback((restoreFocus = true) => {
    const m = menuRef.current;
    if (m?.matches(":popover-open")) m.hidePopover();
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    switch (e.key) {
      case "ArrowDown":
        next = (i + 1) % list.length;
        break;
      case "ArrowUp":
        next = i <= 0 ? list.length - 1 : i - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = list.length - 1;
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        return;
      case "Tab":
        close(false);
        return;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          // Typeahead: jump to the next item starting with the typed character.
          const ch = e.key.toLowerCase();
          const order = [...list.slice(i + 1), ...list.slice(0, i + 1)];
          const match = order.find((el) => el.textContent?.trim().toLowerCase().startsWith(ch));
          if (match) match.focus();
        }
        return;
    }
    e.preventDefault();
    list[next]?.focus();
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      menuRef.current?.showPopover();
      if (e.key === "ArrowUp") {
        const list = items();
        list[list.length - 1]?.focus();
      }
    }
  };

  return (
    <MenuContext.Provider value={{ close }}>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        className={triggerClassName}
        onKeyDown={onTriggerKeyDown}
      >
        {trigger}
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={label}
        className={cx(styles.menu, className)}
        onKeyDown={onMenuKeyDown}
      >
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export interface MenuItemProps {
  href?: string;
  onSelect?: () => void;
  icon?: ReactNode;
  /** Right-aligned hint (e.g. shortcut, count). */
  hint?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function MenuItem({ href, onSelect, icon, hint, tone = "default", disabled, className, children }: MenuItemProps) {
  const ctx = useContext(MenuContext);
  const cls = cx(styles.item, tone === "danger" && styles.danger, className);
  const content = (
    <>
      {icon ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className={styles.text}>{children}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        role="menuitem"
        tabIndex={-1}
        className={cls}
        onClick={() => {
          onSelect?.();
          ctx?.close(false);
        }}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cls}
      onClick={() => {
        if (disabled) return;
        ctx?.close(true);
        onSelect?.();
      }}
    >
      {content}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className={styles.separator} />;
}

/** Non-interactive heading/section inside a menu (e.g. signed-in user's name). */
export function MenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="presentation" className={cx(styles.label, className)}>
      {children}
    </div>
  );
}
