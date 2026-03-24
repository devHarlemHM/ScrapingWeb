import { useEffect, useMemo, useState } from 'react';

import type { Hotel, HotelFilters } from '../models/hotel';
import { hotelService } from '../services/hotelService';

type RatingFilterValue = 'all' | '5' | '4' | '3' | '2' | '1';
type PlatformFilterValue = 'all' | 'google' | 'booking' | 'airbnb';
type MinReviewsFilterValue = 'all' | '50' | '100' | '200';

interface UseHotelsResultsInput {
  searchParams: URLSearchParams;
  ratingFilter: RatingFilterValue;
  platformFilter: PlatformFilterValue;
  minReviewsFilter: MinReviewsFilterValue;
  sortBy: string;
}

const PAGE_SIZE = 10;

function mapSort(sortBy: string): string {
  const normalized = sortBy.toLowerCase();
  if (normalized === 'best-rated') return 'rating';
  if (normalized === 'most-reviewed') return 'reviews';
  if (normalized === 'favorites') return 'favorites';
  if (normalized === 'quality') return 'quality';
  if (normalized === 'eco') return 'sustainability';
  if (normalized === 'analyzed') return 'reviews';
  return normalized;
}

function buildFilters(input: UseHotelsResultsInput): HotelFilters {
  const query = input.searchParams.get('q') ?? '';
  const platforms = (input.searchParams.get('platforms') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const qualityFromParams = input.searchParams.get('quality');
  const sustainabilityFromParams = input.searchParams.get('sustainability');

  const filters: HotelFilters = {
    query,
    sort: mapSort(input.sortBy || input.searchParams.get('sort') || 'reviews'),
    platforms: input.platformFilter === 'all' ? platforms : [input.platformFilter],
  };

  if (input.ratingFilter !== 'all') {
    filters.minRating = Number(input.ratingFilter);
  }

  if (input.minReviewsFilter !== 'all') {
    filters.minReviews = Number(input.minReviewsFilter);
  }

  if (qualityFromParams) {
    const value = Number(qualityFromParams);
    if (!Number.isNaN(value)) filters.minQuality = value;
  }

  if (sustainabilityFromParams) {
    const value = Number(sustainabilityFromParams);
    if (!Number.isNaN(value)) filters.minSustainability = value;
  }

  return filters;
}

export function useHotelsResults(input: UseHotelsResultsInput) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchKey = input.searchParams.toString();
  const [debouncedSearchKey, setDebouncedSearchKey] = useState(searchKey);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchKey(searchKey);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchKey]);

  const filters = useMemo(() => {
    return buildFilters({
      ...input,
      searchParams: new URLSearchParams(debouncedSearchKey),
    });
  }, [debouncedSearchKey, input.ratingFilter, input.platformFilter, input.minReviewsFilter, input.sortBy]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    setHotels([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, [filtersKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHotels() {
      try {
        if (page === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await hotelService.listHotels(
          filters,
          {
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
          },
          controller.signal,
        );

        setHotels((prev) => {
          if (page === 0) {
            return response;
          }

          const seen = new Set(prev.map((hotel) => hotel.id));
          const next = response.filter((hotel) => !seen.has(hotel.id));
          return [...prev, ...next];
        });
        setHasMore(response.length === PAGE_SIZE);
        setError(null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar hoteles');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }

    loadHotels();

    return () => controller.abort();
  }, [filtersKey, page]);

  const totalReviews = useMemo(() => hotels.reduce((acc, hotel) => acc + hotel.totalReviews, 0), [hotels]);

  const loadMore = () => {
    if (hasMore && !isLoading && !isLoadingMore) {
      setPage((prev) => prev + 1);
    }
  };

  return {
    hotels,
    totalReviews,
    hasMore,
    isLoadingMore,
    isLoading,
    error,
    loadMore,
  };
}
