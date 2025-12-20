import { GetServerSideProps } from "next";
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

// Server-side rendering for better SEO and faster initial load
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, slug } = context.params || {};
  const movieId = parseInt((id as string) || "0");

  // Return 404 if invalid ID
  if (!id || isNaN(movieId)) {
    return {
      notFound: true,
    };
  }

  try {
    const YTS_API_BASE = process.env.MOVIES_HOST;
    const ytsUrl = `${YTS_API_BASE}/movie_details.json?movie_id=${movieId}&with_images=true&with_cast=true`;

    const response = await fetch(ytsUrl);

    if (!response.ok) {
      throw new Error(`YTS API error: ${response.status}`);
    }

    const movieData = await response.json();

    if (!movieData.data?.movie) {
      return {
        notFound: true,
      };
    }

    // If slug is missing or incorrect, redirect to correct URL
    const correctSlug = createSlug(movieData.data.movie.title);
    if (!slug || slug !== correctSlug) {
      return {
        redirect: {
          destination: `/movie/${movieId}/${correctSlug}`,
          permanent: false,
        },
      };
    }

    return {
      props: {
        initialMovieData: movieData,
        movieId,
      },
    };
  } catch (error) {
    // Return error page
    return {
      notFound: true,
    };
  }
};
