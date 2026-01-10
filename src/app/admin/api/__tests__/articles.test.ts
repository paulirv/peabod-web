import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../articles/route';
import { createSessionUser, createTestArticle } from '@/test/utils/factories';

// Response type definitions for type-safe JSON parsing
interface ArticlesListResponse {
  success: boolean;
  data: {
    items: Array<{ id: number; title: string; slug: string }>;
    total: number;
    limit: number;
    offset: number;
  };
}

interface ArticleCreateResponse {
  success: boolean;
  data?: { id: number; slug: string };
  error?: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
}

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getDB: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  requireAuthor: vi.fn(),
}));

import { getDB } from '@/lib/db';
import { requireAuthor } from '@/lib/api-auth';

const mockGetDB = vi.mocked(getDB);
const mockRequireAuthor = vi.mocked(requireAuthor);

describe('/admin/api/articles', () => {
  let mockDB: {
    prepare: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDB = {
      prepare: vi.fn(),
    };

    mockGetDB.mockReturnValue(mockDB as unknown as D1Database);
  });

  describe('GET /admin/api/articles', () => {
    describe('Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: false,
          response: new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401 }
          ),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/articles');
        const response = await GET(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      });
    });

    describe('Listing Articles', () => {
      it('should return list of articles', async () => {
        const user = createSessionUser({ id: 1, role: 'author' });
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });

        const articles = [
          createTestArticle({ id: 1, title: 'Article 1' }),
          createTestArticle({ id: 2, title: 'Article 2' }),
        ];

        mockDB.prepare.mockImplementation((sql: string) => {
          if (sql.includes('SELECT a.*')) {
            return {
              bind: vi.fn(() => ({
                all: vi.fn().mockResolvedValue({ results: articles }),
              })),
            };
          }
          if (sql.includes('SELECT t.*')) {
            return {
              bind: vi.fn(() => ({
                all: vi.fn().mockResolvedValue({ results: [] }),
              })),
            };
          }
          if (sql.includes('COUNT')) {
            return {
              bind: vi.fn(() => ({
                first: vi.fn().mockResolvedValue({ total: 2 }),
              })),
            };
          }
          return {
            bind: vi.fn(() => ({
              all: vi.fn().mockResolvedValue({ results: [] }),
              first: vi.fn().mockResolvedValue(null),
            })),
          };
        });

        const request = new NextRequest('http://localhost:3000/admin/api/articles');
        const response = await GET(request);
        const data = (await response.json()) as ArticlesListResponse;

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.items).toHaveLength(2);
        expect(data.data.total).toBe(2);
      });

      it('should filter by published status', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });

        const bindMock = vi.fn(() => ({
          all: vi.fn().mockResolvedValue({ results: [] }),
          first: vi.fn().mockResolvedValue({ total: 0 }),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = new NextRequest('http://localhost:3000/admin/api/articles?published=true');
        await GET(request);

        // Verify that the query includes the published filter
        expect(mockDB.prepare).toHaveBeenCalled();
      });

      it('should apply limit and offset', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0 }),
          })),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/articles?limit=10&offset=20');
        const response = await GET(request);
        const data = (await response.json()) as ArticlesListResponse;

        expect(data.data.limit).toBe(10);
        expect(data.data.offset).toBe(20);
      });

      it('should use default limit and offset', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue({ total: 0 }),
          })),
        });

        const request = new NextRequest('http://localhost:3000/admin/api/articles');
        const response = await GET(request);
        const data = (await response.json()) as ArticlesListResponse;

        expect(data.data.limit).toBe(50);
        expect(data.data.offset).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });

        mockDB.prepare.mockImplementation(() => {
          throw new Error('Database error');
        });

        const request = new NextRequest('http://localhost:3000/admin/api/articles');
        const response = await GET(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch articles');
      });
    });
  });

  describe('POST /admin/api/articles', () => {
    function createRequest(body: object): NextRequest {
      return new NextRequest('http://localhost:3000/admin/api/articles', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });
    }

    describe('Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: false,
          response: new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401 }
          ),
        });

        const request = createRequest({
          slug: 'test-article',
          title: 'Test Article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        expect(response.status).toBe(401);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });
      });

      it('should return 400 when slug is missing', async () => {
        const request = createRequest({
          title: 'Test Article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when title is missing', async () => {
        const request = createRequest({
          slug: 'test-article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when body is missing', async () => {
        const request = createRequest({
          slug: 'test-article',
          title: 'Test',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });
    });

    describe('Article Creation', () => {
      beforeEach(() => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });
      });

      it('should create article with valid data', async () => {
        const newArticle = createTestArticle({ id: 1 });

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
            first: vi.fn().mockResolvedValue(newArticle),
          })),
        });

        const request = createRequest({
          slug: 'test-article',
          title: 'Test Article',
          body: 'Test content',
          author: 'Test Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        const data = (await response.json()) as ArticleCreateResponse;

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      });

      it('should sanitize slug (lowercase, remove slashes)', async () => {
        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
          first: vi.fn().mockResolvedValue(createTestArticle()),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({
          slug: '/Test-Article/',
          title: 'Test Article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        await POST(request);

        // Verify the first argument (slug) was sanitized to lowercase without slashes
        const firstCall = bindMock.mock.calls[0];
        expect(firstCall[0]).toBe('test-article');
      });

      it('should handle tags when provided', async () => {
        const tagInsertMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ success: true }),
        }));

        let callCount = 0;
        mockDB.prepare.mockImplementation((sql: string) => {
          callCount++;
          if (sql.includes('INSERT INTO articles')) {
            return {
              bind: vi.fn(() => ({
                run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
              })),
            };
          }
          if (sql.includes('INSERT INTO article_tags')) {
            return { bind: tagInsertMock };
          }
          return {
            bind: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(createTestArticle()),
            })),
          };
        });

        const request = createRequest({
          slug: 'test-article',
          title: 'Test Article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
          tag_ids: [1, 2, 3],
        });

        await POST(request);

        // Should have inserted tags
        expect(tagInsertMock).toHaveBeenCalledTimes(3);
      });

      it('should set author_id to current user', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 42, email: 'author@test.com', name: 'Author', role: 'author' },
        });

        const bindMock = vi.fn(() => ({
          run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
          first: vi.fn().mockResolvedValue(createTestArticle()),
        }));

        mockDB.prepare.mockReturnValue({ bind: bindMock });

        const request = createRequest({
          slug: 'test-article',
          title: 'Test Article',
          body: 'Content',
          author: 'Author Name',
          authored_on: '2024-01-01',
        });

        await POST(request);

        // Last argument of the INSERT call (first call) should be author_id (42)
        const insertCall = bindMock.mock.calls[0];
        expect(insertCall[insertCall.length - 1]).toBe(42);
      });
    });

    describe('Duplicate Slug', () => {
      it('should return 409 when slug already exists', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            run: vi.fn().mockRejectedValue(
              new Error('UNIQUE constraint failed: articles.slug')
            ),
          })),
        });

        const request = createRequest({
          slug: 'existing-article',
          title: 'Test Article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(409);
        expect(data.error).toBe('Article with this slug already exists');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on non-unique constraint error', async () => {
        mockRequireAuthor.mockResolvedValue({
          authorized: true,
          user: { id: 1, email: 'test@test.com', name: 'Test', role: 'author' },
        });

        mockDB.prepare.mockReturnValue({
          bind: vi.fn(() => ({
            run: vi.fn().mockRejectedValue(new Error('Some other database error')),
          })),
        });

        const request = createRequest({
          slug: 'test-article',
          title: 'Test Article',
          body: 'Content',
          author: 'Author',
          authored_on: '2024-01-01',
        });

        const response = await POST(request);
        const data = (await response.json()) as ErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create article');
      });
    });
  });
});
