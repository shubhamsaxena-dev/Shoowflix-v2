import type { NextApiRequest, NextApiResponse } from 'next'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
const YTS_API_BASE = process.env.MOVIES_HOST
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      page = '1',
      limit = '20',
      quality,
      minimum_rating,
      query_term,
      genre,
      sort_by = 'date_added',
      order_by = 'desc'
    } = req.query

    // Build YTS API URL
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sort_by.toString(),
      order_by: order_by.toString()
    })

    if (quality) params.append('quality', quality.toString())
    if (minimum_rating) params.append('minimum_rating', minimum_rating.toString())
    if (query_term) params.append('query_term', query_term.toString())
    if (genre) params.append('genre', genre.toString())

    const ytsUrl = `${YTS_API_BASE}/list_movies.json?${params.toString()}`
    
    const response = await fetch(ytsUrl)
    
    if (!response.ok) {
      throw new Error(`YTS API error: ${response.status}`)
    }

    const data = await response.json()
    
    res.status(200).json(data)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch movies',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
