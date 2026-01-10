# Peabod Web

Next.js application for [peabod.com](https://peabod.com) - a personal blog and CMS deployed to Cloudflare Workers.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Deployment**: Cloudflare Workers via OpenNext
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (media/images)
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
- Media library with EXIF extraction
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
- `ENVIRONMENT` - production/development

## Authentication

Two auth mechanisms:
1. **Session-based** - Cookie authentication for admin access
2. **Cloudflare Zero Trust** - Optional enterprise SSO (when enabled)

## License

Private
