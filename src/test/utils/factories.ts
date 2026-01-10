import type { UserRole } from '@/types/user';

/**
 * Factory for creating test user data
 */
export function createTestUser(overrides: Partial<{
  id: number;
  email: string;
  name: string;
  bio: string | null;
  avatar_media_id: number | null;
  role: UserRole;
  is_active: boolean;
  is_approved: boolean;
}> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    avatar_media_id: null,
    role: 'author' as UserRole,
    is_active: true,
    is_approved: true,
    ...overrides,
  };
}

/**
 * Factory for creating test session user data
 */
export function createSessionUser(overrides: Partial<{
  id: number;
  email: string;
  name: string;
  bio: string | null;
  avatar_media_id: number | null;
  role: UserRole;
  is_superadmin: boolean;
}> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    avatar_media_id: null,
    role: 'author' as UserRole,
    is_superadmin: false,
    ...overrides,
  };
}

/**
 * Factory for creating test article data
 */
export function createTestArticle(overrides: Partial<{
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  author_id: number;
  media_id: number | null;
}> = {}) {
  return {
    id: 1,
    title: 'Test Article',
    slug: 'test-article',
    content: '<p>Test content</p>',
    excerpt: 'Test excerpt',
    status: 'draft',
    author_id: 1,
    media_id: null,
    ...overrides,
  };
}

/**
 * Factory for creating test media data
 */
export function createTestMedia(overrides: Partial<{
  id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
}> = {}) {
  return {
    id: 1,
    filename: 'test-image.jpg',
    original_filename: 'Original Image.jpg',
    mime_type: 'image/jpeg',
    size: 1024,
    width: 800,
    height: 600,
    ...overrides,
  };
}

/**
 * Factory for creating test session data
 */
export function createTestSession(overrides: Partial<{
  id: string;
  user_id: number;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
}> = {}) {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: 'test-session-id-12345',
    user_id: 1,
    expires_at: futureDate,
    ip_address: '127.0.0.1',
    user_agent: 'Test User Agent',
    ...overrides,
  };
}
