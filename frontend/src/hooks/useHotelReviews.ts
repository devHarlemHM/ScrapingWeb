import { useEffect, useState } from 'react';

import type { HotelReview } from '../models/hotel';
import { hotelService } from '../services/hotelService';

export function useHotelReviews(hotelId: string | null, limit = 50) {
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) {
      setReviews([]);
      setTotal(0);
      return;
    }

    const currentHotelId = hotelId;

    const controller = new AbortController();

    async function loadReviews() {
      try {
        setIsLoading(true);
        const response = await hotelService.getHotelReviews(currentHotelId, { limit }, controller.signal);
        setReviews(response.reviews);
        setTotal(response.total);
        setError(null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar las resenas');
      } finally {
        setIsLoading(false);
      }
    }

    loadReviews();
    return () => controller.abort();
  }, [hotelId, limit]);

  return {
    reviews,
    total,
    isLoading,
    error,
  };
}
