# Peabod Web

[![CI](https://github.com/paulirv/peabod-web/actions/workflows/ci.yml/badge.svg)](https://github.com/paulirv/peabod-web/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/paulirv/peabod-web/actions/workflows/e2e.yml/badge.svg)](https://github.com/paulirv/peabod-web/actions/workflows/e2e.yml)

Next.js application for [peabod.com](https://peabod.com) - a personal blog and CMS deployed to Cloudflare Workers.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Deployment**: Cloudflare Workers via OpenNext
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (images), Cloudflare Stream (video)
- **Styling**: Tailwind CSS 4

## Features

### Public Site
- Blog articles with tags
- Static pages
- User registration and authentication
- User profiles
- Multi-theme support

### Admin Dashboard (`/admin`)
- Article management (create, edit, publish)
- Page management
- Tag management
- Media library with image EXIF extraction and video upload via Cloudflare Stream
- Featured media support (images or videos) for articles and pages
- User management with role-based access (admin, editor, author)

## Getting Started

### Prerequisites
- Node.js 20+
- Cloudflare account with D1 and R2 configured

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Setup

Apply the schema to your D1 database:

```bash
wrangler d1 execute peabod-db --file=./schema.sql
```

Or run migrations incrementally:

```bash
wrangler d1 execute peabod-db --file=./migrations/001_add_media_table.sql
wrangler d1 execute peabod-db --file=./migrations/002_add_users_sessions.sql
wrangler d1 execute peabod-db --file=./migrations/003_add_user_roles.sql
wrangler d1 execute peabod-db --file=./migrations/004_add_stream_video_fields.sql
```

### Testing

Run unit tests:

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:ui       # Visual UI mode
```

Run E2E tests:

```bash
npm run test:e2e         # Headless
npm run test:e2e:headed  # With browser visible
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:report  # View test report
```

### Deployment

Build and deploy to Cloudflare Workers:

```bash
npx @opennextjs/cloudflare build
npx wrangler deploy
```

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public routes (home, articles, pages)
│   ├── admin/             # Admin dashboard
│   │   ├── (dashboard)/   # Authenticated admin pages
│   │   ├── api/           # Admin API routes
│   │   └── login/         # Admin login page
│   └── api/               # Public API routes (auth, media)
├── components/
│   ├── admin/             # Admin UI components
│   └── ...                # Shared components
├── lib/                   # Utilities (auth, db, session)
└── types/                 # TypeScript types
```

## Environment

Configured via `wrangler.toml`:
- `DB` - D1 database binding
- `MEDIA` - R2 bucket binding
- `CF_ACCOUNT_ID` - Cloudflare account ID (for Stream API)
- `STREAM_CUSTOMER_SUBDOMAIN` - Cloudflare Stream customer subdomain
- `ENVIRONMENT` - production/development

Secrets (via `wrangler secret put`):
- `CF_API_TOKEN` - Cloudflare API token with Stream:Edit permission

## Authentication

Two auth mechanisms:
1. **Session-based** - Cookie authentication for admin access
2. **Cloudflare Zero Trust** - Optional enterprise SSO (when enabled)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
