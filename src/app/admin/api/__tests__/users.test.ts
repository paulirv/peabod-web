import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../users/route';
import { createTestUser } from '@/test/utils/factories';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getDB: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn(),
}));

import { getDB } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/password';

const mockGetDB = vi.mocked(getDB);
const mockRequireAdmin = vi.mocked(requireAdmin);
const mockHashPassword = vi.mocked(hashPassword);

describe('/admin/api/users', () => {
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
  });

  describe('GET /admin/api/users', () => {
    describe('Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401 }
          ),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users');
        const response = await GET(request);

        expect(response.status).toBe(401);
      });

      it('should return 403 when not admin', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: new Response(
            JSON.stringify({ success: false, error: 'Admin access required' }),
            { status: 403 }
          ),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users');
        const response = await GET(request);

        expect(response.status).toBe(403);
      });
    });

    describe('Listing Users', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
        });
      });

      it('should return list of users', async () => {
        const users = [
          createTestUser({ id: 1, name: 'User 1' }),
          createTestUser({ id: 2, name: 'User 2' }),
        ];

        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id, email')) {
            return {
              bind: vi.fn(() => ({
                all: vi.fn().mockResolvedValue({ results: users }),
              })),
            };
          }
          if (sql.includes('COUNT')) {
            return {
              bind: vi.fn(() => ({
                first: vi.fn().mockResolvedValue({ total: 2 }),
              })),
              first: vi.fn().mockResolvedValue({ count: 0 }),
            };
          }
          return {
            bind: vi.fn(() => ({
              all: vi.fn().mockResolvedValue({ results: [] }),
              first: vi.fn().mockResolvedValue({ count: 0 }),
            })),
            first: vi.fn().mockResolvedValue({ count: 0 }),
          };
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.items).toHaveLength(2);
        expect(data.data.total).toBe(2);
      });

      it('should filter by role', async () => {
        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
          })),
          first: vi.fn().mockResolvedValue({ count: 0 }),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users?role=editor');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should filter by status pending', async () => {
        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
          })),
          first: vi.fn().mockResolvedValue({ count: 0 }),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users?status=pending');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should filter by status approved', async () => {
        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
          })),
          first: vi.fn().mockResolvedValue({ count: 0 }),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users?status=approved');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should filter by status inactive', async () => {
        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
          })),
          first: vi.fn().mockResolvedValue({ count: 0 }),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users?status=inactive');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should search by name or email', async () => {
        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
          })),
          first: vi.fn().mockResolvedValue({ count: 0 }),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users?search=john');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should include pending count in response', async () => {
        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id, email')) {
            return {
              bind: vi.fn(() => ({
                all: vi.fn().mockResolvedValue({ results: [] }),
              })),
            };
          }
          if (sql.includes('is_approved = 0 AND is_active = 1')) {
            return {
              first: vi.fn().mockResolvedValue({ count: 3 }),
            };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue({ total: 0 }),
            })),
            first: vi.fn().mockResolvedValue({ count: 0 }),
          };
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.pending_count).toBe(3);
      });

      it('should apply limit and offset', async () => {
        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0, count: 0 }),
          })),
          first: vi.fn().mockResolvedValue({ count: 0 }),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users?limit=10&offset=20');
        const response = await GET(request);
        const data = await response.json();

        expect(data.data.limit).toBe(10);
        expect(data.data.offset).toBe(20);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
        });

        mockDB.prepare.mockImplementation(() => {
          throw new Error('Database error');
        });

        const request = new NextRequest('http://localhost:3000/admin/api/users');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch users');
      });
    });
  });

  describe('POST /admin/api/users', () => {
    function createRequest(body: object): NextRequest {
      return new NextRequest('http://localhost:3000/admin/api/users', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });
    }

    describe('Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401 }
          ),
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        expect(response.status).toBe(401);
      });

      it('should return 403 when not admin', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: false,
          response: new Response(
            JSON.stringify({ success: false, error: 'Admin access required' }),
            { status: 403 }
          ),
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        expect(response.status).toBe(403);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
        });
      });

      it('should return 400 when email is missing', async () => {
        const request = createRequest({
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Email, password, and name are required');
      });

      it('should return 400 when password is missing', async () => {
        const request = createRequest({
          email: 'new@example.com',
          name: 'New User',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Email, password, and name are required');
      });

      it('should return 400 when name is missing', async () => {
        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Email, password, and name are required');
      });

      it('should return 400 when password is too short', async () => {
        const request = createRequest({
          email: 'new@example.com',
          password: 'short',
          name: 'New User',
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
          name: 'New User',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid email format');
      });
    });

    describe('User Creation', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
        });
      });

      it('should create user with default role author', async () => {
        const newUser = createTestUser({ id: 2 });

        let insertCalled = false;
        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id FROM users WHERE email')) {
            return {
              bind: vi.fn(() => ({
                first: vi.fn().mockResolvedValue(null),
              })),
            };
          }
          if (sql.includes('INSERT INTO users')) {
            insertCalled = true;
            return {
              bind: vi.fn(() => ({
                run: vi.fn().mockResolvedValue({ meta: { last_row_id: 2 } }),
              })),
            };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(newUser),
            })),
          };
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(insertCalled).toBe(true);
      });

      it('should create user with specified role', async () => {
        const newUser = createTestUser({ id: 2, role: 'editor' });

        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id FROM users WHERE email')) {
            return {
              bind: vi.fn(() => ({
                first: vi.fn().mockResolvedValue(null),
              })),
            };
          }
          if (sql.includes('INSERT INTO users')) {
            return {
              bind: vi.fn(() => ({
                run: vi.fn().mockResolvedValue({ meta: { last_row_id: 2 } }),
              })),
            };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(newUser),
            })),
          };
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
          role: 'editor',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      });

      it('should create pre-approved user (admin creates)', async () => {
        const newUser = createTestUser({ id: 2, is_approved: true });

        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id FROM users WHERE email')) {
            return {
              bind: vi.fn(() => ({
                first: vi.fn().mockResolvedValue(null),
              })),
            };
          }
          if (sql.includes('INSERT INTO users')) {
            // Verify is_approved = 1 is set
            return {
              bind: vi.fn(() => ({
                run: vi.fn().mockResolvedValue({ meta: { last_row_id: 2 } }),
              })),
            };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(newUser),
            })),
          };
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
      });

      it('should hash password before storing', async () => {
        const newUser = createTestUser({ id: 2 });

        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id FROM users WHERE email')) {
            return {
              bind: vi.fn(() => ({
                first: vi.fn().mockResolvedValue(null),
              })),
            };
          }
          if (sql.includes('INSERT INTO users')) {
            return {
              bind: vi.fn(() => ({
                run: vi.fn().mockResolvedValue({ meta: { last_row_id: 2 } }),
              })),
            };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(newUser),
            })),
          };
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'mySecretPassword',
          name: 'New User',
        });

        await POST(request);

        expect(mockHashPassword).toHaveBeenCalledWith('mySecretPassword');
      });

      it('should normalize email to lowercase', async () => {
        const newUser = createTestUser({ id: 2 });
        const bindMock = vi.fn(() => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ meta: { last_row_id: 2 } }),
        }));

        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT id FROM users WHERE email')) {
            return { bind: bindMock };
          }
          if (sql.includes('INSERT INTO users')) {
            return { bind: bindMock };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(newUser),
            })),
          };
        });

        const request = createRequest({
          email: 'NEW@EXAMPLE.COM',
          password: 'password123',
          name: 'New User',
        });

        await POST(request);

        expect(bindMock).toHaveBeenCalledWith('new@example.com');
      });
    });

    describe('Duplicate Email', () => {
      it('should return 409 when email already exists', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
        });

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            first: vi.fn().mockResolvedValue({ id: 1 }),
          })),
        });

        const request = createRequest({
          email: 'existing@example.com',
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('Email already registered');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockRequireAdmin.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
        });

        mockDB.prepare.mockImplementation(() => {
          throw new Error('Database error');
        });

        const request = createRequest({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create user');
      });
    });
  });
});
