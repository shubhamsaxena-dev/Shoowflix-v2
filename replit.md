# Shoowflix Movie Streaming Platform

## Overview

A modern movie streaming platform called Shoowflix that interfaces with the YTS (YIFY Torrents) API to provide users with a Netflix-like browsing experience for movies. The application features movie discovery, filtering, detailed movie information, and in-browser streaming capabilities using WebTorrent technology. Built with a React frontend and Express backend, the platform offers a seamless movie viewing experience with high-quality torrents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management with caching
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom dark theme and CSS variables
- **Component Structure**: Modular component architecture with reusable UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API structure with YTS API proxy endpoints
- **Development Setup**: Hot module replacement with Vite integration
- **Request Handling**: Express middleware for JSON parsing, CORS, and request logging
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Connection**: Neon Database serverless PostgreSQL connection
- **In-Memory Storage**: Fallback memory storage implementation for development
- **Data Models**: Movies, user favorites, and user management tables

### External Service Integrations
- **YTS API**: Primary data source for movie information, torrents, and metadata
- **WebTorrent**: Browser-based torrent streaming for video playback
- **Image Hosting**: YTS-provided movie posters and background images
- **Font Services**: Google Fonts integration for typography

### Key Features
- **Movie Discovery**: Browse trending, action, high-rated, and recent movies
- **Hero Slideshow**: Automatic slideshow of featured movies with navigation controls
- **Advanced Filtering**: Filter by genre, quality, rating, and sort options
- **Search Functionality**: Real-time movie search with debouncing
- **Video Streaming**: Full-screen in-browser torrent streaming using WebTorrent technology
- **Mobile-First Design**: Fully responsive design optimized for mobile devices
- **User Experience**: Loading states, error handling, and smooth transitions
- **WebTor Integration**: Professional torrent streaming with automatic quality selection

### Performance Optimizations
- **Caching Strategy**: React Query provides intelligent caching and background updates
- **Image Optimization**: Lazy loading for movie posters and images
- **Bundle Optimization**: Vite's efficient bundling and tree-shaking
- **Development Tools**: Hot module replacement and runtime error overlays