export const apiEndpoints = {
  dashboard: {
    summary: '/api/v1/dashboard/summary',
    categories: '/api/v1/dashboard/categories',
  },
  hotels: {
    list: '/api/v1/hotels',
    advancedSearch: '/api/v1/hotels/advanced-search',
    detail: (hotelId: string) => `/api/v1/hotels/${hotelId}`,
    analytics: (hotelId: string) => `/api/v1/hotels/${hotelId}/analytics`,
    reviews: (hotelId: string) => `/api/v1/hotels/${hotelId}/reviews`,
    favorite: (hotelId: string) => `/api/v1/hotels/${hotelId}/favorite`,
  },
  scrapping: {
    status: '/api/v1/scrapping/status',
  },
} as const;
