import { useState } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { MovieFilters } from "@/lib/types";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: MovieFilters) => void;
  currentFilters: MovieFilters;
}

const GENRES = [
  'Sci-Fi',
  'Comedy',
  'Action',
  'Adventure',
  'Crime',
  'Fantasy',
  'Mystery',
  'Drama',
  'Horror',
  'Romance',
  'War',
  'Thriller',
  'Animation'
];

const QUALITIES = ['720p', '1080p', '2160p', '3D'];

const SORT_OPTIONS = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'title', label: 'Title' },
  { value: 'year', label: 'Year' },
  { value: 'rating', label: 'Rating' },
  { value: 'download_count', label: 'Downloads' },
];

export default function FilterPanel({ isOpen, onClose, onApplyFilters, currentFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<MovieFilters>(currentFilters);

  const handleGenreClick = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genre: prev.genre === genre ? '' : genre
    }));
  };

  const handleQualityClick = (quality: string) => {
    setFilters(prev => ({
      ...prev,
      quality: prev.quality === quality ? '' : quality
    }));
  };

  const handleRatingChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      minimum_rating: value[0]
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy as any
    }));
  };

  const handleOrderChange = (order: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      order_by: order
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: MovieFilters = {
      genre: '',
      quality: '',
      minimum_rating: 0,
      sort_by: 'date_added',
      order_by: 'desc'
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop bg-black/80 absolute inset-0" onClick={onClose}></div>
      
      <Card className="relative z-10 bg-card border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <h3 className="text-lg font-semibold" data-testid="filter-panel-title">Filters</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            data-testid="filter-panel-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Quality Filter */}
          <div>
            <label className="block text-sm font-medium mb-3" data-testid="quality-filter-label">
              Quality
            </label>
            <div className="flex flex-wrap gap-2">
              {QUALITIES.map((quality) => (
                <Button
                  key={quality}
                  variant={filters.quality === quality ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQualityClick(quality)}
                  className="text-xs"
                  data-testid={`quality-filter-${quality}`}
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Genre Filter */}
          <div>
            <label className="block text-sm font-medium mb-3" data-testid="genre-filter-label">
              Genre
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((genre) => (
                <Button
                  key={genre}
                  variant={filters.genre === genre ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGenreClick(genre)}
                  className="text-xs capitalize"
                  data-testid={`genre-filter-${genre}`}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium mb-3" data-testid="rating-filter-label">
              Minimum Rating: {filters.minimum_rating || 0}
            </label>
            <Slider
              value={[filters.minimum_rating || 0]}
              onValueChange={handleRatingChange}
              max={10}
              min={0}
              step={0.1}
              className="w-full"
              data-testid="rating-filter-slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
          
          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium mb-3" data-testid="sort-filter-label">
              Sort By
            </label>
            <div className="space-y-2">
              {SORT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.sort_by === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange(option.value)}
                  className="w-full text-xs justify-start"
                  data-testid={`sort-filter-${option.value}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Order Filter */}
          <div>
            <label className="block text-sm font-medium mb-3" data-testid="order-filter-label">
              Order
            </label>
            <div className="flex gap-2">
              <Button
                variant={filters.order_by === 'desc' ? "default" : "outline"}
                size="sm"
                onClick={() => handleOrderChange('desc')}
                className="flex-1 text-xs"
                data-testid="order-filter-desc"
              >
                Descending
              </Button>
              <Button
                variant={filters.order_by === 'asc' ? "default" : "outline"}
                size="sm"
                onClick={() => handleOrderChange('asc')}
                className="flex-1 text-xs"
                data-testid="order-filter-asc"
              >
                Ascending
              </Button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleReset}
              variant="outline"
              className="flex-1"
              data-testid="filter-reset-button"
            >
              Reset
            </Button>
            <Button 
              onClick={handleApply}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="filter-apply-button"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
