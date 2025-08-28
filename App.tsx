import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router, Route, Switch } from 'wouter'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import HomePage from '@/pages/home'
import GenrePage from '@/pages/genre'
import MovieDetailPage from '@/pages/movie-detail'
import NotFoundPage from '@/pages/not-found'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/genre/:genre" component={GenrePage} />
            <Route path="/movie/:id" component={MovieDetailPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App