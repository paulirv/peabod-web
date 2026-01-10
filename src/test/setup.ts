import { vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

// Mock @opennextjs/cloudflare
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(() => ({
    env: {
      DB: createMockD1(),
      MEDIA: createMockR2(),
    },
  })),
}));

// Create mock D1 database
export function createMockD1(): D1Database {
  const mockResults: Map<string, unknown[]> = new Map();

  const prepare = vi.fn((sql: string) => ({
    bind: vi.fn((...params: unknown[]) => ({
      first: vi.fn(async () => {
        const results = mockResults.get(sql);
        return results?.[0] ?? null;
      }),
      all: vi.fn(async () => ({
        results: mockResults.get(sql) ?? [],
      })),
      run: vi.fn(async () => ({
        success: true,
        meta: { changes: 1, last_row_id: 1, duration: 0 },
      })),
    })),
    first: vi.fn(async () => null),
    all: vi.fn(async () => ({ results: [] })),
    run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
  }));

  return {
    prepare,
    exec: vi.fn(async () => ({ results: [] })),
    batch: vi.fn(async () => []),
    dump: vi.fn(async () => new ArrayBuffer(0)),
    _setMockResults: (sql: string, results: unknown[]) => mockResults.set(sql, results),
    _clearMockResults: () => mockResults.clear(),
  } as unknown as D1Database;
}

// Create mock R2 bucket
export function createMockR2(): R2Bucket {
  const objects: Map<string, { body: ArrayBuffer; httpMetadata?: object }> = new Map();

  return {
    put: vi.fn(async (key: string, value: ArrayBuffer | ReadableStream, options?: object) => {
      objects.set(key, { body: value as ArrayBuffer, httpMetadata: options });
      return {
        key,
        size: (value as ArrayBuffer).byteLength ?? 0,
        etag: 'mock-etag',
        httpEtag: '"mock-etag"',
        uploaded: new Date(),
        httpMetadata: {},
        customMetadata: {},
      };
    }),
    get: vi.fn(async (key: string) => {
      const obj = objects.get(key);
      if (!obj) return null;
      return {
        key,
        body: new ReadableStream(),
        bodyUsed: false,
        arrayBuffer: async () => obj.body,
        text: async () => '',
        json: async () => ({}),
        blob: async () => new Blob(),
      };
    }),
    delete: vi.fn(async () => {}),
    list: vi.fn(async () => ({ objects: [], truncated: false })),
    head: vi.fn(async () => null),
    _setObject: (key: string, data: ArrayBuffer) => objects.set(key, { body: data }),
    _clearObjects: () => objects.clear(),
  } as unknown as R2Bucket;
}

// Global test utilities
beforeAll(() => {
  // Setup global crypto for Node.js test environment
  if (typeof globalThis.crypto === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webcrypto } = require('crypto');
    globalThis.crypto = webcrypto;
  }
});

afterEach(() => {
  vi.clearAllMocks();
});
