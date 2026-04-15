import { apiRequest } from '../core/apiClient';
import { apiEndpoints } from './endpoints';
import type { AppUser, LoginResponse, PlatformConfig, ScrapingConfig, SentimentConfig, UserRole } from '../models/admin';

export const adminService = {
  login(email: string, password: string, signal?: AbortSignal) {
    return apiRequest<LoginResponse>(apiEndpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      signal,
    });
  },

  listPlatforms(active?: boolean, signal?: AbortSignal) {
    const query = active === undefined ? '' : `?active=${active}`;
    return apiRequest<PlatformConfig[]>(`${apiEndpoints.platforms.list}${query}`, { signal });
  },

  createPlatform(payload: { name: string; status: boolean }, signal?: AbortSignal) {
    return apiRequest<PlatformConfig>(apiEndpoints.platforms.list, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  updatePlatform(id: string, payload: { name: string; status: boolean }, signal?: AbortSignal) {
    return apiRequest<PlatformConfig>(apiEndpoints.platforms.detail(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal,
    });
  },

  togglePlatform(id: string, signal?: AbortSignal) {
    return apiRequest<PlatformConfig>(apiEndpoints.platforms.toggle(id), {
      method: 'PATCH',
      signal,
    });
  },

  deletePlatform(id: string, signal?: AbortSignal) {
    return apiRequest<{ ok: boolean }>(apiEndpoints.platforms.detail(id), {
      method: 'DELETE',
      signal,
    });
  },

  listSentiments(active?: boolean, signal?: AbortSignal) {
    const query = active === undefined ? '' : `?active=${active}`;
    return apiRequest<SentimentConfig[]>(`${apiEndpoints.sentiments.list}${query}`, { signal });
  },

  createSentiment(payload: { name: string; status: boolean }, signal?: AbortSignal) {
    return apiRequest<SentimentConfig>(apiEndpoints.sentiments.list, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  updateSentiment(id: string, payload: { name: string; status: boolean }, signal?: AbortSignal) {
    return apiRequest<SentimentConfig>(apiEndpoints.sentiments.detail(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal,
    });
  },

  toggleSentiment(id: string, signal?: AbortSignal) {
    return apiRequest<SentimentConfig>(apiEndpoints.sentiments.toggle(id), {
      method: 'PATCH',
      signal,
    });
  },

  deleteSentiment(id: string, signal?: AbortSignal) {
    return apiRequest<{ ok: boolean }>(apiEndpoints.sentiments.detail(id), {
      method: 'DELETE',
      signal,
    });
  },

  listScrapings(signal?: AbortSignal) {
    return apiRequest<ScrapingConfig[]>(apiEndpoints.scrapings.list, { signal });
  },

  activateScraping(id: string, signal?: AbortSignal) {
    return apiRequest<ScrapingConfig>(apiEndpoints.scrapings.activate(id), {
      method: 'PATCH',
      signal,
    });
  },

  listUsers(signal?: AbortSignal) {
    return apiRequest<AppUser[]>(apiEndpoints.users.list, { signal });
  },

  createUser(payload: { username: string; email: string; password: string; role: UserRole }, signal?: AbortSignal) {
    return apiRequest<AppUser>(apiEndpoints.users.list, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  updateUser(
    id: string,
    payload: { username: string; email: string; role: UserRole; password?: string },
    signal?: AbortSignal,
  ) {
    return apiRequest<AppUser>(apiEndpoints.users.detail(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal,
    });
  },

  deleteUser(id: string, signal?: AbortSignal) {
    return apiRequest<{ ok: boolean }>(apiEndpoints.users.detail(id), {
      method: 'DELETE',
      signal,
    });
  },
};
