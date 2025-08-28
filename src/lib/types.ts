export interface MovieFilters {
  query_term?: string;
  genre?: string;
  quality?: string;
  minimum_rating?: number;
  sort_by?: 'title' | 'year' | 'rating' | 'peers' | 'seeds' | 'download_count' | 'like_count' | 'date_added';
  order_by?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export interface WebTorConfig {
  id: string;
  magnet: string;
  poster?: string;
  subtitles?: {
    srclang: string;
    label: string;
    src: string;
    default?: boolean;
  }[];
  lang?: string;
}

export interface StreamingQuality {
  quality: string;
  size: string;
  hash: string;
  seeds: number;
  peers: number;
}
