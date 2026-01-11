# Peabod Web Testing Plan

## Overview

This document outlines the comprehensive testing strategy for the Peabod Web application, a Next.js 15 CMS with Cloudflare D1/R2 integration.

## Technology Stack for Testing

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit & integration test runner (fast, ESM-native, Vite-compatible) |
| **@testing-library/react** | React component testing |
| **@testing-library/user-event** | User interaction simulation |
| **happy-dom** | Lightweight DOM implementation for tests |
| **msw** | API mocking for integration tests |
| **Playwright** | End-to-end testing |

## Test Categories

### 1. Unit Tests

#### 1.1 Library Utilities (`src/lib/`)

| File | Functions to Test | Priority |
|------|-------------------|----------|
| `password.ts` | `hashPassword`, `verifyPassword` | **Critical** |
| `session.ts` | `createSession`, `validateSession`, `deleteSession`, `cleanupExpiredSessions` | **Critical** |
| `auth.ts` | `getSessionUser`, `isZeroTrustAuthenticated`, `isAuthenticated` | **Critical** |
| `api-auth.ts` | `requireAdmin`, `requireEditor`, `requireAuthor`, `requireOwnerOrEditor` | **Critical** |
| `exif.ts` | `extractExifData` | Medium |
| `themes.ts` | Theme configuration functions | Low |

#### 1.2 Test Cases for Password Module

```typescript
// password.test.ts
describe('Password Module', () => {
  describe('hashPassword', () => {
    - Should return a hash string with salt
    - Should generate different hashes for same password (due to random salt)
    - Should handle empty passwords gracefully
    - Should handle special characters
  });

  describe('verifyPassword', () => {
    - Should return true for correct password
    - Should return false for incorrect password
    - Should be timing-safe (constant time comparison)
    - Should handle malformed hash strings
  });
});
```

#### 1.3 Test Cases for Session Module

```typescript
// session.test.ts
describe('Session Module', () => {
  describe('createSession', () => {
    - Should create a session with valid token
    - Should store user agent and IP
    - Should set expiration time
  });

  describe('validateSession', () => {
    - Should return user for valid session
    - Should return null for expired session
    - Should return null for non-existent session
  });

  describe('deleteSession', () => {
    - Should remove session from database
    - Should handle non-existent sessions gracefully
  });

  describe('cleanupExpiredSessions', () => {
    - Should remove all expired sessions
    - Should preserve valid sessions
  });
});
```

#### 1.4 Test Cases for Auth Module

```typescript
// auth.test.ts
describe('Auth Module', () => {
  describe('isZeroTrustAuthenticated', () => {
    - Should return true when CF-Access-Jwt-Assertion header present
    - Should return false when header missing
  });

  describe('getSessionUser', () => {
    - Should extract user from valid session cookie
    - Should return null for invalid cookie
    - Should return null for expired session
  });

  describe('isAuthenticated', () => {
    - Should return true for Zero Trust authenticated users
    - Should return true for session authenticated users
    - Should return false for unauthenticated users
  });
});
```

#### 1.5 Test Cases for API Authorization

```typescript
// api-auth.test.ts
describe('API Authorization', () => {
  describe('requireAdmin', () => {
    - Should allow admin users
    - Should reject editor users
    - Should reject author users
    - Should reject unauthenticated users
  });

  describe('requireEditor', () => {
    - Should allow admin users
    - Should allow editor users
    - Should reject author users
  });

  describe('requireAuthor', () => {
    - Should allow admin, editor, and author users
    - Should reject unauthenticated users
  });

  describe('requireOwnerOrEditor', () => {
    - Should allow resource owner
    - Should allow editor role
    - Should reject non-owner authors
  });
});
```

### 2. API Route Tests

#### 2.1 Authentication Routes (`src/app/api/auth/`)

| Route | Method | Test Cases |
|-------|--------|------------|
| `/api/auth/login` | POST | Valid credentials, invalid password, non-existent user, inactive user |
| `/api/auth/register` | POST | New user creation, duplicate email, invalid input validation |
| `/api/auth/logout` | POST | Session deletion, no session handling |
| `/api/auth/me` | GET | Authenticated user info, unauthenticated response |

#### 2.2 Admin API Routes (`src/app/admin/api/`)

| Route | Method | Test Cases |
|-------|--------|------------|
| `/admin/api/articles` | GET | List with pagination, filtering by status |
| `/admin/api/articles` | POST | Create article, validation errors |
| `/admin/api/articles/[id]` | GET | Fetch single article |
| `/admin/api/articles/[id]` | PUT | Update article, authorization check |
| `/admin/api/articles/[id]` | DELETE | Delete article, authorization check |
| `/admin/api/tags` | GET/POST | Tag CRUD operations |
| `/admin/api/pages` | GET/POST | Page CRUD operations |
| `/admin/api/media` | GET/POST | Media listing, upload |
| `/admin/api/users` | GET/POST | User management |
| `/admin/api/users/[id]/approve` | POST | User approval workflow |

