import { Suspense, type ReactNode } from "react";
import { PageIntro } from "@/components/discovery/page-intro";
import { SearchBox } from "@/components/discovery/search-box";
import styles from "@/components/discovery/discovery.module.css";

/**
 * The search field lives in the layout so it keeps focus and its value while the
 * page segment re-renders (and shows loading.tsx) for each new `?q=`.
 */
export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <PageIntro kicker="Search" title="Find a film" />
      <div className={styles.searchSlot}>
        <Suspense fallback={<div className={styles.searchForm} aria-hidden />}>
          <SearchBox />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
