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

## Cloudflare Stream Direct Uploads

**Date:** 2026-01-10

**Problem:** Video uploads to Cloudflare Stream were failing with "Decoding Error" when using the TUS protocol with tus-js-client.

**Root Cause:** The Cloudflare Stream `/stream/direct_upload` API endpoint returns a one-time upload URL designed for **basic uploads** (simple POST with FormData), not for TUS resumable uploads. When tus-js-client tried to use TUS protocol methods (PATCH requests, Upload-Metadata headers), Cloudflare rejected them.

The error messages were:
- "Decoding Error: A portion of the request could be not decoded"
- "Basic uploads must be made using POST method"

**Solution:** Use a simple FormData POST upload with XMLHttpRequest instead of TUS:

```typescript
// Get upload URL from our API
const { uploadURL, uid } = await getUploadUrl();

// Upload using FormData with XMLHttpRequest for progress tracking
const formData = new FormData();
formData.append("file", file);

const xhr = new XMLHttpRequest();
xhr.upload.addEventListener("progress", (e) => {
  if (e.lengthComputable) {
    const percentage = Math.round((e.loaded / e.total) * 100);
    setProgress(percentage);
  }
});

xhr.open("POST", uploadURL);
xhr.send(formData);
```

**Key Insight:** Cloudflare Stream's `/stream/direct_upload` endpoint is for basic uploads. TUS resumable uploads require a different setup where the TUS client POSTs to your own backend endpoint, which then forwards TUS headers to Cloudflare and returns a Location header. For most use cases, basic uploads with progress tracking are sufficient and simpler.

**Bonus:** Removing tus-js-client reduced the page bundle size by ~21kB.

---

## Dynamic Favicon with generateMetadata

**Date:** 2026-01-10

**Problem:** Needed to serve a dynamic favicon from the database (via site settings) instead of using static favicon files.

**Solution:** Convert the root layout from static metadata export to a `generateMetadata()` function that fetches settings at request time:

```typescript
// src/app/layout.tsx
import { getPublicSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();

  const metadata: Metadata = {
    title: settings?.site_name || "Site Name",
    description: settings?.site_description || "",
    // ...
  };

  if (settings?.site_icon_path) {
    metadata.icons = {
      icon: `/api/media/${settings.site_icon_path}`,
      apple: `/api/media/${settings.site_icon_path}`,
    };
  }

  return metadata;
}
```

**Key Insights:**
- `generateMetadata()` runs on the server for each request, allowing dynamic values
- Icons can point to API routes that serve media from R2 or other storage
- For best favicon results, use a square image (recommended: 512x512 PNG)
- Build-time warnings about `getCloudflareContext` during static generation are expected and don't affect runtime

**Related Files:**
- `src/app/layout.tsx` - Root layout with generateMetadata
- `src/lib/settings.ts` - Public settings helper with site_icon_path

---
