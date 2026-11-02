import { FilmLeader } from "@/components/shell/film-leader";
import styles from "@/components/shell/status-screen.module.css";

export default function Loading() {
  return (
    <div className={`container ${styles.loading}`} role="status">
      <FilmLeader countdown size="sm" />
      <span className="visually-hidden">Loading</span>
    </div>
  );
}
