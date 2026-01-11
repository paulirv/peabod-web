# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Peabod Web** is a content management system (CMS) built with Next.js 15 App Router, deployed to Cloudflare Workers via OpenNext. The application manages articles, pages, media assets (images and videos), and users with role-based access control.

### Key Features
- **Content Management** - Articles, pages, and tags with rich metadata
- **Media Library** - Image uploads to R2, video streaming via Cloudflare Stream, EXIF extraction
- **User Management** - Role-based access (admin, editor, author) with approval workflow
- **Theming** - Multiple themes with CSS variables and ThemeSwitcher
- **Site Settings** - Configurable site metadata, branding, and social links

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Deployment | Cloudflare Workers via OpenNext |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (media), Cloudflare Stream (video) |
| Styling | Tailwind CSS 4 with CSS variables |
| Testing | Vitest (unit), Playwright (E2E) |
| Language | TypeScript (strict mode) |

---

## Build and Deploy Commands

### Development

```bash
npm run dev          # Start dev server (localhost:3000)
```

### Deployment to Cloudflare Workers

```bash
npx @opennextjs/cloudflare build   # Build for Cloudflare (NOT npm run build)
npx wrangler deploy                 # Deploy to production
```

> **Important:** Do NOT use `npm run build` for deployment. It only creates `.next` but Wrangler deploys from `.open-next`. Always use the OpenNext build command. See `docs/LESSONS-LEARNED.md` for details.

### Testing

```bash
# Unit Tests (Vitest)
npm test                    # Run all unit tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report
npm run test:ui             # Vitest UI interface
npx vitest run src/lib/__tests__/session.test.ts  # Run single test file

# E2E Tests (Playwright)
npm run test:e2e            # Run E2E tests headless
npm run test:e2e:headed     # Run with visible browser
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:report     # View test report
```

See `docs/TESTING-PLAN.md` for comprehensive testing strategy.

### Linting

```bash
npm run lint         # Run ESLint
```

### Database

```bash
# Apply schema to D1
wrangler d1 execute peabod-db --file=./schema.sql

# Apply a migration
wrangler d1 execute peabod-db --file=./migrations/007_add_site_icon.sql
```

---

## Architecture Overview

### Cloudflare Bindings (wrangler.toml)
- `DB` - D1 SQLite database
- `MEDIA` - R2 bucket for images/media
- Access bindings via `getCloudflareContext()` from `@opennextjs/cloudflare`

### Route Groups
- `src/app/(public)/` - Public pages (blog, articles, user profiles)
- `src/app/admin/` - Admin dashboard (requires auth)
- `src/app/api/` - Public API routes (auth, media serving)
- `src/app/admin/api/` - Admin API routes (CRUD operations)

### Key Libraries
| File | Purpose |
|------|---------|
| `src/lib/db.ts` | D1 database helper |
| `src/lib/session.ts` | Cookie-based session management |
| `src/lib/auth.ts` | Auth helpers (session + Zero Trust) |
| `src/lib/api-auth.ts` | API route auth middleware |
| `src/lib/password.ts` | PBKDF2 password hashing (Web Crypto API) |
| `src/lib/themes.ts` | Theme definitions |
| `src/lib/image.ts` | Cloudflare Image Transformations |
| `src/lib/stream.ts` | Cloudflare Stream video API |
| `src/lib/settings.ts` | Site settings helpers |
| `src/lib/exif.ts` | EXIF metadata extraction |

### Authentication
Two mechanisms:
1. **Session-based** - Cookie auth for public users and admin login
2. **Zero Trust** - Cloudflare Access JWT (optional, for enterprise SSO)

User roles: `admin`, `editor`, `author`
User statuses: `pending`, `approved`, `inactive`

