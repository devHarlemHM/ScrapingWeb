import { apiRequest } from '../core/apiClient';
import { apiEndpoints } from './endpoints';
import type {
  HotelAnalytics,
  Hotel,
  HotelFilters,
  HotelPlatforms,
  HotelReview,
  HotelReviewsResponse,
  HotelSentiments,
  ReviewPlatform,
  ReviewSentiment,
} from '../models/hotel';

interface ApiPlatforms {
  google?: number | null;
  booking?: number | null;
  airbnb?: number | null;
}

interface ApiSentiments {
  positive: number;
  neutral: number;
  negative: number;
}

interface ApiHotel {
  id: string;
  name: string;
  location?: string | null;
  city: string;
  country: string;
  rating?: number | null;
  total_reviews: number;
  sentiment_score: number;
  quality_score?: number | null;
  sustainability_score?: number | null;
  favorites_count?: number | null;
  platforms: ApiPlatforms;
  platform_links?: {
    google?: string | null;
    booking?: string | null;
    airbnb?: string | null;
  } | null;
  sentiments: ApiSentiments;
  features: string[];
  description?: string | null;
  highlight_review?: string | null;
  image_url?: string | null;
}

interface ApiFavoriteResponse {
  hotel_id: string;
  favorites_count: number;
}

interface ApiReview {
  id: string;
  author?: string | null;
  platform: string;
  rating?: number | null;
  date?: string | null;
  text?: string | null;
  sentiment?: string | null;
  positive_text?: string | null;
  negative_text?: string | null;
}

interface ApiHotelReviewsResponse {
  hotel_id: string;
  total: number;
  reviews: ApiReview[];
}

interface ApiHotelDetail extends ApiHotel {
  recent_reviews: ApiReview[];
}

interface ApiHotelAnalytics {
  hotel_id: string;
  hotel_name: string;
  total_reviews: number;
  sentiments: ApiSentiments;
  sentiment_percentages: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platform_breakdown: Array<{
    platform: string;
    reviews: number;
    avg_rating?: number | null;
    positive: number;
    neutral: number;
    negative: number;
    positive_pct: number;
  }>;
  topics: Array<{
    topic: string;
    mentions: number;
    positive: number;
    neutral: number;
    negative: number;
    positive_pct: number;
  }>;
  trend_6m: Array<{
    month: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
    positive_pct: number;
  }>;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

function normalizePlatform(value?: string | null): ReviewPlatform {
  const normalized = value?.toLowerCase() ?? 'google';
  if (normalized === 'booking' || normalized === 'airbnb' || normalized === 'google') {
    return normalized;
  }
  return 'google';
}

function normalizeSentiment(value?: string | null): ReviewSentiment {
  const normalized = value?.toLowerCase() ?? 'neutral';
  if (normalized === 'positive' || normalized === 'neutral' || normalized === 'negative') {
    return normalized;
  }
  return 'neutral';
}

function mapPlatforms(platforms: ApiPlatforms): HotelPlatforms {
  return {
    google: Number(platforms.google ?? 0),
    booking: Number(platforms.booking ?? 0),
    airbnb: Number(platforms.airbnb ?? 0),
  };
}

function mapSentiments(sentiments: ApiSentiments): HotelSentiments {
  return {
    positive: sentiments.positive ?? 0,
    neutral: sentiments.neutral ?? 0,
    negative: sentiments.negative ?? 0,
  };
}

function extractTopics(text: string): string[] {
  if (!text) {
    return [];
  }

  return text
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase())
    .filter((token) => token.length > 4)
    .slice(0, 5);
}

function mapReview(review: ApiReview): HotelReview {
  const text = review.text ?? '';
  return {
    id: review.id,
    author: review.author ?? 'Huesped anonimo',
    platform: normalizePlatform(review.platform),
    rating: Number(review.rating ?? 0),
    date: review.date ?? '',
    text,
    sentiment: normalizeSentiment(review.sentiment),
    positiveText: review.positive_text ?? undefined,
    negativeText: review.negative_text ?? undefined,
    topics: extractTopics(text),
  };
}

function mapHotel(hotel: ApiHotel): Hotel {
  return {
    id: hotel.id,
    name: hotel.name,
    location: hotel.location ?? 'Barranquilla',
    city: hotel.city,
    country: hotel.country,
    rating: Number(hotel.rating ?? 0),
    totalReviews: hotel.total_reviews,
    sentimentScore: Number(hotel.sentiment_score ?? 0),
    qualityScore: Number(hotel.quality_score ?? 0),
    sustainabilityScore: Number(hotel.sustainability_score ?? 0),
    favoritesCount: Number(hotel.favorites_count ?? 0),
    platforms: mapPlatforms(hotel.platforms),
    platformLinks: {
      google: hotel.platform_links?.google ?? null,
      booking: hotel.platform_links?.booking ?? null,
      airbnb: hotel.platform_links?.airbnb ?? null,
    },
    sentiments: mapSentiments(hotel.sentiments),
    features: hotel.features ?? [],
    description: hotel.description ?? 'Sin descripcion disponible.',
    highlightReview: hotel.highlight_review ?? undefined,
    imageUrl: hotel.image_url ?? DEFAULT_IMAGE,
  };
}

function buildHotelsQuery(filters: HotelFilters): string {
  const params = new URLSearchParams();

  if (filters.query) params.set('q', filters.query);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.sentiment) params.set('sentiment', filters.sentiment);
  if (filters.minReviews !== undefined) params.set('min_reviews', filters.minReviews.toString());
  if (filters.minRating !== undefined) params.set('min_rating', filters.minRating.toString());
  if (filters.minQuality !== undefined) params.set('min_quality', filters.minQuality.toString());
  if (filters.minSustainability !== undefined) params.set('min_sustainability', filters.minSustainability.toString());
  if (filters.platforms && filters.platforms.length > 0) params.set('platforms', filters.platforms.join(','));

  const query = params.toString();
  return query ? `?${query}` : '';
}

