import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../register/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getDB: vi.fn(),
}));

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  createSession: vi.fn(),
  setSessionCookie: vi.fn(),
}));

import { getDB } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/session';

const mockGetDB = vi.mocked(getDB);
const mockHashPassword = vi.mocked(hashPassword);
const mockCreateSession = vi.mocked(createSession);
const mockSetSessionCookie = vi.mocked(setSessionCookie);

describe('POST /api/auth/register', () => {
  let mockDB: {
    prepare: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDB = {
      prepare: vi.fn(),
    };

    mockGetDB.mockReturnValue(mockDB as unknown as D1Database);
    mockHashPassword.mockResolvedValue('hashed-password');
    mockCreateSession.mockResolvedValue('test-session-id');
    mockSetSessionCookie.mockResolvedValue(undefined);
  });

  function createRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
  }

  describe('Validation', () => {
    it('should return 400 when email is missing', async () => {
      const request = createRequest({
        password: 'password123',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email, password, and name are required');
    });

    it('should return 400 when password is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email, password, and name are required');
    });

    it('should return 400 when name is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email, password, and name are required');
    });

    it('should return 400 when password is too short', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
    });

    it('should return 400 for invalid email format', async () => {
      const request = createRequest({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('should return 400 when name is too short', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
        name: 'A',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name must be at least 2 characters');
    });

    it('should trim whitespace from name when checking length', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
        name: '  A  ',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name must be at least 2 characters');
    });
  });

  describe('Duplicate Email Check', () => {
    it('should return 409 when email already exists', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue({ id: 1 }),
        })),
      });

      const request = createRequest({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email already registered');
    });
  });

  describe('First User Registration', () => {
    it('should auto-approve first user as admin', async () => {
      const bindMock = vi.fn();
      const runMock = vi.fn().mockResolvedValue({
        meta: { last_row_id: 1 },
      });

      // Setup mock responses for different queries
      let queryCount = 0;
      mockDB.prepare.mockImplementation(() => ({
        bind: bindMock.mockImplementation(() => ({
          first: vi.fn().mockImplementation(async () => {
            queryCount++;
            if (queryCount === 1) return null; // Email doesn't exist
            if (queryCount === 2) return { count: 0 }; // No users yet
            return null;
          }),
          run: runMock,
        })),
        first: vi.fn().mockResolvedValue({ count: 0 }),
      }));

      const request = createRequest({
        email: 'first@example.com',
        password: 'password123',
        name: 'First User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.role).toBe('admin');
      expect(data.data.is_superadmin).toBe(true);
      expect(mockCreateSession).toHaveBeenCalled();
      expect(mockSetSessionCookie).toHaveBeenCalled();
    });
  });

  describe('Subsequent User Registration', () => {
    it('should create user as pending author for non-first users', async () => {
      let queryCount = 0;
      const runMock = vi.fn().mockResolvedValue({
        meta: { last_row_id: 2 },
      });

      mockDB.prepare.mockImplementation(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockImplementation(async () => {
            queryCount++;
            if (queryCount === 1) return null; // Email doesn't exist
            if (queryCount === 2) return { count: 5 }; // 5 users exist
            return null;
          }),
          run: runMock,
        })),
        first: vi.fn().mockResolvedValue({ count: 5 }),
      }));

      const request = createRequest({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.pending_approval).toBe(true);
      expect(data.message).toContain('pending admin approval');
      expect(mockCreateSession).not.toHaveBeenCalled();
      expect(mockSetSessionCookie).not.toHaveBeenCalled();
    });
  });

  describe('Email Normalization', () => {
    it('should normalize email to lowercase', async () => {
      const bindMock = vi.fn(() => ({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
      }));

      let callCount = 0;
      mockDB.prepare.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          // User count query
          return {
            bind: () => ({ first: vi.fn().mockResolvedValue({ count: 0 }) }),
            first: vi.fn().mockResolvedValue({ count: 0 }),
          };
        }
        return { bind: bindMock };
      });

      const request = createRequest({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User',
      });

      await POST(request);

      // First call should be email check with lowercase
      expect(bindMock).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before storing', async () => {
      let queryCount = 0;
      mockDB.prepare.mockImplementation(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockImplementation(async () => {
            queryCount++;
            if (queryCount === 1) return null;
            if (queryCount === 2) return { count: 0 };
            return null;
          }),
          run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        })),
        first: vi.fn().mockResolvedValue({ count: 0 }),
      }));

      const request = createRequest({
        email: 'test@example.com',
        password: 'mySecretPassword',
        name: 'Test User',
      });

      await POST(request);

      expect(mockHashPassword).toHaveBeenCalledWith('mySecretPassword');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockDB.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to register user');
    });
  });

  describe('Valid Email Formats', () => {
    it.each([
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user@subdomain.example.com',
    ])('should accept valid email: %s', async (email) => {
      // Setup mock that handles both bind().first() and prepare().first()
      let callCount = 0;
      mockDB.prepare.mockImplementation(() => {
        return {
          bind: vi.fn(() => ({
            first: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount === 1) return null; // Email doesn't exist
              return null;
            }),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
          })),
          first: vi.fn().mockResolvedValue({ count: 5 }), // 5 users exist (not first user)
        };
      });

      const request = createRequest({
        email,
        password: 'password123',
        name: 'Test User',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Invalid Email Formats', () => {
    it.each([
      'invalid',
      '@example.com',
      'user@',
      'user@.com',
      'user@example',
      'user name@example.com',
    ])('should reject invalid email: %s', async (email) => {
      const request = createRequest({
        email,
        password: 'password123',
        name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });
  });
});
