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
}

const PAGE_SIZE = 10;

function buildFilters(input: UseHotelsResultsInput): HotelFilters {
  const query = input.searchParams.get('q') ?? '';
  const isAdvanced = input.searchParams.get('advanced') === '1';
  const sortFromParams = input.searchParams.get('sort') ?? 'reviews';
  const ratingFromParams = input.searchParams.get('rating') ?? input.searchParams.get('min_rating');
  const ratingStarFromParams = input.searchParams.get('rating_star');
  const sentimentFromParams = (input.searchParams.get('sentiment') ?? '').toLowerCase();
  const platforms = (input.searchParams.get('platforms') ?? '')
    .split(',')
    .map((value) => value.trim())
    .map((value) => value.toLowerCase())
    .filter(Boolean);

  const filters: HotelFilters = {
    advanced: isAdvanced,
    query: isAdvanced ? '' : query,
    sort: sortFromParams,
    platforms: input.platformFilter === 'all' ? platforms : [input.platformFilter],
  };

  if (isAdvanced) {
    if (ratingStarFromParams) {
      const value = Number(ratingStarFromParams);
      if (!Number.isNaN(value)) filters.ratingStar = value;
    }

    const dateFrom = input.searchParams.get('date_from');
    const dateTo = input.searchParams.get('date_to');
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
  }

  if (!isAdvanced && input.ratingFilter !== 'all') {
    filters.minRating = Number(input.ratingFilter);
  } else if (!isAdvanced && ratingFromParams) {
    const value = Number(ratingFromParams);
    if (!Number.isNaN(value)) filters.minRating = value;
  }

  if (input.minReviewsFilter !== 'all') {
    filters.minReviews = Number(input.minReviewsFilter);
  }

  if (sentimentFromParams && ['positive', 'neutral', 'negative'].includes(sentimentFromParams)) {
    filters.sentiment = sentimentFromParams;
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
  }, [debouncedSearchKey, input.ratingFilter, input.platformFilter, input.minReviewsFilter]);

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

        const response = filters.advanced
          ? await hotelService.listHotelsAdvanced(
              filters,
              {
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
              },
              controller.signal,
            )
          : await hotelService.listHotels(
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
