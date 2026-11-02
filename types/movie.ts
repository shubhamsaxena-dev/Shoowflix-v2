export interface YTSMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  state: string;
  torrents: Torrent[];
  date_uploaded: string;
  date_uploaded_unix: number;
  like_count?: number;
  download_count?: number;
  cast?: Cast[];
}

/** The fields a movie card renders. A full YTSMovie satisfies it; so does a stored snapshot. */
export type CardMovie = Pick<
  YTSMovie,
  "id" | "title" | "year" | "runtime" | "rating" | "genres" | "medium_cover_image" | "large_cover_image"
>;

export interface Cast {
  name: string;
  character_name: string;
  url_small_image?: string;
  imdb_code: string;
}

export interface Torrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  video_codec?: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

export interface YTSListMoviesResponse {
  status: string;
  status_message: string;
  data: {
    movie_count: number;
    limit: number;
    page_number: number;
    movies?: YTSMovie[];
  };
}

export interface YTSMovieDetailsResponse {
  status: string;
  status_message: string;
  data: { movie: YTSMovie };
}

export type SortBy =
  | "title"
  | "year"
  | "rating"
  | "peers"
  | "seeds"
  | "download_count"
  | "like_count"
  | "date_added";

export interface MovieFilters {
  query_term?: string;
  genre?: string;
  quality?: string;
  minimum_rating?: number;
  sort_by?: SortBy;
  order_by?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export const GENRES = [
  "action",
  "adventure",
  "animation",
  "biography",
  "comedy",
  "crime",
  "documentary",
  "drama",
  "family",
  "fantasy",
  "history",
  "horror",
  "music",
  "musical",
  "mystery",
  "romance",
  "sci-fi",
  "sport",
  "thriller",
  "war",
  "western",
] as const;

export type Genre = (typeof GENRES)[number];
