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
  auth: {
    login: '/api/v1/auth/login',
  },
  platforms: {
    list: '/api/v1/platforms',
    detail: (id: string) => `/api/v1/platforms/${id}`,
    toggle: (id: string) => `/api/v1/platforms/${id}/toggle`,
  },
  sentiments: {
    list: '/api/v1/sentiments',
    detail: (id: string) => `/api/v1/sentiments/${id}`,
    toggle: (id: string) => `/api/v1/sentiments/${id}/toggle`,
  },
  scrapings: {
    list: '/api/v1/scrapings',
    activate: (id: string) => `/api/v1/scrapings/${id}/activate`,
  },
  users: {
    list: '/api/v1/users',
    detail: (id: string) => `/api/v1/users/${id}`,
  },
} as const;