function buildAdvancedHotelsQuery(filters: HotelFilters): string {
  const params = new URLSearchParams();

  if (filters.sort) params.set('sort', filters.sort);
  if (filters.sentiment) params.set('sentiment', filters.sentiment);
  if (filters.ratingStar !== undefined) params.set('rating_star', filters.ratingStar.toString());
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  if (filters.platforms && filters.platforms.length > 0) params.set('platforms', filters.platforms.join(','));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const hotelService = {
  async listHotels(
    filters: HotelFilters,
    options: { limit?: number; offset?: number } = {},
    signal?: AbortSignal,
  ): Promise<Hotel[]> {
    const query = buildHotelsQuery(filters);
    const separator = query ? '&' : '?';
    const limitParam = options.limit !== undefined ? `limit=${options.limit}` : '';
    const offsetParam = options.offset !== undefined ? `offset=${options.offset}` : '';
    const pagination = [limitParam, offsetParam].filter(Boolean).join('&');
    const fullQuery = pagination ? `${query}${separator}${pagination}` : query;

    const response = await apiRequest<ApiHotel[]>(`${apiEndpoints.hotels.list}${fullQuery}`, { signal });
    return response.map(mapHotel);
  },

  async listHotelsAdvanced(
    filters: HotelFilters,
    options: { limit?: number; offset?: number } = {},
    signal?: AbortSignal,
  ): Promise<Hotel[]> {
    const query = buildAdvancedHotelsQuery(filters);
    const separator = query ? '&' : '?';
    const limitParam = options.limit !== undefined ? `limit=${options.limit}` : '';
    const offsetParam = options.offset !== undefined ? `offset=${options.offset}` : '';
    const pagination = [limitParam, offsetParam].filter(Boolean).join('&');
    const fullQuery = pagination ? `${query}${separator}${pagination}` : query;

    const response = await apiRequest<ApiHotel[]>(`${apiEndpoints.hotels.advancedSearch}${fullQuery}`, { signal });
    return response.map(mapHotel);
  },

  async getHotelDetail(hotelId: string, signal?: AbortSignal): Promise<Hotel & { recentReviews: HotelReview[] }> {
    const response = await apiRequest<ApiHotelDetail>(apiEndpoints.hotels.detail(hotelId), { signal });
    return {
      ...mapHotel(response),
      recentReviews: (response.recent_reviews ?? []).map(mapReview),
    };
  },

  async getHotelAnalytics(hotelId: string, signal?: AbortSignal): Promise<HotelAnalytics> {
    const response = await apiRequest<ApiHotelAnalytics>(apiEndpoints.hotels.analytics(hotelId), { signal });
    return {
      hotelId: response.hotel_id,
      hotelName: response.hotel_name,
      totalReviews: response.total_reviews,
      sentiments: mapSentiments(response.sentiments),
      sentimentPercentages: {
        positive: Number(response.sentiment_percentages.positive ?? 0),
        neutral: Number(response.sentiment_percentages.neutral ?? 0),
        negative: Number(response.sentiment_percentages.negative ?? 0),
      },
      platformBreakdown: (response.platform_breakdown ?? []).map((item) => ({
        platform: normalizePlatform(item.platform),
        reviews: Number(item.reviews ?? 0),
        avgRating: item.avg_rating !== null && item.avg_rating !== undefined ? Number(item.avg_rating) : null,
        positive: Number(item.positive ?? 0),
        neutral: Number(item.neutral ?? 0),
        negative: Number(item.negative ?? 0),
        positivePct: Number(item.positive_pct ?? 0),
      })),
      topics: (response.topics ?? []).map((item) => ({
        topic: item.topic,
        mentions: Number(item.mentions ?? 0),
        positive: Number(item.positive ?? 0),
        neutral: Number(item.neutral ?? 0),
        negative: Number(item.negative ?? 0),
        positivePct: Number(item.positive_pct ?? 0),
      })),
      trend6m: (response.trend_6m ?? []).map((item) => ({
        month: item.month,
        positive: Number(item.positive ?? 0),
        neutral: Number(item.neutral ?? 0),
        negative: Number(item.negative ?? 0),
        total: Number(item.total ?? 0),
        positivePct: Number(item.positive_pct ?? 0),
      })),
    };
  },

  async getHotelReviews(
    hotelId: string,
    options: { platform?: string; sentiment?: string; limit?: number; offset?: number } = {},
    signal?: AbortSignal,
  ): Promise<HotelReviewsResponse> {
    const params = new URLSearchParams();
    if (options.platform) params.set('platform', options.platform);
    if (options.sentiment) params.set('sentiment', options.sentiment);
    if (options.limit !== undefined) params.set('limit', options.limit.toString());
    if (options.offset !== undefined) params.set('offset', options.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest<ApiHotelReviewsResponse>(`${apiEndpoints.hotels.reviews(hotelId)}${query}`, { signal });
    return {
      hotelId: response.hotel_id,
      total: response.total,
      reviews: response.reviews.map(mapReview),
    };
  },

  async setHotelFavorite(hotelId: string, isFavorite: boolean, signal?: AbortSignal): Promise<{ hotelId: string; favoritesCount: number }> {
    const response = await apiRequest<ApiFavoriteResponse>(apiEndpoints.hotels.favorite(hotelId), {
      method: 'POST',
      body: JSON.stringify({ is_favorite: isFavorite }),
      signal,
    });

    return {
      hotelId: response.hotel_id,
      favoritesCount: Number(response.favorites_count ?? 0),
    };
  },
};