### Styling
- Tailwind CSS 4
- CSS variables for theming (set by ThemeProvider)
- Theme colors: `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, etc.

### State Patterns
Components use React state with common patterns documented in `docs/STATE-MACHINES.md`:
- Loading/error states for async operations
- Modal visibility flags
- Form state objects
- Filter/pagination state

---

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - All code must pass strict type checking
- Use `@/*` path alias for imports from `src/`
- Prefer interfaces over types for object shapes
- Use explicit return types on exported functions
- Prefix unused parameters with underscore (`_param`)

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `ArticleCard.tsx` |
| Files (utilities) | kebab-case | `api-auth.ts` |
| Functions | camelCase | `getSessionUser()` |
| Components | PascalCase | `MediaCard` |
| Constants | SCREAMING_SNAKE_CASE | `ITERATIONS` |
| Types/Interfaces | PascalCase | `SessionUser` |
| Database columns | snake_case | `created_at` |

### React Patterns
- Use functional components with hooks
- Prefer server components; use `'use client'` only when necessary
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks or lib functions

### ESLint Configuration
- Extends `next/core-web-vitals` and `next/typescript`
- Unused variables with `_` prefix are allowed (warn level)
- Build artifacts and test output directories are ignored

### Import Order
1. React/Next.js imports
2. External dependencies
3. Internal absolute imports (`@/`)
4. Relative imports
5. Type imports (at end, using `import type`)

---

## Testing Instructions

### Test Structure
```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── mocks/                 # Mock implementations
│   └── utils/                 # Test utilities
├── lib/
│   └── __tests__/            # Unit tests for lib functions
├── components/
│   └── __tests__/            # Component tests
└── app/api/
    └── __tests__/            # API route tests
```

### Writing Tests

**Unit tests** go in `__tests__` directories adjacent to source files:
```typescript
// src/lib/__tests__/password.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('Password Module', () => {
  it('should hash and verify password correctly', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });
});
```

**Component tests** use Testing Library:
```typescript
// src/components/__tests__/ArticleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ArticleCard } from '../ArticleCard';

it('renders article title', () => {
  render(<ArticleCard title="Test Article" {...props} />);
  expect(screen.getByText('Test Article')).toBeInTheDocument();
});
```

### Mocking Cloudflare Services
```typescript
// Mock getCloudflareContext for D1/R2 access
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(() => ({
    env: {
      DB: createMockD1(),
      MEDIA: createMockR2(),
    },
  })),
}));
```

### Coverage Goals
| Category | Target |
|----------|--------|
| Library utilities (`src/lib/`) | 90% |
| API routes (`src/app/api/`) | 80% |
| Components (`src/components/`) | 70% |
| Overall | 75% |

---

## Security Considerations

### Password Security
- PBKDF2 with SHA-256 (Web Crypto API compatible with Workers)
- 100,000 iterations (OWASP recommended minimum)
- 128-bit random salt per password
- 256-bit derived key
- Timing-safe comparison to prevent timing attacks

### Session Security
- Cryptographically random session tokens
- Server-side session storage in D1
- Session expiration and cleanup
- IP address and user agent tracking

### Authorization
Always use the API auth middleware functions in admin routes:
```typescript
import { requireAdmin, requireEditor, requireAuthor, requireOwnerOrEditor } from '@/lib/api-auth';

// In route handler:
const auth = await requireAdmin();
if (!auth.authorized) return auth.response;
```

| Function | Access Level |
|----------|--------------|
| `requireAdmin()` | Admin only |
| `requireEditor()` | Admin or Editor |
| `requireAuthor()` | Admin, Editor, or Author |
| `requireOwnerOrEditor()` | Resource owner OR Admin/Editor |

### Input Validation
- Validate all user input at API boundaries
- Use parameterized queries (D1 prepared statements) to prevent SQL injection
- Sanitize file paths and filenames for media uploads
- Validate MIME types and file sizes on upload

### Security Headers
Cloudflare Workers handles many security headers automatically. Additional headers can be configured in middleware or per-route.

### Secrets Management
- Secrets stored in Cloudflare Workers secrets (not environment variables)
- Add secrets via: `wrangler secret put SECRET_NAME`
- Current secrets: `CF_API_TOKEN` (for Stream API access)

---

## Git Workflow

Follow the workflow documented in `docs/GIT-WORKFLOW.md`.

### Key Points
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`
- Branch naming: `feature/*`, `fix/*`, `refactor/*`, `docs/*`
- Do NOT include AI-generated boilerplate text, e.g. `Co-Authored-By`, lines in commit messages
- Keep subject lines under 72 characters, use imperative mood

### Commit Message Examples
```
feat(auth): add password reset functionality
fix(articles): correct date formatting on mobile
docs: update API documentation
refactor(media): simplify upload logic
test(auth): add login validation tests
```

---

## Project Workflow

When starting work on a new feature, fix, or refactor:

1. **Checkout a new branch** following the naming convention (`feature/*`, `fix/*`, `refactor/*`)
2. **Create `progress.txt`** in the project root to track progress on that branch
3. **Create `findings.txt`** in the project root to document lessons learned during development
4. **Consult experts** - Use the Drupal expert and code expert agents for guidance and best practices
5. **Create tests** - Write tests for new features to ensure functionality and prevent regressions

After the branch has been merged into main:
- Add any valuable findings from `findings.txt` to `docs/LESSONS-LEARNED.md`
- The branch-specific `progress.txt` and `findings.txt` can be deleted

**Note:** Documentation branches (`docs/*`) do not require `progress.txt` or `findings.txt` files.

---

## Claude Code Agents, Skills, and Tools

### Recommended Agents

Agents are specialized assistants that combine expertise with relevant skills.

#### Development & Code Quality
| Agent | When to Use | Invokes Skills |
|-------|-------------|----------------|
| `code-reviewer` | After implementing features or fixing bugs | `/code-simplifying`, `/accessibility-auditing`, `/performance-auditing`, `/seo-auditing` |
| `code-debugger` | When encountering runtime errors, failed tests, or unexpected behavior | `/performance-auditing`, `/webapp-testing`, `/explaining-code` |
| `unit-test-generator` | After writing new functions or modules to generate comprehensive tests | `/webapp-testing`, `/accessibility-auditing`, `/api-designing` |
| `lead-dev-architect` | For architectural decisions and implementation planning | `/api-designing`, `/information-architecting`, `/ux-designing`, `/code-simplifying`, `/performance-auditing` |

#### Infrastructure & Platform
| Agent | When to Use | Invokes Skills |
|-------|-------------|----------------|
| `cloudflare-expert` | For D1, R2, Workers, Stream configuration and troubleshooting | `/performance-auditing`, `/api-designing`, `/seo-auditing` |
| `sentry-integration-expert` | For error tracking setup and monitoring configuration | `/performance-auditing`, `/api-designing` |

#### Design & User Experience
| Agent | When to Use | Invokes Skills |
|-------|-------------|----------------|
| `ux-architect` | When designing interfaces, user flows, and page layouts | `/ux-designing`, `/information-architecting`, `/accessibility-auditing`, `/frontend-design` |
| `accessibility-auditor` | When auditing for WCAG compliance and a11y issues | `/accessibility-auditing`, `/ux-designing`, `/frontend-design` |

#### SEO & Performance
| Agent | When to Use | Invokes Skills |
|-------|-------------|----------------|
| `seo-performance-auditor` | When optimizing for search rankings and page speed | `/seo-auditing`, `/performance-auditing`, `/accessibility-auditing` |

#### Exploration
| Agent | When to Use | Invokes Skills |
|-------|-------------|----------------|
| `Explore` | For codebase navigation and understanding existing patterns | `/explaining-code` |

### Built-in Skills

#### Git & Version Control
| Skill | When to Use |
|-------|-------------|
| `/commit` | Create git commits with proper conventional commit format |
| `/commit-push-pr` | Commit changes, push to remote, and open a pull request |
| `/code-review` | Review a pull request for bugs, security, and code quality |

#### Development & Testing
| Skill | When to Use |
|-------|-------------|
| `/webapp-testing` | Test the running application interactively with Playwright browser |
| `/explaining-code` | Understand how existing code works with visual diagrams and analogies |
| `/frontend-design` | Create polished, production-grade frontend interfaces and components |
| `/feature-dev` | Guided feature development with codebase understanding and architecture focus |

#### Documentation & Files
| Skill | When to Use |
|-------|-------------|
| `/pdf` | Extract text/tables from PDFs, create new PDFs, merge/split documents |
| `/xlsx` | Create, edit, and analyze spreadsheets with formulas and formatting |
| `/docx` | Create and edit Word documents with tracked changes and comments |
| `/pptx` | Create and edit PowerPoint presentations |

#### Error Tracking (Sentry)
| Skill | When to Use |
|-------|-------------|
| `/seer` | Ask natural language questions about your Sentry environment |
| `/getIssues` | Fetch recent issues from Sentry, optionally filtered by project |
| `/sentry-code-review` | Analyze and resolve Sentry comments on GitHub PRs |
| `/sentry-setup-tracing` | Setup Sentry performance monitoring and tracing |
| `/sentry-setup-logging` | Setup Sentry structured logging integration |

#### Integrations
| Skill | When to Use |
|-------|-------------|
| `/mcp-builder` | Create MCP servers to integrate external APIs or services |
| `/skill-creator` | Create new custom skills to extend Claude's capabilities |

#### Code Quality & Architecture
| Skill | When to Use |
|-------|-------------|
| `/code-simplifying` | Simplify complex code, reduce duplication, improve readability |
| `/information-architecting` | Design content structure, navigation, taxonomies, and information hierarchy |
| `/ux-designing` | Design user interfaces, flows, and interactions for admin and public pages |
| `/api-designing` | Design consistent RESTful API endpoints, request/response formats |

#### Auditing & Optimization
| Skill | When to Use |
|-------|-------------|
| `/accessibility-auditing` | Audit components for WCAG compliance and accessibility issues |
| `/seo-auditing` | Audit pages for SEO best practices, meta tags, structured data |
| `/performance-auditing` | Audit for performance issues, optimize for Cloudflare Workers edge |

### Useful Tools

#### File Operations
| Tool | Purpose |
|------|---------|
| `Glob` | Find files by pattern (e.g., `src/**/*.test.ts`) |
| `Grep` | Search code content with regex (e.g., `requireAdmin`, `async function`) |
| `Read` | Read file contents, images, PDFs, and Jupyter notebooks |
| `Edit` | Make targeted string replacements in existing files |
| `Write` | Create new files or completely rewrite existing files |

#### Command Execution
| Tool | Purpose |
|------|---------|
| `Bash` | Run shell commands (build, deploy, tests, git, npm, wrangler) |
| `Task` | Launch specialized agents for complex multi-step tasks |
| `TodoWrite` | Track task progress with a visible todo list |

#### Web & Documentation
| Tool | Purpose |
|------|---------|
| `WebFetch` | Fetch and analyze content from URLs |
| `WebSearch` | Search the web for current documentation and solutions |
| `Context7` | Query up-to-date documentation for libraries (Next.js, React, Cloudflare) |

#### Browser Testing (Playwright MCP)
| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to URLs for testing |
| `browser_snapshot` | Capture accessibility snapshot of current page |
| `browser_click` | Click elements on the page |
| `browser_type` | Type text into form fields |
| `browser_take_screenshot` | Capture visual screenshots |
| `browser_console_messages` | View browser console logs for debugging |

#### Project-Specific Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server on localhost:3000 |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Run ESLint |
| `npx @opennextjs/cloudflare build` | Build for Cloudflare deployment |
| `npx wrangler deploy` | Deploy to Cloudflare Workers |
| `wrangler d1 execute peabod-db --file=./schema.sql` | Apply database schema |

### Available Integrations

These integrations are configured and ready to use:

| Integration | Status | Agent/Skill |
|-------------|--------|-------------|
| **Playwright Browser Testing** | Ready | `/webapp-testing`, `browser_*` tools |
| **Context7 Documentation** | Ready | Query Next.js, React, Cloudflare docs |
| **Sentry Error Tracking** | Available | `sentry-integration-expert` agent, `/seer`, `/getIssues` |

### Recommended Future Integrations

| Integration | Purpose | How to Add |
|-------------|---------|------------|
| **GitHub Actions CI/CD** | Automated testing and deployment on PR/merge | Create `.github/workflows/` |
| **Cloudflare Analytics** | Traffic and performance insights | Enable in Cloudflare dashboard |
| **Uptime Monitoring** | Alert on site downtime | Cloudflare Health Checks or external service |

---

## Skills & Agents Location

Custom skills and agents are stored at the user level for cross-project availability:

```
~/.claude/
├── skills/                    # Custom skills
│   ├── accessibility-auditing/
│   ├── api-designing/
│   ├── code-simplifying/
│   ├── information-architecting/
│   ├── performance-auditing/
│   ├── seo-auditing/
│   └── ux-designing/
└── agents/                    # Custom agents
    ├── accessibility-auditor.md
    ├── cloudflare-expert.md
    ├── code-debugger.md
    ├── code-reviewer.md
    ├── lead-dev-architect.md
    ├── sentry-integration-expert.md
    ├── seo-performance-auditor.md
    ├── unit-test-generator.md
    └── ux-architect.md
