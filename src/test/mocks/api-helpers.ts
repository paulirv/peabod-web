import { vi } from 'vitest';

/**
 * Create a mock NextRequest
 */
export function createMockRequest(
  url: string = 'http://localhost:3000',
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
    (requestInit.headers as Headers).set('content-type', 'application/json');
  }

  return new Request(url, requestInit);
}

/**
 * Create mock D1 database with configurable responses
 */
export function createMockDB() {
  const mockResults: Map<string, unknown> = new Map();
  const runResults: Map<string, { success: boolean; meta: { changes: number; last_row_id: number } }> = new Map();

  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((..._params: unknown[]) => ({
        first: vi.fn(async <T>() => {
          // Check for specific mock results
          for (const [pattern, result] of mockResults) {
            if (sql.includes(pattern)) {
              return result as T;
            }
          }
          return null;
        }),
        all: vi.fn(async () => {
          for (const [pattern, result] of mockResults) {
            if (sql.includes(pattern)) {
              return { results: result as unknown[] };
            }
          }
          return { results: [] };
        }),
        run: vi.fn(async () => {
          for (const [pattern, result] of runResults) {
            if (sql.includes(pattern)) {
              return result;
            }
          }
          return { success: true, meta: { changes: 1, last_row_id: 1 } };
        }),
      })),
      first: vi.fn(async () => null),
      all: vi.fn(async () => ({ results: [] })),
      run: vi.fn(async () => ({ success: true, meta: { changes: 1, last_row_id: 1 } })),
    })),
    _setFirstResult: (pattern: string, result: unknown) => {
      mockResults.set(pattern, result);
    },
    _setAllResults: (pattern: string, results: unknown[]) => {
      mockResults.set(pattern, results);
    },
    _setRunResult: (pattern: string, result: { success: boolean; meta: { changes: number; last_row_id: number } }) => {
      runResults.set(pattern, result);
    },
    _clearResults: () => {
      mockResults.clear();
      runResults.clear();
    },
  };

  return db;
}

/**
 * Create a mock user for database queries
 */
export function createMockDBUser(overrides: Partial<{
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  is_active: number;
  is_approved: number;
  bio: string | null;
  avatar_media_id: number | null;
}> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password_hash: '100000:0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    role: 'author',
    is_active: 1,
    is_approved: 1,
    bio: null,
    avatar_media_id: null,
    ...overrides,
  };
}

/**
 * Parse JSON response from NextResponse
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
