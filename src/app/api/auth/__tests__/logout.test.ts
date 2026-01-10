import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../logout/route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  deleteSession: vi.fn(),
  getSessionCookieName: vi.fn(() => 'peabod_session'),
}));

import { cookies } from 'next/headers';
import { deleteSession, getSessionCookieName } from '@/lib/session';

const mockCookies = vi.mocked(cookies);
const mockDeleteSession = vi.mocked(deleteSession);
const mockGetSessionCookieName = vi.mocked(getSessionCookieName);

describe('POST /api/auth/logout', () => {
  let mockCookieStore: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCookieStore = {
      get: vi.fn(),
      delete: vi.fn(),
    };

    mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    mockDeleteSession.mockResolvedValue(undefined);
  });

  describe('With Active Session', () => {
    it('should delete session and clear cookie when session exists', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'test-session-id' });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCookieStore.get).toHaveBeenCalledWith('peabod_session');
      expect(mockDeleteSession).toHaveBeenCalledWith('test-session-id');
      expect(mockCookieStore.delete).toHaveBeenCalledWith('peabod_session');
    });
  });

  describe('Without Active Session', () => {
    it('should still succeed when no session cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDeleteSession).not.toHaveBeenCalled();
      expect(mockCookieStore.delete).toHaveBeenCalledWith('peabod_session');
    });

    it('should still succeed when cookie value is empty', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Cookie Name', () => {
    it('should use correct session cookie name', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'session-id' });

      await POST();

      expect(mockGetSessionCookieName).toHaveBeenCalled();
      expect(mockCookieStore.get).toHaveBeenCalledWith('peabod_session');
      expect(mockCookieStore.delete).toHaveBeenCalledWith('peabod_session');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when cookie access fails', async () => {
      mockCookies.mockRejectedValue(new Error('Cookie access denied'));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to log out');
    });

    it('should return 500 when session deletion fails', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'test-session-id' });
      mockDeleteSession.mockRejectedValue(new Error('Database error'));

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to log out');
    });
  });
});