```

---

## Database

Schema in `schema.sql`. Migrations in `migrations/`.

### Tables
| Table | Purpose |
|-------|---------|
| `media` | Images, videos, and other media assets |
| `articles` | Blog posts and articles |
| `pages` | Static pages |
| `tags` | Article categorization |
| `article_tags` | Many-to-many article-tag relationships |
| `users` | User accounts with roles |
| `sessions` | Active user sessions |
| `settings` | Site configuration (single row) |

### Apply Schema
```bash
wrangler d1 execute peabod-db --file=./schema.sql
```

---

## Troubleshooting

Check `docs/LESSONS-LEARNED.md` for documented solutions to past problems.

### Common Issues

**Build doesn't reflect changes:**
Use `npx @opennextjs/cloudflare build` instead of `npm run build`

**Video upload fails:**
Cloudflare Stream direct uploads use FormData POST, not TUS protocol

**Dynamic metadata not working:**
Use `generateMetadata()` function instead of static metadata export

**D1 database queries failing:**
Ensure you're using `await getDb()` and proper prepared statements with `.bind()`

**R2 media not loading:**
Check that the `MEDIA` binding exists in `wrangler.toml` and the path is correct

**Authentication issues:**
Verify session cookie is set and `getSessionUser()` returns a valid user

**Tests failing with mock errors:**
Ensure `@opennextjs/cloudflare` is properly mocked in test setup

### Debugging Tips

| Issue Type | Agent/Skill to Use |
|------------|-------------------|
| Runtime errors | `code-debugger` agent |
| Performance issues | `/performance-auditing` skill |
| Accessibility problems | `accessibility-auditor` agent |
| SEO issues | `seo-performance-auditor` agent |
| UI/UX problems | `ux-architect` agent |
| API design questions | `/api-designing` skill |

---

## Future Plans

Future plans and planning ideas are documented in `docs/FUTURE-PLANS.md`. When discussing or proposing new features, enhancements, or architectural changes, write them to that file.

---

## Additional Documentation

### Project Documentation
| Document | Purpose |
|----------|---------|
| `docs/TESTING-PLAN.md` | Comprehensive testing strategy with coverage goals |
| `docs/GIT-WORKFLOW.md` | Git branching, commit conventions, and PR process |
| `docs/LESSONS-LEARNED.md` | Documented solutions to past problems |
| `docs/STATE-MACHINES.md` | React state patterns used in components |
| `docs/FUTURE-PLANS.md` | Planned features and enhancements |

### Configuration Files
| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare Workers configuration (D1, R2, routes) |
| `schema.sql` | D1 database schema |
| `migrations/` | Database migration files |
| `vitest.config.ts` | Unit test configuration |
| `playwright.config.ts` | E2E test configuration |
| `eslint.config.mjs` | ESLint rules and ignores |
| `tsconfig.json` | TypeScript configuration (strict mode) |

### Key Source Directories
| Directory | Purpose |
|-----------|---------|
| `src/app/(public)/` | Public-facing pages and layouts |
| `src/app/admin/` | Admin dashboard pages and API routes |
| `src/app/api/` | Public API routes (auth, media) |
| `src/lib/` | Shared utilities and helpers |
| `src/components/` | Reusable React components |
| `src/test/` | Test setup, mocks, and utilities |
