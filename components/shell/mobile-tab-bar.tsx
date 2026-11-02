"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, House, Search, User } from "lucide-react";
import { openCommandSearch } from "./search-events";
import styles from "./mobile-tab-bar.module.css";

const TABS = [
  { href: "/", label: "Home", Icon: House, match: (p: string) => p === "/" },
  { href: "/browse", label: "Browse", Icon: Compass, match: (p: string) => p.startsWith("/browse") || p.startsWith("/genre") },
  { href: "/search", label: "Search", Icon: Search, match: (p: string) => p.startsWith("/search"), search: true },
  { href: "/my-list", label: "My List", Icon: Bookmark, match: (p: string) => p.startsWith("/my-list") },
  { href: "/profile", label: "Profile", Icon: User, match: (p: string) => p.startsWith("/profile") },
] as const;

/** Bottom tab bar for < 768px. Hidden on the player so video gets the whole screen. */
export function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/watch")) return null;

  return (
    <>
      {/* Reserves room at the end of the page so content isn't hidden behind the bar. */}
      <div className={styles.spacer} aria-hidden />
      <nav aria-label="Tab bar" className={styles.bar}>
        <ul role="list" className={styles.list}>
          {TABS.map(({ href, label, Icon, match, ...rest }) => {
            const active = match(pathname);
            const isSearch = "search" in rest;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={styles.tab}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => {
                    // Search opens the instant palette; the /search page stays a real link fallback.
                    if (isSearch && !e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      openCommandSearch();
                    }
                  }}
                >
                  <Icon className={styles.icon} aria-hidden />
                  <span className={styles.label}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
