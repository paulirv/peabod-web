export type UserRole = "admin" | "editor" | "author";

export interface User {
  id: number;
  email: string;
  name: string;
  bio: string | null;
  avatar_media_id: number | null;
  role: UserRole;
  is_active: boolean;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: number | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: number;
  name: string;
  bio: string | null;
  avatar_path: string | null;
  created_at: string;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  bio: string | null;
  avatar_media_id: number | null;
  role: UserRole;
  is_superadmin: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    is_superadmin: boolean;
  };
  error?: string;
  pending_approval?: boolean;
}

export interface UserUpdateInput {
  name?: string;
  bio?: string | null;
  avatar_media_id?: number | null;
  role?: UserRole;
  is_active?: boolean;
  is_approved?: boolean;
}
