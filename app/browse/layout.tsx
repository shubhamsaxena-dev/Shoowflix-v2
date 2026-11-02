import { Suspense, type ReactNode } from "react";
import { FilterBar } from "@/components/discovery/filter-bar";
import { PageIntro } from "@/components/discovery/page-intro";

/**
 * The intro and filter bar live in the layout so they persist while the page segment
 * re-renders for each filter change (only the grid swaps / shows loading.tsx).
 */
export default function BrowseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <PageIntro kicker="Catalogue" title="Browse every film" lede="Filter by genre, print quality and rating. Sort however you like." />
      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>
      {children}
    </div>
  );
}
