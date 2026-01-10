import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '../me/route';
import { createSessionUser } from '@/test/utils/factories';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getDB: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

import { getDB } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

const mockGetDB = vi.mocked(getDB);
const mockGetSessionUser = vi.mocked(getSessionUser);

describe('/api/auth/me', () => {
  let mockDB: {
    prepare: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDB = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        })),
      })),
    };

    mockGetDB.mockReturnValue(mockDB as unknown as D1Database);
  });

  describe('GET /api/auth/me', () => {
    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockGetSessionUser.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Not authenticated');
      });
    });

    describe('User Data', () => {
      it('should return user data when authenticated', async () => {
        const user = createSessionUser({
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'author',
        });
        mockGetSessionUser.mockResolvedValue(user);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.id).toBe(1);
        expect(data.data.email).toBe('test@example.com');
        expect(data.data.name).toBe('Test User');
      });

      it('should include avatar_path when user has avatar', async () => {
        const user = createSessionUser({
          id: 1,
          avatar_media_id: 5,
        });
        mockGetSessionUser.mockResolvedValue(user);

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            first: vi.fn().mockResolvedValue({ path: 'uploads/avatar.jpg' }),
          })),
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.avatar_path).toBe('uploads/avatar.jpg');
      });

      it('should return null avatar_path when user has no avatar', async () => {
        const user = createSessionUser({
          id: 1,
          avatar_media_id: null,
        });
        mockGetSessionUser.mockResolvedValue(user);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.avatar_path).toBe(null);
      });

      it('should return null avatar_path when media record not found', async () => {
        const user = createSessionUser({
          id: 1,
          avatar_media_id: 999, // Non-existent
        });
        mockGetSessionUser.mockResolvedValue(user);

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(null),
          })),
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.avatar_path).toBe(null);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        const user = createSessionUser({ avatar_media_id: 1 });
        mockGetSessionUser.mockResolvedValue(user);

        mockDB.prepare.mockImplementation(() => {
          throw new Error('Database error');
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to get user');
      });
    });
  });

  describe('PATCH /api/auth/me', () => {
    function createRequest(body: object): NextRequest {
      return new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });
    }

    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockGetSessionUser.mockResolvedValue(null);

        const request = createRequest({ name: 'New Name' });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Not authenticated');
      });
    });

    describe('Validation', () => {
      it('should return 400 when no fields to update', async () => {
        const user = createSessionUser();
        mockGetSessionUser.mockResolvedValue(user);

        const request = createRequest({});
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('No fields to update');
      });

      it('should return 400 when name is too short', async () => {
        const user = createSessionUser();
        mockGetSessionUser.mockResolvedValue(user);

        const request = createRequest({ name: 'A' });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Name must be at least 2 characters');
      });

      it('should return 400 when trimmed name is too short', async () => {
        const user = createSessionUser();
        mockGetSessionUser.mockResolvedValue(user);

        const request = createRequest({ name: '  A  ' });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Name must be at least 2 characters');
      });
    });

    describe('Profile Updates', () => {
      it('should update name', async () => {
        const user = createSessionUser({ id: 1 });
        mockGetSessionUser.mockResolvedValue(user);

        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ success: true }),
          first: vi.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            name: 'New Name',
            bio: null,
            avatar_media_id: null,
          }),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({ name: 'New Name' });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('New Name');
      });

      it('should update bio', async () => {
        const user = createSessionUser({ id: 1 });
        mockGetSessionUser.mockResolvedValue(user);

        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ success: true }),
          first: vi.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            bio: 'New bio text',
            avatar_media_id: null,
          }),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({ bio: 'New bio text' });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.bio).toBe('New bio text');
      });

      it('should update avatar_media_id', async () => {
        const user = createSessionUser({ id: 1 });
        mockGetSessionUser.mockResolvedValue(user);

        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ success: true }),
          first: vi.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            bio: null,
            avatar_media_id: 5,
          }),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({ avatar_media_id: 5 });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.avatar_media_id).toBe(5);
      });

      it('should allow setting avatar_media_id to null', async () => {
        const user = createSessionUser({ id: 1 });
        mockGetSessionUser.mockResolvedValue(user);

        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ success: true }),
          first: vi.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            bio: null,
            avatar_media_id: null,
          }),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({ avatar_media_id: null });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should update multiple fields at once', async () => {
        const user = createSessionUser({ id: 1 });
        mockGetSessionUser.mockResolvedValue(user);

        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ success: true }),
          first: vi.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            name: 'Updated Name',
            bio: 'Updated bio',
            avatar_media_id: 10,
          }),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({
          name: 'Updated Name',
          bio: 'Updated bio',
          avatar_media_id: 10,
        });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('Updated Name');
        expect(data.data.bio).toBe('Updated bio');
        expect(data.data.avatar_media_id).toBe(10);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        const user = createSessionUser();
        mockGetSessionUser.mockResolvedValue(user);

        mockDB.prepare.mockImplementation(() => {
          throw new Error('Database error');
        });

        const request = createRequest({ name: 'New Name' });
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to update profile');
      });
    });
  });
});
