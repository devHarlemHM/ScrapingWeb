export interface DashboardSummary {
  totalReviews: number;
  iaPrecision: number;
  totalPlatforms: number;
  starsScaleMin: number;
  starsScaleMax: number;
}

export interface DashboardCategory {
  id: string;
  name: string;
  description: string;
  count: number;
  sort: string;
}
