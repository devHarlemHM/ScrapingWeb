import { apiRequest } from '../core/apiClient';
import type { DashboardCategory, DashboardSummary } from '../models/dashboard';
import { apiEndpoints } from './endpoints';

interface ApiDashboardSummary {
  total_reviews: number;
  ia_precision: number;
  total_platforms: number;
  stars_scale_min: number;
  stars_scale_max: number;
}

interface ApiDashboardCategory {
  id: string;
  name: string;
  description: string;
  count: number;
  sort: string;
}

function mapSummary(summary: ApiDashboardSummary): DashboardSummary {
  return {
    totalReviews: summary.total_reviews,
    iaPrecision: summary.ia_precision,
    totalPlatforms: summary.total_platforms,
    starsScaleMin: summary.stars_scale_min,
    starsScaleMax: summary.stars_scale_max,
  };
}

export const dashboardService = {
  async getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
    const response = await apiRequest<ApiDashboardSummary>(apiEndpoints.dashboard.summary, { signal });
    return mapSummary(response);
  },

  async getCategories(signal?: AbortSignal): Promise<DashboardCategory[]> {
    const response = await apiRequest<ApiDashboardCategory[]>(apiEndpoints.dashboard.categories, { signal });
    return response;
  },
};
