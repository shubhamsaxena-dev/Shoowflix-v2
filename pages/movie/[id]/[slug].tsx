import MovieDetailPage from "../../movie-detail";

// Helper function to create URL-friendly slug from movie title
function createSlug(title: string | null | undefined): string {
  if (!title) {
    return "untitled";
  }
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default MovieDetailPage;
