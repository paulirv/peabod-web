import { describe, it, expect, vi, beforeEach } from 'vitest';
import { headers } from 'next/headers';
import {
  getZeroTrustUser,
  isAdmin,
  getCurrentUser,
  isAuthenticated,
  isSuperAdmin,
  requireAuth,
} from '../auth';
import { createSessionUser } from '@/test/utils/factories';

// Mock the session module
vi.mock('../session', () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from '../session';

const mockGetSessionUser = vi.mocked(getSessionUser);
const mockHeaders = vi.mocked(headers);

describe('Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getZeroTrustUser', () => {
    it('should return email when CF-Access-Jwt-Assertion header is present', async () => {
      // Create a valid JWT-like structure (header.payload.signature)
      const payload = { email: 'admin@example.com' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${encodedPayload}.signature`;

      mockHeaders.mockResolvedValue({
        get: vi.fn((name: string) => (name === 'cf-access-jwt-assertion' ? mockJwt : null)),
      } as unknown as Headers);

      const result = await getZeroTrustUser();

      expect(result).toBe('admin@example.com');
    });

    it('should return null when header is missing', async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn(() => null),
      } as unknown as Headers);

      const result = await getZeroTrustUser();

      expect(result).toBeNull();
    });

    it('should return null for invalid JWT structure', async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn((name: string) => (name === 'cf-access-jwt-assertion' ? 'invalid' : null)),
      } as unknown as Headers);

      const result = await getZeroTrustUser();

      expect(result).toBeNull();
    });

    it('should return null when JWT payload has no email', async () => {
      const payload = { sub: 'user123' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${encodedPayload}.signature`;

      mockHeaders.mockResolvedValue({
        get: vi.fn((name: string) => (name === 'cf-access-jwt-assertion' ? mockJwt : null)),
      } as unknown as Headers);

      const result = await getZeroTrustUser();

      expect(result).toBeNull();
    });

    it('should handle malformed JSON in JWT payload', async () => {
      const mockJwt = 'header.notvalidbase64json.signature';

      mockHeaders.mockResolvedValue({
        get: vi.fn((name: string) => (name === 'cf-access-jwt-assertion' ? mockJwt : null)),
      } as unknown as Headers);

      const result = await getZeroTrustUser();

      expect(result).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true when Zero Trust user exists', async () => {
      const payload = { email: 'admin@example.com' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${encodedPayload}.signature`;

      mockHeaders.mockResolvedValue({
        get: vi.fn((name: string) => (name === 'cf-access-jwt-assertion' ? mockJwt : null)),
      } as unknown as Headers);

      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it('should return false when no Zero Trust user', async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn(() => null),
      } as unknown as Headers);

      const result = await isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return session user when authenticated', async () => {
      const mockUser = createSessionUser({ id: 1, email: 'user@example.com' });
      mockGetSessionUser.mockResolvedValue(mockUser);

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockGetSessionUser).toHaveBeenCalled();
    });

    it('should return null when not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when session user exists', async () => {
      const mockUser = createSessionUser();
      mockGetSessionUser.mockResolvedValue(mockUser);

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no session user', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true when user is superadmin', async () => {
      const mockUser = createSessionUser({ is_superadmin: true, role: 'admin' });
      mockGetSessionUser.mockResolvedValue(mockUser);

      const result = await isSuperAdmin();

      expect(result).toBe(true);
    });

    it('should return false when user is not superadmin', async () => {
      const mockUser = createSessionUser({ is_superadmin: false, role: 'editor' });
      mockGetSessionUser.mockResolvedValue(mockUser);

      const result = await isSuperAdmin();

      expect(result).toBe(false);
    });

    it('should return false when no user', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const result = await isSuperAdmin();

      expect(result).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = createSessionUser({ id: 1, email: 'user@example.com' });
      mockGetSessionUser.mockResolvedValue(mockUser);

      const result = await requireAuth();

      expect(result).toEqual(mockUser);
    });

    it('should throw error when not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow('Authentication required');
    });
  });
});
