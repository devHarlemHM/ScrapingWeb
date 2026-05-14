const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:8010' : '/api');
const AUTH_STORAGE_KEY = 'hotelens.auth';

function buildApiUrl(path: string): string {
  if (!API_BASE_URL) {
    return path;
  }

  const normalizedBase = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  // Avoid /api/api/... when base is /api and endpoint already includes /api
  if (path.startsWith('/api/') && normalizedBase.endsWith('/api')) {
    return path;
  }

  return `${normalizedBase}${path}`;
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildApiUrl(path);
  let accessToken: string | null = null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      accessToken = parsed?.token ?? null;
    }
  } catch {
    accessToken = null;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const fallbackMessage = `Error HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      throw new ApiError(payload.detail ?? fallbackMessage, response.status);
    } catch {
      throw new ApiError(fallbackMessage, response.status);
    }
  }

  return (await response.json()) as T;
}