### 3. Component Tests

#### 3.1 Public Components

| Component | Test Cases |
|-----------|------------|
| `ArticleCard` | Renders title, excerpt, author, date; handles missing image |
| `AuthMenu` | Shows login when unauthenticated; shows user menu when authenticated |
| `Header` | Navigation links render; mobile menu toggle works |
| `Footer` | Renders copyright and links |
| `ThemeSwitcher` | Theme selection works; persists selection |

#### 3.2 Admin Components

| Component | Test Cases |
|-----------|------------|
| `AuthGuard` | Redirects unauthenticated users; renders children for authenticated |
| `DataTable` | Renders rows; handles empty state; sorting works |
| `Sidebar` | Navigation links; active state highlighting |
| `MediaCard` | Displays image; shows metadata; handles delete |
| `MediaMetadataEditor` | Form submission; validation |

### 4. Integration Tests

#### 4.1 Authentication Flow

```
1. Register new user → Verify pending status
2. Admin approves user → Verify active status
3. User logs in → Verify session created
4. User accesses protected route → Verify access granted
5. User logs out → Verify session destroyed
```

#### 4.2 Article Publishing Flow

```
1. Author creates draft article → Verify saved as draft
2. Author adds media → Verify media association
3. Editor reviews and publishes → Verify status change
4. Public access → Verify article visible
```

#### 4.3 Media Management Flow

```
1. Upload image → Verify R2 storage
2. EXIF extraction → Verify metadata saved
3. Media association with article → Verify relationship
4. Media deletion → Verify R2 cleanup
```

### 5. End-to-End Tests (Playwright)

#### 5.1 Critical User Journeys

| Journey | Steps |
|---------|-------|
| **User Registration** | Navigate to register → Fill form → Submit → Verify pending message |
| **User Login** | Navigate to login → Enter credentials → Submit → Verify redirect |
| **Article Reading** | Home page → Click article → Verify content loads |
| **Admin Login** | Navigate to /admin → Enter credentials → Verify dashboard |
| **Article Creation** | Admin → Articles → New → Fill form → Publish → Verify live |
| **Media Upload** | Admin → Media → Upload → Verify in library |

### 6. Test Configuration

#### 6.1 Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/components/**', 'src/app/api/**'],
    },
  },
});
```

#### 6.2 Test Directory Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── mocks/
│   │   ├── db.ts             # D1 database mock
│   │   ├── r2.ts             # R2 storage mock
│   │   └── handlers.ts       # MSW API handlers
│   └── utils/
│       ├── test-utils.tsx    # Custom render with providers
│       └── factories.ts      # Test data factories
├── lib/
│   ├── __tests__/
│   │   ├── password.test.ts
│   │   ├── session.test.ts
│   │   ├── auth.test.ts
│   │   └── api-auth.test.ts
├── components/
│   ├── __tests__/
│   │   ├── ArticleCard.test.tsx
│   │   ├── AuthMenu.test.tsx
│   │   └── ...
└── app/
    └── api/
        └── auth/
            └── __tests__/
                ├── login.test.ts
                └── register.test.ts
```

### 7. Mocking Strategy

#### 7.1 Cloudflare D1 Mock

```typescript
// Mock the getCloudflareContext for D1 access
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(() => ({
    env: {
      DB: createMockD1(),
      R2_BUCKET: createMockR2(),
    },
  })),
}));
```

#### 7.2 Next.js Request/Response Mocks

```typescript
// Mock NextRequest and NextResponse
const createMockRequest = (options: RequestInit) => {
  return new NextRequest('http://localhost:3000', options);
};
```

### 8. Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| Library utilities (`src/lib/`) | 90% |
| API routes (`src/app/api/`) | 80% |
| Components (`src/components/`) | 70% |
| Overall | 75% |

### 9. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
```

### 10. Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/lib/__tests__/password.test.ts

# Run E2E tests
npm run test:e2e
```

## Implementation Priority

### Phase 1: Foundation (Week 1)
- [x] Set up Vitest and testing dependencies
- [x] Configure test environment
- [x] Create mocking utilities
- [x] Write tests for `password.ts`
- [x] Write tests for `session.ts`

### Phase 2: Core Auth (Week 2)
- [ ] Write tests for `auth.ts`
- [ ] Write tests for `api-auth.ts`
- [ ] Write tests for authentication API routes

### Phase 3: Components (Week 3)
- [ ] Write tests for public components
- [ ] Write tests for admin components

### Phase 4: API Routes (Week 4)
- [ ] Write tests for article API routes
- [ ] Write tests for media API routes
- [ ] Write tests for user management routes

### Phase 5: E2E & Integration (Week 5+)
- [ ] Set up Playwright
- [ ] Write critical user journey tests
- [ ] Set up CI/CD pipeline

---

*Document created: January 2025*
*Last updated: January 2025*
