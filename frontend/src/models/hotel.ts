export type ReviewPlatform = 'google' | 'booking' | 'airbnb';
export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface HotelPlatforms {
  google: number;
  booking: number;
  airbnb: number;
}

export interface HotelSentiments {
  positive: number;
  neutral: number;
  negative: number;
}

export interface HotelPlatformLinks {
  google?: string | null;
  booking?: string | null;
  airbnb?: string | null;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  rating: number;
  totalReviews: number;
  sentimentScore: number;
  qualityScore: number;
  sustainabilityScore: number;
  favoritesCount: number;
  platforms: HotelPlatforms;
  platformLinks: HotelPlatformLinks;
  sentiments: HotelSentiments;
  features: string[];
  description: string;
  highlightReview?: string;
  imageUrl: string;
}

export interface HotelReview {
  id: string;
  author: string;
  platform: ReviewPlatform;
  rating: number;
  date: string;
  text: string;
  sentiment: ReviewSentiment;
  positiveText?: string;
  negativeText?: string;
  topics: string[];
}

export interface HotelReviewsResponse {
  hotelId: string;
  total: number;
  reviews: HotelReview[];
}

export interface HotelFilters {
  query?: string;
  sort?: string;
  minReviews?: number;
  minRating?: number;
  minQuality?: number;
  minSustainability?: number;
  platforms?: string[];
}
