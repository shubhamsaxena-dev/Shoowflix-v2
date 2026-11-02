/** Shape exchanged by /api/progress and hooks/use-continue-watching. Safe on client and server. */
export type WatchProgressDTO = {
  movieId: number;
  title: string;
  poster?: string;
  backdrop?: string;
  quality?: string;
  position: number;
  duration: number;
  updatedAt?: string;
};
