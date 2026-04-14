import { useEffect, useState } from 'react';

import type { Hotel, HotelAnalytics, HotelReview } from '../models/hotel';
import { hotelService } from '../services/hotelService';

interface HotelDetailsState {
  hotel: Hotel | null;
  analytics: HotelAnalytics | null;
  recentReviews: HotelReview[];
  isLoading: boolean;
  error: string | null;
}

export function useHotelDetails(hotelId: string | undefined): HotelDetailsState {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [analytics, setAnalytics] = useState<HotelAnalytics | null>(null);
  const [recentReviews, setRecentReviews] = useState<HotelReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) {
      setHotel(null);
      setAnalytics(null);
      setRecentReviews([]);
      setIsLoading(false);
      return;
    }

    const currentHotelId = hotelId;

    const controller = new AbortController();

    async function loadHotel() {
      try {
        setIsLoading(true);
        const [detail, analyticsPayload] = await Promise.all([
          hotelService.getHotelDetail(currentHotelId, controller.signal),
          hotelService.getHotelAnalytics(currentHotelId, controller.signal),
        ]);
        setHotel(detail);
        setRecentReviews(detail.recentReviews);
        setAnalytics(analyticsPayload);
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
    analytics,
    recentReviews,
    isLoading,
    error,
  };
}
