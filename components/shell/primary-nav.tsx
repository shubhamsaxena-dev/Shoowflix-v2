"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { GENRES } from "@/types/movie";
import { cx } from "@/lib/movie-utils";
import styles from "./primary-nav.module.css";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/browse", label: "Browse", match: (p: string) => p.startsWith("/browse") },
] as const;

export function PrimaryNav() {
  const pathname = usePathname() ?? "/";
  const genreActive = pathname.startsWith("/genre");
  const listActive = pathname.startsWith("/my-list");

  return (
    <nav aria-label="Primary" className={styles.nav}>
      <ul role="list" className={styles.list}>
        {LINKS.map((l) => {
          const active = l.match(pathname);
          return (
            <li key={l.href}>
              <Link href={l.href} className={styles.link} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Menu
            label="Genres"
            triggerClassName={cx(styles.link, genreActive && styles.active)}
            className={styles.genreMenu}
            trigger={
              <>
                Genres
                <ChevronDown className={styles.chevron} aria-hidden />
              </>
            }
          >
            <div role="group" aria-label="All genres" className={styles.genreGrid}>
              {GENRES.map((g) => (
                <MenuItem key={g} href={`/genre/${g}`} className={styles.genreItem}>
                  {g === "sci-fi" ? "Sci-Fi" : g}
                </MenuItem>
              ))}
            </div>
            <MenuSeparator />
            <MenuItem href="/browse">Browse everything</MenuItem>
          </Menu>
        </li>
        <li>
          <Link href="/my-list" className={styles.link} aria-current={listActive ? "page" : undefined}>
            My List
          </Link>
        </li>
      </ul>
    </nav>
  );
}
