/** Serializable props handed from the /watch server page to the client stage. */
export interface StageMovie {
  id: number;
  title: string;
  year: number;
  runtime: number;
  rating: number;
  genres: string[];
  summary: string;
  mpaRating?: string;
  imdbId?: string;
  poster?: string;
  backdrop?: string;
  /** Canonical film page — the back target. */
  href: string;
}

export interface StageSource {
  hash: string;
  quality: string;
  type: string;
  codec?: string;
  size: string;
  sizeBytes: number;
  seeds: number;
  peers: number;
  magnet: string;
}

export type StreamStage = "sdk" | "metadata" | "peers" | "buffering" | "playing" | "error";
export type StreamErrorKind = "sdk" | "torrent" | "stalled" | "mount";
