/**
 * Shared type definitions for test files
 */

// Generic API response types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// User-related response types
export interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  is_active?: boolean;
  is_approved?: boolean;
  created_at?: string;
}

export interface UsersListData {
  items: UserData[];
  total: number;
  limit: number;
  offset: number;
}

// Article-related response types
export interface ArticleData {
  id: number;
  slug: string;
  title: string;
  body?: string;
  author?: string;
}

export interface ArticlesListData {
  items: ArticleData[];
  total: number;
  limit: number;
  offset: number;
}

// Auth response types
export interface LoginSuccessData {
  user: UserData;
}

export interface MeData {
  user: UserData;
}

/**
 * Type-safe JSON parsing helper
 * Usage: const data = await parseJson<MyType>(response);
 */
export async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
