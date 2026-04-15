export interface PlatformConfig {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface SentimentConfig {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface ScrapingConfig {
  id: string;
  source: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export type UserRole = 'admin' | 'consultant';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  authenticated: boolean;
  token: string;
  user: AppUser;
}
