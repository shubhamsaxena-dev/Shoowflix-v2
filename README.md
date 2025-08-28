# Shoowflix - Next.js Movie Streaming Platform

A modern movie streaming platform built with Next.js that interfaces with the YTS (YIFY Torrents) API to provide users with a Netflix-like browsing experience for movies.

## Features

- **Movie Discovery**: Browse trending, action, high-rated, and recent movies
- **Hero Slideshow**: Automatic slideshow of featured movies with navigation controls
- **Advanced Filtering**: Filter by genre, quality, rating, and sort options
- **Search Functionality**: Real-time movie search with debouncing
- **Video Streaming**: Full-screen in-browser torrent streaming using WebTorrent technology
- **Mobile-First Design**: Fully responsive design optimized for mobile devices
- **WebTor Integration**: Professional torrent streaming with automatic quality selection

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: TanStack Query (React Query) for server state management
- **Database**: PostgreSQL with Drizzle ORM
- **External APIs**: YTS API for movie data, WebTorrent for streaming

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

- `GET /api/movies` - List movies with filtering options
- `GET /api/movies/[id]` - Get movie details
- `GET /api/movies/[id]/suggestions` - Get movie suggestions
- `POST /api/magnet` - Generate magnet links for torrents
- `GET /api/favorites/[userId]` - Get user favorites
- `POST /api/favorites` - Add movie to favorites

## Project Structure

```
├── pages/
│   ├── api/           # API routes
│   ├── movie/         # Movie detail pages
│   ├── genre/         # Genre pages
│   ├── _app.tsx       # App wrapper
│   ├── _document.tsx  # Document wrapper
│   └── index.tsx      # Home page
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   └── lib/           # Utility functions
├── shared/            # Shared types and schemas
└── styles/            # Global styles
```

## Deployment

The app can be deployed to any platform that supports Next.js:

```bash
npm run build
npm start
```

## License

MIT License