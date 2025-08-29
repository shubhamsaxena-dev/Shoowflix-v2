import { useRouter } from 'next/router'
import { useEffect } from 'react'
import MovieDetailPage from '../../movie-detail'

export default function MovieWithSlug() {
  const router = useRouter()
  const { id, slug } = router.query

  // If no slug is provided, redirect to add the slug
  useEffect(() => {
    if (id && !slug && typeof id === 'string') {
      // This will be handled by the movie detail component
      // which will redirect to the proper URL with slug
    }
  }, [id, slug])

  return <MovieDetailPage />
}