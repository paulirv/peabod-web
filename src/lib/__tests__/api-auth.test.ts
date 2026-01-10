import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requireAdmin,
  requireEditor,
  requireAuthor,
  requireOwnerOrEditor,
  getAuthUser,
} from '../api-auth';
import { createSessionUser } from '@/test/utils/factories';

// Mock the session module
vi.mock('../session', () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from '../session';

const mockGetSessionUser = vi.mocked(getSessionUser);

describe('API Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAdmin', () => {
    it('should allow admin users', async () => {
      const adminUser = createSessionUser({ id: 1, role: 'admin' });
      mockGetSessionUser.mockResolvedValue(adminUser);

      const result = await requireAdmin();

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.user.role).toBe('admin');
        expect(result.user.id).toBe(1);
      }
    });

    it('should reject editor users', async () => {
      const editorUser = createSessionUser({ role: 'editor' });
      mockGetSessionUser.mockResolvedValue(editorUser);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const body = await result.response.json();
        expect(body.error).toBe('Admin access required');
        expect(result.response.status).toBe(403);
      }
    });

    it('should reject author users', async () => {
      const authorUser = createSessionUser({ role: 'author' });
      mockGetSessionUser.mockResolvedValue(authorUser);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(403);
      }
    });

    it('should reject unauthenticated users', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const body = await result.response.json();
        expect(body.error).toBe('Authentication required');
        expect(result.response.status).toBe(401);
      }
    });
  });

  describe('requireEditor', () => {
    it('should allow admin users', async () => {
      const adminUser = createSessionUser({ role: 'admin' });
      mockGetSessionUser.mockResolvedValue(adminUser);

      const result = await requireEditor();

      expect(result.authorized).toBe(true);
    });

    it('should allow editor users', async () => {
      const editorUser = createSessionUser({ role: 'editor' });
      mockGetSessionUser.mockResolvedValue(editorUser);

      const result = await requireEditor();

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.user.role).toBe('editor');
      }
    });

    it('should reject author users', async () => {
      const authorUser = createSessionUser({ role: 'author' });
      mockGetSessionUser.mockResolvedValue(authorUser);

      const result = await requireEditor();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const body = await result.response.json();
        expect(body.error).toBe('Editor access required');
        expect(result.response.status).toBe(403);
      }
    });

    it('should reject unauthenticated users', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await requireEditor();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(401);
      }
    });
  });

  describe('requireAuthor', () => {
    it('should allow admin users', async () => {
      const adminUser = createSessionUser({ role: 'admin' });
      mockGetSessionUser.mockResolvedValue(adminUser);

      const result = await requireAuthor();

      expect(result.authorized).toBe(true);
    });

    it('should allow editor users', async () => {
      const editorUser = createSessionUser({ role: 'editor' });
      mockGetSessionUser.mockResolvedValue(editorUser);

      const result = await requireAuthor();

      expect(result.authorized).toBe(true);
    });

    it('should allow author users', async () => {
      const authorUser = createSessionUser({ role: 'author' });
      mockGetSessionUser.mockResolvedValue(authorUser);

      const result = await requireAuthor();

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.user.role).toBe('author');
      }
    });

    it('should reject unauthenticated users', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await requireAuthor();

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const body = await result.response.json();
        expect(body.error).toBe('Authentication required');
        expect(result.response.status).toBe(401);
      }
    });
  });

  describe('requireOwnerOrEditor', () => {
    it('should allow admin users regardless of ownership', async () => {
      const adminUser = createSessionUser({ id: 1, role: 'admin' });
      mockGetSessionUser.mockResolvedValue(adminUser);

      // Admin can access resource owned by someone else
      const result = await requireOwnerOrEditor(999);

      expect(result.authorized).toBe(true);
    });

    it('should allow editor users regardless of ownership', async () => {
      const editorUser = createSessionUser({ id: 2, role: 'editor' });
      mockGetSessionUser.mockResolvedValue(editorUser);

      // Editor can access resource owned by someone else
      const result = await requireOwnerOrEditor(999);

      expect(result.authorized).toBe(true);
    });

    it('should allow author users who own the resource', async () => {
      const authorUser = createSessionUser({ id: 5, role: 'author' });
      mockGetSessionUser.mockResolvedValue(authorUser);

      // Author accessing their own resource
      const result = await requireOwnerOrEditor(5);

      expect(result.authorized).toBe(true);
    });

    it('should reject author users who do not own the resource', async () => {
      const authorUser = createSessionUser({ id: 5, role: 'author' });
      mockGetSessionUser.mockResolvedValue(authorUser);

      // Author trying to access someone else's resource
      const result = await requireOwnerOrEditor(999);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        const body = await result.response.json();
        expect(body.error).toBe('You can only modify your own content');
        expect(result.response.status).toBe(403);
      }
    });

    it('should reject unauthenticated users', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await requireOwnerOrEditor(1);

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.response.status).toBe(401);
      }
    });

    it('should handle null resource author ID for admin', async () => {
      const adminUser = createSessionUser({ id: 1, role: 'admin' });
      mockGetSessionUser.mockResolvedValue(adminUser);

      const result = await requireOwnerOrEditor(null);

      expect(result.authorized).toBe(true);
    });

    it('should handle null resource author ID for author (deny)', async () => {
      const authorUser = createSessionUser({ id: 5, role: 'author' });
      mockGetSessionUser.mockResolvedValue(authorUser);

      // Author can't claim null-owned resources
      const result = await requireOwnerOrEditor(null);

      expect(result.authorized).toBe(false);
    });
  });

  describe('getAuthUser', () => {
    it('should return session user when authenticated', async () => {
      const mockUser = createSessionUser({ id: 1, email: 'user@example.com' });
      mockGetSessionUser.mockResolvedValue(mockUser);

      const result = await getAuthUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await getAuthUser();

      expect(result).toBeNull();
    });
  });
});
