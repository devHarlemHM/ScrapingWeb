import { useEffect, useState } from 'react';

import type { Hotel, HotelReview } from '../models/hotel';
import { hotelService } from '../services/hotelService';

interface HotelDetailsState {
  hotel: Hotel | null;
  recentReviews: HotelReview[];
  isLoading: boolean;
  error: string | null;
}

export function useHotelDetails(hotelId: string | undefined): HotelDetailsState {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [recentReviews, setRecentReviews] = useState<HotelReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) {
      setHotel(null);
      setRecentReviews([]);
      setIsLoading(false);
      return;
    }

    const currentHotelId = hotelId;

    const controller = new AbortController();

    async function loadHotel() {
      try {
        setIsLoading(true);
        const response = await hotelService.getHotelDetail(currentHotelId, controller.signal);
        setHotel(response);
        setRecentReviews(response.recentReviews);
        setError(null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el hotel');
      } finally {
        setIsLoading(false);
      }
    }

    loadHotel();
    return () => controller.abort();
  }, [hotelId]);

  return {
    hotel,
    recentReviews,
    isLoading,
    error,
  };
}
