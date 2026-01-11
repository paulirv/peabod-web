# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Deploy Commands

**Development:**
```bash
npm run dev          # Start dev server (localhost:3000)
```

**Deployment to Cloudflare Workers:**
```bash
npx @opennextjs/cloudflare build   # Build for Cloudflare (NOT npm run build)
npx wrangler deploy                 # Deploy to production
```

> **Important:** Do NOT use `npm run build` for deployment. It only creates `.next` but Wrangler deploys from `.open-next`. Always use the OpenNext build command. See `docs/LESSONS-LEARNED.md` for details.

**Testing:**
```bash
npm test                    # Run unit tests (Vitest)
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npx vitest run src/lib/__tests__/session.test.ts  # Single test file

npm run test:e2e            # E2E tests (Playwright)
npm run test:e2e:headed     # E2E with visible browser
```

**Linting:**
```bash
npm run lint
```

## Architecture Overview

This is a Next.js 15 App Router application deployed to Cloudflare Workers via OpenNext.

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
- `src/lib/db.ts` - D1 database helper
- `src/lib/session.ts` - Cookie-based session management
- `src/lib/auth.ts` - Auth helpers (session + Zero Trust)
- `src/lib/api-auth.ts` - API route auth middleware
- `src/lib/themes.ts` - Theme definitions
- `src/lib/image.ts` - Cloudflare Image Transformations

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

## Database

Schema in `schema.sql`. Migrations in `migrations/`.

Apply schema:
```bash
wrangler d1 execute peabod-db --file=./schema.sql
```

## Git Workflow

Follow the workflow documented in `docs/GIT-WORKFLOW.md`.

**Key points:**
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`
- Branch naming: `feature/*`, `fix/*`, `refactor/*`, `docs/*`
- Do NOT include `Co-Authored-By` lines in commit messages
- Keep subject lines under 72 characters, use imperative mood

## Troubleshooting

Check `docs/LESSONS-LEARNED.md` for documented solutions to past problems.
