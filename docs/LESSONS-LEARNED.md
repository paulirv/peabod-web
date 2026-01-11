# Lessons Learned

A collection of lessons learned during development of this project.

---

## OpenNext + Cloudflare Workers Deployment

**Date:** 2026-01-10

**Problem:** After making code changes, running `npm run build` and `npx wrangler deploy` did not update the live site at peabod.com.

**Root Cause:** This project uses `@opennextjs/cloudflare` to deploy a Next.js app to Cloudflare Workers. The standard `npm run build` command only creates the `.next` directory (Next.js build output), but Wrangler deploys from the `.open-next` directory.

When running `npx wrangler deploy`, it was deploying the **stale** `.open-next` directory from a previous OpenNext build, not the fresh `.next` build.

**Solution:** Use the OpenNext build command instead of (or after) the standard Next.js build:

```bash
# Wrong - only builds .next directory
npm run build

# Correct - builds .next AND .open-next directories
npx @opennextjs/cloudflare build
```

Then deploy:

```bash
npx wrangler deploy
```

**Correct Deployment Workflow:**

```bash
# 1. Build with OpenNext (this also runs next build internally)
npx @opennextjs/cloudflare build

# 2. Deploy to Cloudflare Workers
npx wrangler deploy
```

**How to Verify:** After deployment, check if new assets were uploaded. A successful deploy with changes will show something like:

```
🌀 Found 5 new or modified static assets to upload. Proceeding with upload...
```

If it says "No updated asset files to upload" but you made frontend changes, the `.open-next` directory is stale and needs to be rebuilt with the OpenNext build command.

---
