const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

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
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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
