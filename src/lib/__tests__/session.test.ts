import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cookies } from 'next/headers';
import { generateSessionId, getSessionCookieName } from '../session';

// Mock db module
vi.mock('../db', () => ({
  getDB: vi.fn(() => ({
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn(),
      })),
    })),
  })),
}));

const mockCookies = vi.mocked(cookies);

describe('Session Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionId', () => {
    it('should generate a 64-character hex string', () => {
      const sessionId = generateSessionId();

      expect(sessionId).toHaveLength(64);
      expect(sessionId).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique session IDs', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }

      // All 100 should be unique
      expect(ids.size).toBe(100);
    });

    it('should be cryptographically random', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      // Check they're not sequential or similar
      expect(id1).not.toBe(id2);

      // Check they have good distribution (not all same characters)
      const uniqueChars1 = new Set(id1.split('')).size;
      const uniqueChars2 = new Set(id2.split('')).size;

      // Should have reasonable diversity (at least 8 unique hex chars)
      expect(uniqueChars1).toBeGreaterThan(7);
      expect(uniqueChars2).toBeGreaterThan(7);
    });
  });

  describe('getSessionCookieName', () => {
    it('should return the session cookie name', () => {
      const cookieName = getSessionCookieName();

      expect(cookieName).toBe('peabod_session');
    });
  });

  describe('Session Cookie Operations', () => {
    it('should set cookie with correct options', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as unknown as ReturnType<typeof cookies>);

      // Import the function dynamically to get the mocked version
      const { setSessionCookie } = await import('../session');
      await setSessionCookie('test-session-id');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'peabod_session',
        'test-session-id',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });

    it('should clear session cookie', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as unknown as ReturnType<typeof cookies>);

      const { clearSessionCookie } = await import('../session');
      await clearSessionCookie();

      expect(mockCookieStore.delete).toHaveBeenCalledWith('peabod_session');
    });
  });

  describe('Session Duration', () => {
    it('should use 30-day session duration', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as unknown as ReturnType<typeof cookies>);

      const { setSessionCookie } = await import('../session');
      await setSessionCookie('test-session-id');

      const setCalls = mockCookieStore.set.mock.calls;
      expect(setCalls.length).toBeGreaterThan(0);

      const options = setCalls[0][2];
      // 30 days in seconds = 30 * 24 * 60 * 60 = 2592000
      expect(options.maxAge).toBe(2592000);
    });
  });
});

describe('Session Security', () => {
  describe('Session ID entropy', () => {
    it('should have sufficient entropy (32 bytes = 256 bits)', () => {
      // Generate multiple session IDs and verify they all have proper length
      for (let i = 0; i < 10; i++) {
        const sessionId = generateSessionId();
        // 32 bytes = 64 hex characters
        expect(sessionId.length).toBe(64);
      }
    });

    it('should not produce predictable patterns', () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(generateSessionId());
      }

      // Check no common prefixes (first 8 chars should vary)
      const prefixes = ids.map((id) => id.substring(0, 8));
      const uniquePrefixes = new Set(prefixes);
      expect(uniquePrefixes.size).toBe(10);

      // Check no common suffixes
      const suffixes = ids.map((id) => id.substring(56));
      const uniqueSuffixes = new Set(suffixes);
      expect(uniqueSuffixes.size).toBe(10);
    });
  });
});
