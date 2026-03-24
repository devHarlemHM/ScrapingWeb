import { useEffect, useMemo, useState } from 'react';

import type { DashboardCategory, DashboardSummary } from '../models/dashboard';
import { dashboardService } from '../services/dashboardService';

const fallbackSummary: DashboardSummary = {
  totalReviews: 15000,
  iaPrecision: 95,
  totalPlatforms: 3,
  starsScaleMin: 1,
  starsScaleMax: 5,
};

const dashboardCache: {
  summary: DashboardSummary;
  categories: DashboardCategory[];
} = {
  summary: fallbackSummary,
  categories: [],
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useDashboardData() {
  const [summary, setSummary] = useState<DashboardSummary>(dashboardCache.summary);
  const [categories, setCategories] = useState<DashboardCategory[]>(dashboardCache.categories);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      const maxAttempts = 3;
      try {
        setIsLoading(true);
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            const [summaryResponse, categoriesResponse] = await Promise.all([
              dashboardService.getSummary(controller.signal),
              dashboardService.getCategories(controller.signal),
            ]);

            dashboardCache.summary = summaryResponse;
            dashboardCache.categories = categoriesResponse;

            setSummary(summaryResponse);
            setCategories(categoriesResponse);
            setError(null);
            return;
          } catch (attemptError) {
            if (attemptError instanceof DOMException && attemptError.name === 'AbortError') {
              return;
            }

            if (attempt === maxAttempts) {
              throw attemptError;
            }

            await sleep(300 * attempt);
          }
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
        setSummary(dashboardCache.summary);
        setCategories(dashboardCache.categories);
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, []);

  const categoriesBySort = useMemo(() => {
    return categories.reduce<Record<string, DashboardCategory>>((acc, category) => {
      acc[category.sort] = category;
      return acc;
    }, {});
  }, [categories]);

  return {
    summary,
    categories,
    categoriesBySort,
    isLoading,
    error,
  };
}
