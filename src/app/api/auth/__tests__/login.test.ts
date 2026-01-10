import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../login/route';
import { createMockDBUser } from '@/test/mocks/api-helpers';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getDB: vi.fn(),
}));

vi.mock('@/lib/password', () => ({
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  createSession: vi.fn(),
  setSessionCookie: vi.fn(),
}));

import { getDB } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/session';

const mockGetDB = vi.mocked(getDB);
const mockVerifyPassword = vi.mocked(verifyPassword);
const mockCreateSession = vi.mocked(createSession);
const mockSetSessionCookie = vi.mocked(setSessionCookie);

describe('POST /api/auth/login', () => {
  let mockDB: {
    prepare: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDB = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(),
        })),
      })),
    };

    mockGetDB.mockReturnValue(mockDB as unknown as D1Database);
    mockCreateSession.mockResolvedValue('test-session-id');
    mockSetSessionCookie.mockResolvedValue(undefined);
  });

  function createRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
  }

  describe('Validation', () => {
    it('should return 400 when email is missing', async () => {
      const request = createRequest({ password: 'password123' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const request = createRequest({ email: 'test@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email and password are required');
    });

    it('should return 400 when both email and password are missing', async () => {
      const request = createRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('User Lookup', () => {
    it('should return 401 when user does not exist', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(null),
        })),
      });

      const request = createRequest({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should normalize email to lowercase', async () => {
      const bindMock = vi.fn(() => ({
        first: vi.fn().mockResolvedValue(null),
      }));

      mockDB.prepare.mockReturnValue({ bind: bindMock });

      const request = createRequest({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      await POST(request);

      expect(bindMock).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Account Status', () => {
    it('should return 403 when account is deactivated', async () => {
      const inactiveUser = createMockDBUser({ is_active: 0 });

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(inactiveUser),
        })),
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Account is deactivated');
    });

    it('should return 403 when account is pending approval', async () => {
      const pendingUser = createMockDBUser({ is_approved: 0 });

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(pendingUser),
        })),
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Your account is pending admin approval');
      expect(data.pending_approval).toBe(true);
    });
  });

  describe('Password Verification', () => {
    it('should return 401 when password is incorrect', async () => {
      const user = createMockDBUser();

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(user),
        })),
      });
      mockVerifyPassword.mockResolvedValue(false);

      const request = createRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email or password');
      expect(mockVerifyPassword).toHaveBeenCalledWith('wrongpassword', user.password_hash);
    });
  });

  describe('Successful Login', () => {
    it('should create session and return user data on successful login', async () => {
      const user = createMockDBUser({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'author',
      });

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(user),
        })),
      });
      mockVerifyPassword.mockResolvedValue(true);

      const request = createRequest({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'author',
        is_superadmin: false,
      });

      expect(mockCreateSession).toHaveBeenCalledWith(1, undefined, undefined);
      expect(mockSetSessionCookie).toHaveBeenCalledWith('test-session-id');
    });

    it('should set is_superadmin true for admin users', async () => {
      const adminUser = createMockDBUser({
        id: 1,
        role: 'admin',
      });

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(adminUser),
        })),
      });
      mockVerifyPassword.mockResolvedValue(true);

      const request = createRequest({
        email: 'admin@example.com',
        password: 'password',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.is_superadmin).toBe(true);
      expect(data.data.role).toBe('admin');
    });

    it('should pass IP address and user agent to session creation', async () => {
      const user = createMockDBUser();

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(user),
        })),
      });
      mockVerifyPassword.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        headers: {
          'content-type': 'application/json',
          'cf-connecting-ip': '192.168.1.1',
          'user-agent': 'Test Browser',
        },
      });

      await POST(request);

      expect(mockCreateSession).toHaveBeenCalledWith(1, '192.168.1.1', 'Test Browser');
    });

    it('should default role to author if not set', async () => {
      const user = createMockDBUser({ role: undefined as unknown as string });

      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(user),
        })),
      });
      mockVerifyPassword.mockResolvedValue(true);

      const request = createRequest({
        email: 'test@example.com',
        password: 'password',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.role).toBe('author');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockDB.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'password',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to log in');
    });
  });
});
