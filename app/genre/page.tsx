import type { Metadata } from "next";
import { GenreTiles } from "@/components/discovery/genre-tiles";
import styles from "@/components/discovery/discovery.module.css";

export const metadata: Metadata = {
  title: "Genres",
  description: "Browse every genre on Shoowflix, from action and animation to westerns and war films.",
  alternates: { canonical: "/genre" },
};

export default function GenresIndexPage() {
  return (
    <div className={`container ${styles.indexPage}`}>
      <GenreTiles headingLevel={1} title="Genres" />
    </div>
  );
}
